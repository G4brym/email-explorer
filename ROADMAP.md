# Email Explorer - Product Roadmap

This document outlines the planned features and their implementation details for the Email Explorer project.

## Phase 1: Core Security & Functionality

### 1. Authentication & User Management 🔒

**Priority:** Critical  
**Estimated Effort:** 2-3 weeks

#### Overview
Implement comprehensive authentication system to secure mailbox access and support multiple users using a singleton Durable Object.

#### Implementation Details

**Architecture Decision:**
- Reuse the existing `MailboxDO` class for authentication
- Use a singleton instance (via name-based ID) as the auth manager
- Dynamically detect if the DO is the auth singleton or a regular mailbox
- Apply appropriate migrations based on the DO's purpose
- Simplifies deployment - only one DO class to manage

**MailboxDO Setup with Dual Purpose:**
```typescript
// src/durableObject/index.ts
export class MailboxDO {
  private sql: SqlStorage
  private isAuthDO: boolean
  
  constructor(state: DurableObjectState, env: Env) {
    this.sql = state.storage.sql
    
    // Detect if this is the auth singleton based on the DO name
    // The auth DO uses a special reserved name
    this.isAuthDO = state.id.name === 'AUTH'
    
    // Apply appropriate migrations
    if (this.isAuthDO) {
      this.initializeAuthTables()
    } else {
      this.initializeMailboxTables()
    }
  }
  
  private async initializeAuthTables() {
    // Auth-specific tables for the singleton DO
    await this.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,  -- 1 for admin, 0 for regular user
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS user_mailboxes (
        user_id TEXT NOT NULL,
        mailbox_id TEXT NOT NULL,
        role TEXT NOT NULL, -- 'owner', 'admin', 'read', 'write'
        PRIMARY KEY (user_id, mailbox_id)
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `)
  }
  
  private async initializeMailboxTables() {
    // Regular mailbox tables (existing migrations)
    await this.sql.exec(`
      CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        -- ... existing email schema
      );
      
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        -- ... existing folder schema
      );
      
      -- ... other mailbox tables
    `)
  }
  
  async fetch(request: Request): Promise<Response> {
    // Route to appropriate handler based on DO type
    if (this.isAuthDO) {
      return this.handleAuthRequest(request)
    } else {
      return this.handleMailboxRequest(request)
    }
  }
  
  private async handleAuthRequest(request: Request): Promise<Response> {
    // Auth-specific request handling
    const url = new URL(request.url)
    
    if (url.pathname === '/has-users') {
      const hasUsers = await this.hasUsers()
      return Response.json({ hasUsers })
    }
    
    if (url.pathname === '/is-admin') {
      const userId = request.headers.get('X-User-ID')
      const isAdmin = await this.isAdmin(userId)
      return Response.json({ isAdmin })
    }
    
    // Handle register, login, etc.
    // ...
  }
  
  private async handleMailboxRequest(request: Request): Promise<Response> {
    // Regular mailbox request handling (existing code)
    // ...
  }
  
  // Auth helper methods
  async hasUsers(): Promise<boolean> {
    if (!this.isAuthDO) return false
    const result = await this.sql.exec('SELECT COUNT(*) as count FROM users')
    return result.rows[0].count > 0
  }
  
  async isAdmin(userId: string): Promise<boolean> {
    if (!this.isAuthDO) return false
    const result = await this.sql.exec(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    )
    return result.rows[0]?.is_admin === 1
  }
}
```

**Configuration Settings:**
Configuration is passed to the `EmailExplorer` factory function via the options parameter:

```typescript
// src/index.ts
interface EmailExplorerOptions {
  auth?: {
    enabled?: boolean
    registerEnabled?: boolean
  }
  // Future settings can be added here
}

const defaultOptions: EmailExplorerOptions = {
  auth: {
    enabled: false,
    registerEnabled: undefined  // undefined = allow first user only, then auto-disable
  }
}

export function EmailExplorer(_options: EmailExplorerOptions = {}) {
  // Merge user options with defaults
  const options = {
    auth: {
      ...defaultOptions.auth,
      ..._options.auth
    }
  }

  return {
    async email(
      event: { raw: ReadableStream; rawSize: number },
      env: Env,
      context: ExecutionContext,
    ) {
      await receiveEmail(event, env, context)
    },
    
    async fetch(request: Request, env: Env, context: ExecutionContext) {
      // Check if auth is required
      if (options.auth.enabled && !isAuthRoute(request)) {
        const session = await validateSession(request, env)
        if (!session) {
          return new Response('Unauthorized', { status: 401 })
        }
      }
      
      // Make options available to routes via env
      env.config = options
      
      return app.fetch(request, env, context)
    }
  }
}

// Helper functions
function isAuthRoute(request: Request): boolean {
  const url = new URL(request.url)
  return url.pathname.startsWith('/api/v1/auth/')
}

