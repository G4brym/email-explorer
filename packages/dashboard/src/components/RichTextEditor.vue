<template>
  <div class="rich-text-editor border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50">
    <!-- Toolbar -->
    <div v-if="editor" class="toolbar bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1">
      <!-- Text Formatting -->
      <div class="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          type="button"
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          class="toolbar-btn"
          title="Bold (Ctrl+B)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          class="toolbar-btn"
          title="Italic (Ctrl+I)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4h4m-4 16h4m-2-16l-2 16" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleUnderline().run()"
          :class="{ 'is-active': editor.isActive('underline') }"
          class="toolbar-btn"
          title="Underline (Ctrl+U)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20h10M7 4v7a5 5 0 0010 0V4" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
          class="toolbar-btn"
          title="Strikethrough"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h18M8 5h8M9 19h6" />
          </svg>
        </button>
      </div>

      <!-- Headings -->
      <div class="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          class="toolbar-btn text-xs font-bold"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          class="toolbar-btn text-xs font-bold"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          class="toolbar-btn text-xs font-bold"
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <!-- Lists -->
      <div class="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          type="button"
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          class="toolbar-btn"
          title="Bullet List"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          class="toolbar-btn"
          title="Numbered List"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h10M7 12h10M7 17h10M3 7v10" />
          </svg>
        </button>
      </div>

      <!-- Text Alignment -->
      <div class="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          type="button"
          @click="editor.chain().focus().setTextAlign('left').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
          class="toolbar-btn"
          title="Align Left"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().setTextAlign('center').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
          class="toolbar-btn"
          title="Align Center"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().setTextAlign('right').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
          class="toolbar-btn"
          title="Align Right"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().setTextAlign('justify').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
          class="toolbar-btn"
          title="Justify"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <!-- Blockquote & Code -->
      <div class="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          type="button"
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          class="toolbar-btn"
          title="Blockquote"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleCode().run()"
          :class="{ 'is-active': editor.isActive('code') }"
          class="toolbar-btn"
          title="Inline Code"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          class="toolbar-btn"
          title="Code Block"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      <!-- Link & Horizontal Rule -->
      <div class="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <button
          type="button"
          @click="setLink"
          :class="{ 'is-active': editor.isActive('link') }"
          class="toolbar-btn"
          title="Insert Link"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        <button
          type="button"
          v-if="editor.isActive('link')"
          @click="editor.chain().focus().unsetLink().run()"
          class="toolbar-btn"
          title="Remove Link"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().setHorizontalRule().run()"
          class="toolbar-btn"
          title="Horizontal Rule"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14" />
          </svg>
        </button>
      </div>

      <!-- Text Color & Highlight -->
      <div class="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
        <div class="relative">
          <button
            type="button"
            @click="showTextColorPicker = !showTextColorPicker"
            class="toolbar-btn"
            title="Text Color"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </button>
          <div v-if="showTextColorPicker" class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 shadow-lg z-10 grid grid-cols-5 gap-1">
            <button
              v-for="color in textColors"
              :key="color"
              type="button"
              @click="setTextColor(color)"
              class="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
              :style="{ backgroundColor: color }"
              :title="color"
            />
          </div>
        </div>
        <div class="relative">
          <button
            type="button"
            @click="showHighlightPicker = !showHighlightPicker"
            class="toolbar-btn"
            title="Highlight"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </button>
          <div v-if="showHighlightPicker" class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 shadow-lg z-10 grid grid-cols-5 gap-1">
            <button
              v-for="color in highlightColors"
              :key="color"
              type="button"
              @click="setHighlight(color)"
              class="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
              :style="{ backgroundColor: color }"
              :title="color"
            />
          </div>
        </div>
      </div>

      <!-- Utilities -->
      <div class="flex gap-1">
        <button
          type="button"
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          class="toolbar-btn"
          title="Undo (Ctrl+Z)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          class="toolbar-btn"
          title="Redo (Ctrl+Y)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>
        <button
          type="button"
          @click="showSourceCode = !showSourceCode"
          class="toolbar-btn"
          :class="{ 'is-active': showSourceCode }"
          title="Toggle Source Code"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Editor Content or Source Code -->
    <div v-if="showSourceCode" class="p-4">
      <textarea
        v-model="sourceCode"
        @input="updateFromSource"
        class="w-full h-64 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg p-3 font-mono text-sm"
        placeholder="HTML source code..."
      />
    </div>
    <editor-content v-else :editor="editor" class="prose prose-sm max-w-none p-4 text-gray-900 dark:text-gray-100" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showSourceCode = ref(false)