async function validateSession(request: Request, env: Env): Promise<Session | null> {
  // Get session token from cookie or Authorization header
  const token = getSessionToken(request)
  if (!token) return null
  
  // Validate with the auth singleton DO (using MAILBOX binding with special name)
  const authId = env.MAILBOX.idFromName('AUTH')
  const authDO = env.MAILBOX.get(authId)
  const response = await authDO.fetch(new Request('http://auth/validate', {
    headers: { 'Authorization': `Bearer ${token}` }
  }))
  
  if (response.ok) {
    return await response.json()
  }
  return null
}

function getSessionToken(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Try cookie
  const cookie = request.headers.get('Cookie')
  if (cookie) {
    const match = cookie.match(/session=([^;]+)/)
    return match ? match[1] : null
  }
  
  return null
}

// Export with configuration
export default EmailExplorer({
  auth: {
    enabled: true,
    registerEnabled: false // Set to true initially, then disable after creating users
  }
})
```

**Usage Examples:**
```typescript
// src/index.ts - Example configurations

// RECOMMENDED: Smart Mode - First user becomes admin, then registration closes
export default EmailExplorer({
  auth: {
    enabled: true
    // registerEnabled is undefined by default = smart mode
  }
})

// Open Registration: Anyone can register (useful for testing/development)
export default EmailExplorer({
  auth: {
    enabled: true,
    registerEnabled: true
  }
})

// Locked Down: Only admins can create users
export default EmailExplorer({
  auth: {
    enabled: true,
    registerEnabled: false
  }
})

// No Auth Mode: For testing or single-user deployments
export default EmailExplorer({
  auth: {
    enabled: false
  }
})

// Default (no options): Auth disabled
export default EmailExplorer()
```

**Smart Mode Workflow:**
1. Deploy with auth enabled (no `registerEnabled` specified)
2. First user registers → becomes admin automatically
3. Registration endpoint automatically closes after first user
4. Admin can create additional users via `/api/v1/auth/admin/register`
5. Admin can grant mailbox access to users

**wrangler.jsonc Configuration:**
```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "MAILBOX",
        "class_name": "MailboxDO",
        "script_name": "email-explorer"
      }
    ]
  }
}
```

**Note:** No separate AUTH binding needed. The same `MailboxDO` class handles both auth (when accessed via `idFromName('AUTH')`) and mailbox functionality (when accessed normally).

- Add authentication middleware to all API routes
- Implement JWT-based session management
- Add password hashing with bcrypt or argon2
- All user data isolated in AUTH DO for security

**New API Endpoints:**
```typescript
// Public endpoints
POST /api/v1/auth/register       // Smart registration (first user or if enabled)
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET /api/v1/auth/me
POST /api/v1/auth/refresh

// Admin-only endpoints
POST /api/v1/auth/admin/register        // Admins can register users anytime
POST /api/v1/auth/admin/grant-access    // Grant user access to mailbox
DELETE /api/v1/auth/admin/revoke-access // Revoke user access from mailbox
GET /api/v1/auth/admin/users            // List all users
PUT /api/v1/auth/admin/users/:id        // Update user (promote to admin, etc)
```

**Registration Logic:**
- `registerEnabled === undefined` (default): First user only, becomes admin automatically
- `registerEnabled === true`: Open registration for anyone
- `registerEnabled === false`: No public registration, only admins can create users
- First registered user is always set as admin (`is_admin = 1`)
- Admins can register users regardless of `registerEnabled` setting

**Route Implementation Example:**
```typescript
// In your Hono routes - options passed via env.config
app.post('/api/v1/auth/register', async (c) => {
  // Access the auth singleton using MAILBOX binding with special name
  const authId = c.env.MAILBOX.idFromName('AUTH')
  const authDO = c.env.MAILBOX.get(authId)
  
  // Check registration eligibility
  const registerEnabled = c.env.config?.auth?.registerEnabled
  
  if (registerEnabled === false) {
    // Explicitly disabled - no registration allowed
    return c.json({ error: 'Registration is disabled' }, 403)
  }
  
  if (registerEnabled === undefined) {
    // Smart mode: Allow first user only
    const checkResponse = await authDO.fetch(
      new Request('http://auth/has-users')
    )
    const { hasUsers } = await checkResponse.json()
    
    if (hasUsers) {
      return c.json({ 
        error: 'Registration is closed. Contact an administrator.' 
      }, 403)
    }
  }
  
  // If registerEnabled === true or first user, proceed with registration
  const { email, password } = await c.req.json()
  return authDO.fetch(c.req.raw)
})

// Admin-only endpoint to register new users
app.post('/api/v1/auth/admin/register', async (c) => {
  // Verify admin status from session
  const session = c.get('session')  // Set by auth middleware
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const authId = c.env.MAILBOX.idFromName('AUTH')
  const authDO = c.env.MAILBOX.get(authId)
  
  // Check if current user is admin
  const isAdminResponse = await authDO.fetch(
    new Request('http://auth/is-admin', {
      headers: { 'X-User-ID': session.userId }
    })
  )
  const { isAdmin } = await isAdminResponse.json()
  
  if (!isAdmin) {
    return c.json({ error: 'Admin privileges required' }, 403)
  }
  
  // Admin can register users
  const { email, password, mailboxIds } = await c.req.json()
  return authDO.fetch(c.req.raw)
})

// Admin endpoint to grant mailbox access
app.post('/api/v1/auth/admin/grant-access', async (c) => {
  const session = c.get('session')
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const authId = c.env.MAILBOX.idFromName('AUTH')
  const authDO = c.env.MAILBOX.get(authId)
  
  // Verify admin
  const isAdminResponse = await authDO.fetch(
    new Request('http://auth/is-admin', {
      headers: { 'X-User-ID': session.userId }
    })
  )
  const { isAdmin } = await isAdminResponse.json()
  
  if (!isAdmin) {
    return c.json({ error: 'Admin privileges required' }, 403)
  }
  
  // Grant access to mailbox
  const { userId, mailboxId, role } = await c.req.json()
  return authDO.fetch(c.req.raw)
})

app.post('/api/v1/auth/login', async (c) => {
  // Login is always available when auth is enabled
  const authId = c.env.MAILBOX.idFromName('AUTH')
  const authDO = c.env.MAILBOX.get(authId)
  return authDO.fetch(c.req.raw)
})
```

**Type Definition Update:**
```typescript
// src/types.ts or at top of index.ts
interface Env {
  MAILBOX: DurableObjectNamespace  // Handles both auth and mailbox DOs
  BUCKET: R2Bucket
  config?: EmailExplorerOptions  // Configuration options
}
```

**How the Dual-Purpose DO Works:**
```typescript
// For authentication - use special name 'AUTH'
const authDO = env.MAILBOX.get(env.MAILBOX.idFromName('AUTH'))

// For regular mailboxes - use email address or other identifier
const mailboxDO = env.MAILBOX.get(env.MAILBOX.idFromString('user@example.com'))

// The MailboxDO constructor automatically detects which mode based on the ID name
// state.id.name === 'AUTH' → auth mode
// state.id.name !== 'AUTH' → mailbox mode
```

**Frontend Changes:**
- Create login/register views (`Login.vue`, `Register.vue`)
- Add authentication store in Pinia
- Implement route guards in Vue Router
- Add token storage (httpOnly cookies or localStorage)
- Create ProtectedRoute wrapper component
- Add admin panel UI:
  - User management view (`AdminUsers.vue`)
  - Create user form with mailbox assignment
  - Grant/revoke mailbox access interface
  - User list with admin badge indicators
  - Promote user to admin functionality

**Security Considerations:**
- Rate limiting on auth endpoints
- CSRF protection
- Secure password requirements
- Optional 2FA implementation

---

### 2. Reply & Forward Functionality ↩️

**Priority:** High  
**Estimated Effort:** 1 week

#### Overview
Add core email client features for replying to and forwarding emails.

#### Implementation Details

**Backend Changes:**
- Modify email sending endpoint to support reply/forward metadata
- Add `in_reply_to` and `references` headers for threading
- Update email schema to track conversation threads

**Database Schema Update:**
```sql
ALTER TABLE emails ADD COLUMN in_reply_to TEXT;
ALTER TABLE emails ADD COLUMN references TEXT; -- JSON array of message IDs
ALTER TABLE emails ADD COLUMN thread_id TEXT;
```

**API Endpoint Updates:**
```typescript
POST /api/v1/mailboxes/:mailboxId/emails/:emailId/reply
POST /api/v1/mailboxes/:mailboxId/emails/:emailId/forward
```

**Frontend Changes:**
- Add Reply, Reply All, Forward buttons to `EmailDetail.vue`
- Create reply mode in `ComposeEmail.vue`
- Pre-populate fields:
  - Reply: Original sender as recipient, "Re: " prefix
  - Reply All: All recipients + sender, "Re: " prefix
  - Forward: Empty recipients, "Fwd: " prefix, attachments included
- Add quoted text formatting with `>` prefix
- Show reply context in compose modal

**UX Considerations:**
- Collapsible quoted text in replies
- Option to include/exclude attachments on forward

---

### 3. Rich Text Email Editor ✍️

**Priority:** High  
**Estimated Effort:** 1-2 weeks

#### Overview
Replace plain text editor with WYSIWYG rich text editor for HTML email composition.

#### Implementation Details

**Technology Choice:**
- **Recommended:** TipTap (Vue 3 native, extensible)
- **Alternative:** Quill.js (mature, well-documented)

**Installation:**
```bash
cd packages/dashboard
pnpm add @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-color @tiptap/extension-highlight
```

**Frontend Changes:**
- Create `RichTextEditor.vue` component
- Add toolbar with formatting buttons:
  - Basic: Bold, Italic, Underline, Strikethrough
  - Lists: Bullet, Numbered, Checklist
  - Alignment: Left, Center, Right, Justify
  - Insert: Link, Image, Horizontal Rule
  - Formatting: Headings, Code, Blockquote
  - Colors: Text color, Background color
- Implement HTML to text conversion for plain text fallback
- Add source code view toggle

**Backend Changes:**
- Ensure email sending supports both HTML and plain text parts
- Sanitize HTML content to prevent XSS
- Validate HTML structure

**Example Implementation:**
```vue
<template>
  <div class="rich-text-editor">
    <div class="toolbar">
      <button @click="editor.chain().focus().toggleBold().run()">Bold</button>
      <!-- More buttons -->
    </div>
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const editor = useEditor({
  extensions: [StarterKit],
  content: props.modelValue,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})