const sourceCode = ref('')
const showTextColorPicker = ref(false)
const showHighlightPicker = ref(false)

const textColors = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
  '#FF0000', '#FF6B6B', '#FFA500', '#FFD700', '#FFFF00',
  '#00FF00', '#00CED1', '#0000FF', '#9370DB', '#FF1493'
]

const highlightColors = [
  '#FFFF00', '#FFE4B5', '#FFB6C1', '#ADD8E6', '#90EE90',
  '#DDA0DD', '#F0E68C', '#FFDAB9', '#E0BBE4', '#C1E1C1'
]

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline hover:text-blue-800',
      },
    }),
    Image,
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
  ],
  content: props.modelValue,
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px]',
    },
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    if (showSourceCode.value) {
      sourceCode.value = html
    }
  },
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue)
  }
})

// Update editor from source code
const updateFromSource = () => {
  if (editor.value) {
    editor.value.commands.setContent(sourceCode.value)
  }
}

// Toggle source code view
watch(showSourceCode, (isShown) => {
  if (isShown) {
    sourceCode.value = editor.value?.getHTML() || ''
  }
})

// Link functionality
const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)

  if (url === null) {
    return
  }

  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

// Text color functionality
const setTextColor = (color: string) => {
  editor.value?.chain().focus().setColor(color).run()
  showTextColorPicker.value = false
}

// Highlight functionality
const setHighlight = (color: string) => {
  editor.value?.chain().focus().toggleHighlight({ color }).run()
  showHighlightPicker.value = false
}

// Close color pickers when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showTextColorPicker.value = false
    showHighlightPicker.value = false
  }
}

// Add click listener
if (typeof window !== 'undefined') {
  window.addEventListener('click', handleClickOutside)
}

onBeforeUnmount(() => {
  editor.value?.destroy()
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.toolbar-btn {
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: rgb(55 65 81);
  transition: all 150ms;
}

.toolbar-btn:hover {
  background-color: rgb(243 244 246);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.is-active {
  background-color: rgb(224 231 255);
  color: rgb(79 70 229);
}

@media (prefers-color-scheme: dark) {
  .toolbar-btn {
    color: rgb(209 213 219);
  }
  
  .toolbar-btn:hover {
    background-color: rgb(55 65 81);
  }
  
  .toolbar-btn.is-active {
    background-color: rgb(49 46 129);
    color: rgb(165 180 252);
  }
}

/* TipTap Editor Styles */
:deep(.ProseMirror) {
  outline: none;
  min-height: 200px;
  color: rgb(17 24 39);
}

:deep(.ProseMirror p) {
  margin-bottom: 0.75rem;
}

:deep(.ProseMirror h1) {
  font-size: 1.875rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

:deep(.ProseMirror h2) {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
}

:deep(.ProseMirror h3) {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

:deep(.ProseMirror ul) {
  list-style-type: disc;
}

:deep(.ProseMirror ol) {
  list-style-type: decimal;
}

:deep(.ProseMirror blockquote) {
  border-left: 4px solid rgb(209 213 219);
  padding-left: 1rem;
  font-style: italic;
  margin: 1rem 0;
}

:deep(.ProseMirror code) {
  background-color: rgb(229 231 235);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: monospace;
}

:deep(.ProseMirror pre) {
  background-color: rgb(229 231 235);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

:deep(.ProseMirror pre code) {
  background-color: transparent;
  padding: 0;
}

:deep(.ProseMirror a) {
  color: rgb(37 99 235);
  text-decoration: underline;
}

:deep(.ProseMirror a:hover) {
  color: rgb(29 78 216);
}

:deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

:deep(.ProseMirror hr) {
  margin: 1rem 0;
  border-color: rgb(209 213 219);
}

@media (prefers-color-scheme: dark) {
  :deep(.ProseMirror) {
    color: rgb(243 244 246);
  }
  
  :deep(.ProseMirror blockquote) {
    border-left-color: rgb(75 85 99);
  }
  
  :deep(.ProseMirror code) {
    background-color: rgb(55 65 81);
  }
  
  :deep(.ProseMirror pre) {
    background-color: rgb(55 65 81);
  }
  
  :deep(.ProseMirror a) {
    color: rgb(96 165 250);
  }
  
  :deep(.ProseMirror a:hover) {
    color: rgb(147 197 253);
  }
  
  :deep(.ProseMirror hr) {
    border-color: rgb(75 85 99);
  }
}
</style>