</script>
```

**Features:**
- Real-time preview
- Paste from Word/Google Docs with formatting cleanup
- Emoji picker integration
- Saved formatting preferences

---

### 4. Attachment Upload in Compose 📎

**Priority:** High  
**Estimated Effort:** 1 week

#### Overview
Enable file attachments when composing new emails or forwarding.

#### Implementation Details

**Backend Changes:**
- Create multipart form-data endpoint for file uploads
- Store attachments temporarily in R2 during composition
- Move to permanent storage on send
- Implement file size limits (e.g., 25MB per file, 50MB total)

**New API Endpoints:**
```typescript
POST /api/v1/mailboxes/:mailboxId/drafts/:draftId/attachments
DELETE /api/v1/mailboxes/:mailboxId/drafts/:draftId/attachments/:attachmentId
GET /api/v1/mailboxes/:mailboxId/drafts/:draftId/attachments/:attachmentId
```

**R2 Storage Structure:**
```
/drafts/{mailboxId}/{draftId}/{attachmentId}
/emails/{mailboxId}/{emailId}/{attachmentId}
```

**Frontend Changes:**
- Add file input to `ComposeEmail.vue`
- Implement drag-and-drop zone
- Show upload progress bar
- Display attached files with:
  - Filename, size, type
  - Remove button
  - Preview for images
- Validate file types and sizes client-side

**Component Structure:**
```vue
<div class="attachments-section">
  <div class="attachment-dropzone" @drop="handleDrop" @dragover.prevent>
    <input type="file" multiple @change="handleFileSelect" />
    <p>Drag files here or click to browse</p>
  </div>
  
  <div v-for="file in attachments" class="attachment-item">
    <img v-if="isImage(file)" :src="file.preview" />
    <div class="file-info">
      <span>{{ file.name }}</span>
      <span>{{ formatBytes(file.size) }}</span>
      <progress :value="file.progress" max="100"></progress>
    </div>
    <button @click="removeAttachment(file.id)">Remove</button>
  </div>
</div>
```

**Considerations:**
- Chunked upload for large files
- Resume upload capability
- Virus scanning integration (ClamAV or cloud service)
- MIME type validation
- Thumbnail generation for images

---

## Phase 2: Organization & Productivity

### 5. Advanced Search & Filters 🔍

**Priority:** Medium-High  
**Estimated Effort:** 2 weeks

#### Overview
Implement powerful search with filters, operators, and saved searches.

#### Implementation Details

**Backend Changes:**
- **Note:** FTS5 (Full-Text Search) is supported in Cloudflare D1 databases
- Search should be performed inside each MailboxDO's SQLite database
- Add full-text search indexes in each DO:
  ```sql
  CREATE VIRTUAL TABLE emails_fts USING fts5(
    email_id,
    subject,
    body,
    sender,
    recipient,
    content='emails'
  );
  ```
- Implement search query parser for operators
- Add filter parameters to email list endpoint
- Search is scoped per mailbox within the DO for performance

**Search Query Syntax:**
```
from:john@example.com
to:jane@example.com
subject:"meeting notes"
has:attachment
is:unread
is:starred
before:2024-01-01
after:2024-01-01
larger:5MB
filename:report.pdf
```

**API Endpoints:**
```typescript
GET /api/v1/mailboxes/:mailboxId/search?q=query&filters={}
POST /api/v1/mailboxes/:mailboxId/saved-searches
GET /api/v1/mailboxes/:mailboxId/saved-searches
DELETE /api/v1/mailboxes/:mailboxId/saved-searches/:id
```

**Frontend Changes:**
- Create `AdvancedSearch.vue` component with filter UI
- Add search suggestions dropdown
- Show recent searches
- Create saved search management in sidebar
- Add date range picker
- File size filter slider

**Search Interface:**
```vue
<div class="advanced-search">
  <input v-model="query" placeholder="Search emails..." />
  
  <div class="filters">
    <select v-model="filters.from">
      <option value="">From: Anyone</option>
      <!-- Contact suggestions -->
    </select>
    
    <select v-model="filters.folder">
      <option value="">All Folders</option>
      <!-- Folder list -->
    </select>
    
    <date-range-picker v-model="filters.dateRange" />
    
    <label>
      <input type="checkbox" v-model="filters.hasAttachment" />
      Has attachments
    </label>
    
    <label>
      <input type="checkbox" v-model="filters.isUnread" />
      Unread only
    </label>
  </div>
  
  <button @click="saveSearch">Save this search</button>
</div>
```

**Optimization:**
- Cache frequently searched queries
- Implement search result pagination
- Add search result highlighting
- Real-time search suggestions

---

### 6. Email Signatures ✒️

**Priority:** Medium  
**Estimated Effort:** 3-4 days

#### Overview
Allow users to create and manage email signatures that auto-append to outgoing emails.

#### Implementation Details

**Database Schema:**
```sql
CREATE TABLE signatures (
  id TEXT PRIMARY KEY,
  mailbox_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL, -- HTML content
  is_default INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**API Endpoints:**
```typescript
GET /api/v1/mailboxes/:mailboxId/signatures
POST /api/v1/mailboxes/:mailboxId/signatures
PUT /api/v1/mailboxes/:mailboxId/signatures/:id
DELETE /api/v1/mailboxes/:mailboxId/signatures/:id
PUT /api/v1/mailboxes/:mailboxId/signatures/:id/default
```

**Frontend Changes:**
- Add signature editor in `Settings.vue`
- Use rich text editor for signature content
- Add signature selector dropdown in compose
- Auto-append default signature on compose open
- Support signature variables:
  - `{{name}}` - User name
  - `{{email}}` - Email address
  - `{{date}}` - Current date
  - `{{company}}` - Company name

**Signature Editor:**
```vue
<div class="signature-manager">
  <h2>Email Signatures</h2>
  
  <div v-for="sig in signatures" class="signature-item">
    <input v-model="sig.name" placeholder="Signature name" />
    <RichTextEditor v-model="sig.content" />
    <label>
      <input type="radio" :value="sig.id" v-model="defaultSignatureId" />
      Set as default
    </label>
    <button @click="deleteSignature(sig.id)">Delete</button>
  </div>
  
  <button @click="createSignature">New Signature</button>
</div>
```

**Features:**
- Multiple signatures per mailbox
- Reply signature vs. new email signature
- Image upload for logos
- Social media links
- Signature preview

---

### 7. Keyboard Shortcuts ⌨️

**Priority:** Medium  
**Estimated Effort:** 3-4 days

#### Overview
Implement comprehensive keyboard shortcuts for power users.

#### Implementation Details

**Shortcut Mapping:**
```typescript
const shortcuts = {
  // Navigation
  'j': 'Next email',
  'k': 'Previous email',
  'u': 'Back to list',
  'g i': 'Go to Inbox',
  'g s': 'Go to Sent',
  'g d': 'Go to Drafts',
  
  // Actions
  'c': 'Compose',
  'r': 'Reply',
  'a': 'Reply all',
  'f': 'Forward',
  '/': 'Focus search',
  
  // Email management
  'e': 'Archive',
  's': 'Star/unstar',
  'x': 'Select',
  '#': 'Delete',
  '!': 'Mark as spam',
  'u': 'Mark as unread',
  'shift+u': 'Mark as read',
  
  // Navigation
  'n': 'Next conversation',
  'p': 'Previous conversation',
  'enter': 'Open email',
  'esc': 'Close/cancel',
  
  // Help
  '?': 'Show shortcuts'
}
```

**Implementation:**
```typescript
// composables/useKeyboardShortcuts.ts
export function useKeyboardShortcuts() {
  const router = useRouter()
  const emailStore = useEmailStore()
  const uiStore = useUIStore()
  
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ignore if typing in input
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
    
    const key = e.key
    const combo = [
      e.ctrlKey && 'ctrl',
      e.shiftKey && 'shift',
      e.metaKey && 'meta',
      key
    ].filter(Boolean).join('+')
    
    switch (combo) {
      case 'c':
        uiStore.openComposeModal()
        break
      case 'r':
        if (emailStore.currentEmail) {
          replyToEmail(emailStore.currentEmail)
        }
        break
      // ... more shortcuts
    }
  }
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeyPress)
  })
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress)
  })
}
```

**Frontend Changes:**
- Create `KeyboardShortcuts.vue` overlay (triggered by `?`)
- Add visual feedback when shortcuts are used
- Create settings page for customizable shortcuts
- Add shortcut hints in tooltips

**Shortcut Help Modal:**
```vue
<div v-if="showShortcuts" class="shortcuts-modal">
  <h2>Keyboard Shortcuts</h2>
  
  <section>
    <h3>Navigation</h3>
    <div class="shortcut-item">
      <kbd>j</kbd> / <kbd>k</kbd>
      <span>Next/Previous email</span>
    </div>
    <!-- More shortcuts -->
  </section>
  
  <section>
    <h3>Actions</h3>
    <!-- More shortcuts -->
  </section>
</div>
```

---

### 8. Email Drafts Auto-Save 💾

**Priority:** Medium  
**Estimated Effort:** 3-4 days

#### Overview
Automatically save email drafts to prevent data loss during composition.

#### Implementation Details

**Backend Changes:**
- Modify email table to support draft status
- Add draft-specific endpoints

**Database Updates:**
```sql
ALTER TABLE emails ADD COLUMN is_draft INTEGER DEFAULT 0;
ALTER TABLE emails ADD COLUMN last_edited_at INTEGER;
CREATE INDEX idx_emails_drafts ON emails(mailbox_id, is_draft) WHERE is_draft = 1;
```

**API Endpoints:**
```typescript
POST /api/v1/mailboxes/:mailboxId/drafts
PUT /api/v1/mailboxes/:mailboxId/drafts/:draftId
DELETE /api/v1/mailboxes/:mailboxId/drafts/:draftId
GET /api/v1/mailboxes/:mailboxId/drafts
```

**Frontend Implementation:**
```typescript
// Auto-save composable
export function useDraftAutoSave(mailboxId: string) {
  const draftId = ref<string | null>(null)
  const isDirty = ref(false)
  const isSaving = ref(false)
  const lastSaved = ref<Date | null>(null)
  
  let saveTimeout: NodeJS.Timeout
  
  const saveDraft = async (data: EmailDraft) => {
    isSaving.value = true
    
    try {
      if (draftId.value) {
        await api.put(`/mailboxes/${mailboxId}/drafts/${draftId.value}`, data)
      } else {
        const response = await api.post(`/mailboxes/${mailboxId}/drafts`, data)
        draftId.value = response.data.id
      }
      
      lastSaved.value = new Date()
      isDirty.value = false
    } finally {
      isSaving.value = false
    }
  }
  
  const scheduleSave = (data: EmailDraft) => {
    isDirty.value = true
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => saveDraft(data), 2000) // 2 second debounce
  }
  
  return { draftId, isDirty, isSaving, lastSaved, scheduleSave, saveDraft }
}
```

**UX Changes:**
- Show "Saving..." / "Saved" indicator
- Display last saved timestamp
- Warn before closing with unsaved changes
- Add "Discard draft" button
- Resume draft from drafts folder

**Save Indicator:**
```vue
<div class="save-indicator">
  <span v-if="isSaving" class="text-gray-500">
    <svg class="animate-spin">...</svg>
    Saving...
  </span>
  <span v-else-if="lastSaved" class="text-green-600">
    <svg>✓</svg>
    Saved {{ formatRelativeTime(lastSaved) }}
  </span>
  <span v-else-if="isDirty" class="text-yellow-600">
    Unsaved changes
  </span>
</div>
```

---

---

## Phase 3: Future Features

The following features are planned for future implementation after core functionality is stable.

### 9. Labels/Tags System 🏷️

**Priority:** Low (Future)  
**Estimated Effort:** 1 week

#### Overview
Implement flexible labeling system allowing multiple labels per email.

#### Implementation Details

**Database Schema:**
```sql
CREATE TABLE labels (
  id TEXT PRIMARY KEY,
  mailbox_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL, -- Hex color code
  created_at INTEGER NOT NULL
);

CREATE TABLE email_labels (
  email_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  PRIMARY KEY (email_id, label_id)
);

CREATE INDEX idx_email_labels_label ON email_labels(label_id);
CREATE INDEX idx_email_labels_email ON email_labels(email_id);
```

**API Endpoints:**
```typescript
// Label management
GET /api/v1/mailboxes/:mailboxId/labels
POST /api/v1/mailboxes/:mailboxId/labels
PUT /api/v1/mailboxes/:mailboxId/labels/:labelId
DELETE /api/v1/mailboxes/:mailboxId/labels/:labelId

// Email labeling
POST /api/v1/mailboxes/:mailboxId/emails/:emailId/labels
DELETE /api/v1/mailboxes/:mailboxId/emails/:emailId/labels/:labelId
GET /api/v1/mailboxes/:mailboxId/emails?label=:labelId
```

**Frontend Changes:**
- Add label manager in `Settings.vue`
- Show labels as colored badges in email list
- Add label selector in email detail view
- Create label dropdown with color picker
- Add label filter in sidebar
- Keyboard shortcut `l` to open label menu

**Label Selector Component:**
```vue
<div class="label-selector">
  <button @click="toggleDropdown">
    <svg>...</svg>
    Labels
  </button>
  
  <div v-if="isOpen" class="label-dropdown">
    <input v-model="search" placeholder="Search labels..." />
    
    <div class="label-list">
      <label v-for="label in filteredLabels" :key="label.id">
        <input 
          type="checkbox" 
          :checked="email.labels.includes(label.id)"
          @change="toggleLabel(label.id)"
        />
        <span class="label-badge" :style="{ backgroundColor: label.color }">
          {{ label.name }}
        </span>
      </label>
    </div>
    
    <button @click="createNewLabel">
      + Create new label
    </button>
  </div>
</div>
```

**Label Manager:**
```vue
<div class="label-manager">
  <h2>Manage Labels</h2>
  
  <div v-for="label in labels" class="label-item">
    <input v-model="label.name" />
    <input type="color" v-model="label.color" />
    <button @click="saveLabel(label)">Save</button>
    <button @click="deleteLabel(label.id)">Delete</button>
  </div>
  
  <button @click="createLabel">New Label</button>
</div>
```

**Features:**
- Nested labels (parent/child hierarchy)
- Label search and filtering
- Bulk label operations
- Label statistics (email count per label)
- Smart labels (dynamic based on rules)

---

### 10. Email Scheduling ⏰

**Priority:** Low (Future)  
**Estimated Effort:** 4-5 days

#### Implementation Details

**Backend:**
- Add scheduled emails queue using Cloudflare Queues
- Create cron trigger to check and send scheduled emails
- Store scheduled send time in emails table

**Database:**
```sql
ALTER TABLE emails ADD COLUMN scheduled_at INTEGER;
CREATE INDEX idx_emails_scheduled ON emails(scheduled_at) WHERE scheduled_at IS NOT NULL;
```

**Frontend:**
- Add "Schedule send" button in compose
- DateTime picker for scheduling
- Quick options: "Tomorrow morning", "Next week", "Custom"

---

### 11. Undo Send ⏮️

**Priority:** Low (Future)  
**Estimated Effort:** 2-3 days

#### Implementation Details

**Backend:**
- Delay actual email sending by 5-10 seconds
- Queue emails in "pending_send" state
- Add cancel endpoint

**Frontend:**
- Show "Sending..." toast with undo button
- Countdown timer
- Move to sent folder after delay

---

### 12. Email Rules/Automation ⚙️

**Priority:** Low (Future)  
**Estimated Effort:** 1-2 weeks

#### Implementation Details

**Rule Engine:**
```typescript
interface EmailRule {
  id: string
  name: string
  conditions: Condition[]
  actions: Action[]
  enabled: boolean
}

interface Condition {
  field: 'from' | 'to' | 'subject' | 'body'
  operator: 'contains' | 'equals' | 'starts_with'
  value: string
}

interface Action {
  type: 'move_to_folder' | 'apply_label' | 'mark_as_read' | 'forward' | 'delete'
  params: any
}
```

**Database:**
```sql
CREATE TABLE rules (
  id TEXT PRIMARY KEY,
  mailbox_id TEXT NOT NULL,
  name TEXT NOT NULL,
  conditions TEXT NOT NULL, -- JSON
  actions TEXT NOT NULL, -- JSON
  enabled INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0
);
```

---

### 13. Contact Management Enhancement 👥

**Priority:** Low (Future)  
**Estimated Effort:** 1 week

#### Implementation Details

**Database:**
```sql
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  mailbox_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE contact_groups (
  id TEXT PRIMARY KEY,
  mailbox_id TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE contact_group_members (
  group_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (group_id, contact_id)
);
```

**Features:**
- Auto-complete in compose
- Contact groups for bulk sending
- Import from CSV/vCard
- Export contacts
- Contact frequency tracking
- Recently contacted list

---

---

## Technical Considerations

### Performance Optimization
- Implement virtual scrolling for long email lists
- Add pagination/infinite scroll
- Cache frequently accessed data
- Optimize database queries with proper indexing
- Use service workers for offline support

### Testing Strategy
- Unit tests for business logic (Vitest)
- Integration tests for API endpoints
- E2E tests for critical user flows (Playwright)
- Visual regression tests for UI components

### Deployment
- CI/CD pipeline with GitHub Actions
- Automated testing before deployment
- Staging environment for testing
- Database migration management
- Feature flags for gradual rollout

### Monitoring
- Error tracking (Sentry)
- Performance monitoring
- Usage analytics
- Email delivery monitoring

---

## Priority Matrix

| Phase | Feature | Impact | Effort | Priority Score |
|-------|---------|--------|--------|---------------|
| 1 | Authentication (AUTH DO) | High | High | Critical |
| 1 | Reply/Forward | High | Medium | High |
| 1 | Rich Text Editor | High | Medium | High |
| 1 | Attachment Upload | High | Medium | High |
| 2 | Advanced Search (FTS5) | Medium | Medium | Medium-High |
| 2 | Email Signatures | Medium | Low | Medium |
| 2 | Keyboard Shortcuts | Medium | Low | Medium |
| 2 | Auto-save Drafts | Medium | Low | Medium |
| 3 | Labels/Tags | Medium | Medium | Future |
| 3 | Email Scheduling | Low | Low | Future |
| 3 | Undo Send | Low | Low | Future |
| 3 | Email Rules | Medium | High | Future |
| 3 | Contact Enhancement | Low | Medium | Future |

---

## Success Metrics

### User Engagement
- Daily active users (DAU)
- Average session duration
- Emails sent/received per user
- Feature adoption rate

### Performance
- Page load time < 2 seconds
- Time to interactive < 3 seconds
- API response time < 200ms
- Email delivery success rate > 99%

### User Satisfaction
- Net Promoter Score (NPS)
- Feature satisfaction surveys
- User retention rate
- Support ticket volume

---

## Contributing

When implementing features from this roadmap:

1. Create a feature branch: `feature/feature-name`
2. Follow the existing code style and patterns
3. Add tests for new functionality
4. Update API documentation in `openapi.json`
5. Add migration scripts for database changes
6. Update this roadmap with progress

---

---

## Removed Features

The following features have been removed from the roadmap:

### ~~Email Threading/Conversations~~
- **Reason:** Complexity vs. benefit trade-off. Can be revisited if there's strong user demand
- **Alternative:** Users can rely on subject line grouping and search functionality

### ~~Multiple Email Accounts~~
- **Reason:** Single mailbox focus keeps the architecture simpler
- **Alternative:** Users can deploy multiple instances if needed

---

## Configuration Guide

### Authentication Setup

Configuration is set directly in your worker's `src/index.ts` file.

#### Recommended: Smart Mode (Default)

**Best for production deployments:**

1. **Initial Deployment:**
   ```typescript
   // src/index.ts
   export default EmailExplorer({
     auth: {
       enabled: true
       // registerEnabled not specified = smart mode
     }
   })
   ```

2. **Deploy and Register First Admin:**
   ```bash
   wrangler deploy
   ```
   - Visit your worker URL
   - Navigate to `/register` (or call `POST /api/v1/auth/register`)
   - Register your admin account (first user)
   - This user is automatically granted admin privileges
   - Registration endpoint closes immediately after

3. **Manage Additional Users:**
   - Log in as admin
   - Navigate to Admin Panel (add to your frontend)
   - Use `POST /api/v1/auth/admin/register` to create new users
   - Assign mailbox access via `POST /api/v1/auth/admin/grant-access`

#### Alternative Configurations

**Open Registration Mode (Development/Testing):**
```typescript
export default EmailExplorer({
  auth: {
    enabled: true,
    registerEnabled: true  // Anyone can register
  }
})
```
- Useful for development/testing
- No restrictions on registration
- First user still becomes admin
- ⚠️ Not recommended for production

**Locked Down Mode:**
```typescript
export default EmailExplorer({
  auth: {
    enabled: true,
    registerEnabled: false  // No public registration
  }
})
```
- No public registration at all
- Admins must create all users via admin endpoints
- Use after manually creating first admin user

**No Auth Mode:**
```typescript
export default EmailExplorer({
  auth: {
    enabled: false
  }
})
```
- Disables all authentication
- Useful for single-user deployments or local development

### Admin Operations

**Create New User:**
```bash
# As admin
curl -X POST https://your-worker.workers.dev/api/v1/auth/admin/register \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password",
    "mailboxIds": ["mailbox-1", "mailbox-2"]
  }'
```

**Grant Mailbox Access:**
```bash
curl -X POST https://your-worker.workers.dev/api/v1/auth/admin/grant-access \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "mailboxId": "mailbox-id",
    "role": "read"
  }'
```

**Roles:**
- `owner`: Full control (read, write, delete, manage)
- `admin`: Read, write, delete
- `write`: Read and write
- `read`: Read-only access

### Authentication Architecture

**Single Durable Object Class:**
- The `MailboxDO` class serves dual purpose (auth + mailbox)
- Auth singleton accessed via: `env.MAILBOX.idFromName('AUTH')`
- Regular mailboxes accessed via: `env.MAILBOX.idFromString(mailboxId)`
- Automatically detects mode based on DO name
- Applies appropriate migrations (auth tables vs mailbox tables)

**Benefits:**
- Simpler deployment - only one DO class
- No separate AUTH binding needed in wrangler.jsonc
- Easier to maintain and update
- Auth data isolated in singleton DO
- Mailbox data isolated in separate DO instances

---

**Last Updated:** November 27, 2025  
**Version:** 3.0

## Changelog

### Version 3.0 (November 27, 2025)
- **Dual-Purpose Durable Object**: Single `MailboxDO` class handles both auth and mailbox functionality
- **Smart Registration Mode**: Auto-closing registration after first user
- **Admin System**: First user becomes admin automatically
- **Role-Based Access Control**: Multiple roles (owner, admin, write, read)
- **Admin Panel**: User management and mailbox access control
- **Admin API Endpoints**: `/api/v1/auth/admin/*` for user management
- **Updated Configuration**: Factory function pattern with smart defaults
- **Simplified Architecture**: No separate AUTH DO binding needed
- **Documentation Updates**: Comprehensive setup guide and examples
