import { DurableObject } from "cloudflare:workers";
import { DOQB } from "workers-qb";
import type { Env, Session, User } from "../types";
import { authMigrations, mailboxMigrations } from "./migrations";

interface GetEmailsOptions {
	folder?: string;
	page?: number;
	limit?: number;
	sortColumn?: string;
	sortDirection?: "ASC" | "DESC";
}

interface EmailData {
	id: string;
	subject: string;
	sender: string;
	recipient: string;
	date: string;
	body: string;
	read?: boolean;
	starred?: boolean;
	in_reply_to?: string | null;
	email_references?: string | null;
	thread_id?: string | null;
}

interface AttachmentData {
	id: string;
	email_id: string;
	filename: string;
	mimetype: string;
	size: number;
	content_id?: string | null;
	disposition?: string | null;
}

export class MailboxDO extends DurableObject<Env> {
	declare __DURABLE_OBJECT_BRAND: never;
	#qb: DOQB;
	#isAuthDO: boolean;

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.#qb = new DOQB(this.ctx.storage.sql);
		// this.#qb.setDebugger(true);

		// Detect if this is the auth singleton
		// We use a marker in storage to identify the auth DO
		const authMarker = this.ctx.storage.sql
			.exec(
				"SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
			)
			.toArray();
		const hasAuthTables = authMarker.length > 0;

		// Check if this is first initialization
		const isFirstInit =
			this.ctx.storage.sql
				.exec(
					"SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'",
				)
				.toArray().length === 0;

		// If first init, check the ID to determine type
		// idFromName creates deterministic IDs, so we check if this ID matches the expected AUTH ID
		if (isFirstInit) {
			// Create a test ID to compare
			const testAuthId = env.MAILBOX.idFromName("AUTH");
			this.#isAuthDO = this.ctx.id.equals(testAuthId);
		} else {
			// On subsequent loads, check if auth tables exist
			this.#isAuthDO = hasAuthTables;
		}

		// Apply appropriate migrations
		if (this.#isAuthDO) {
			this.#qb.migrations({ migrations: authMigrations }).apply();
		} else {
			this.#qb.migrations({ migrations: mailboxMigrations }).apply();
		}
	}

	// Auth helper: hash password using Web Crypto API
	async #hashPassword(password: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(password);
		const hash = await crypto.subtle.digest("SHA-256", data);
		const hashArray = Array.from(new Uint8Array(hash));
		return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	}

	// Auth helper: verify password
	async #verifyPassword(password: string, hash: string): Promise<boolean> {
		const passwordHash = await this.#hashPassword(password);
		return passwordHash === hash;
	}

	// Auth helper: generate session token
	#generateToken(): string {
		return crypto.randomUUID();
	}

	// Auth operation: check if any users exist
	async hasUsers(): Promise<boolean> {
		if (!this.#isAuthDO) return false;
		const result = this.#qb.select("users").fields(["COUNT(*) as count"]).one();
		return (result.results?.count as number) > 0;
	}

	// Auth operation: check if user is admin
	async isAdmin(userId: string): Promise<boolean> {
		if (!this.#isAuthDO) return false;
		const result = this.#qb
			.select("users")
			.fields(["is_admin"])
			.where("id = ?", userId)
			.one();
		return result.results?.is_admin === 1;
	}

	// Auth operation: register a user
	async register(
		email: string,
		password: string,
		isFirstUser = false,
	): Promise<User> {
		if (!this.#isAuthDO) throw new Error("Not an auth DO");

		const userId = crypto.randomUUID();
		const passwordHash = await this.#hashPassword(password);
		const now = Date.now();

		this.#qb
			.insert({
				tableName: "users",
				data: {
					id: userId,
					email,
					password_hash: passwordHash,
					is_admin: isFirstUser ? 1 : 0,
					created_at: now,
					updated_at: now,
				},
			})
			.execute();

		return {
			id: userId,
			email,
			isAdmin: isFirstUser,
			createdAt: now,
			updatedAt: now,
		};
	}

	// Auth operation: login
	async login(email: string, password: string): Promise<Session | null> {
		if (!this.#isAuthDO) throw new Error("Not an auth DO");

		const result = this.#qb
			.select("users")
			.fields(["id", "email", "password_hash", "is_admin"])
			.where("email = ?", email)
			.one();

		if (!result.results) return null;

		const user = result.results;
		const isValid = await this.#verifyPassword(
			password,
			String(user.password_hash),
		);

		if (!isValid) return null;

		// Create session (30 days expiry)
		const sessionId = this.#generateToken();
		const now = Date.now();
		const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

		this.#qb
			.insert({
				tableName: "sessions",
				data: {
					id: sessionId,
					user_id: String(user.id),
					expires_at: expiresAt,
					created_at: now,
				},
			})
			.execute();

		return {
			id: sessionId,
			userId: String(user.id),
			email: String(user.email),
			isAdmin: user.is_admin === 1,
			expiresAt,
		};
	}

	// Auth operation: validate session
	async validateSession(sessionId: string): Promise<Session | null> {
		if (!this.#isAuthDO) throw new Error("Not an auth DO");

		const result = this.#qb
			.select("sessions")
			.fields(["id", "user_id", "expires_at"])
			.where("id = ?", sessionId)
			.one();

		if (!result.results) return null;

		const session = result.results;
		const expiresAt = Number(session.expires_at);

		// Check if expired
		if (expiresAt < Date.now()) {
			this.#qb
				.delete({
					tableName: "sessions",
					where: {
						conditions: "id = ?",
						params: [sessionId],
					},
				})
				.execute();
			return null;
		}

		// Get user info
		const userResult = this.#qb
			.select("users")
			.fields(["email", "is_admin"])
			.where("id = ?", String(session.user_id))
			.one();

		if (!userResult.results) return null;

		return {
			id: String(session.id),
			userId: String(session.user_id),
			email: String(userResult.results.email),
			isAdmin: userResult.results.is_admin === 1,
			expiresAt,
		};
	}

	// Auth operation: logout
	async logout(sessionId: string): Promise<boolean> {
		if (!this.#isAuthDO) throw new Error("Not an auth DO");

		this.#qb
			.delete({
				tableName: "sessions",
				where: {
					conditions: "id = ?",
					params: [sessionId],
				},
			})
			.execute();

		return true;
	}

	// Auth operation: get all users (admin only)
	async getUsers(): Promise<User[]> {
		if (!this.#isAuthDO) throw new Error("Not an auth DO");

		const result = this.#qb
			.select("users")
			.fields(["id", "email", "is_admin", "created_at", "updated_at"])
			.execute();

		return (
			result.results?.map((user) => ({
				id: String(user.id),
				email: String(user.email),
				isAdmin: user.is_admin === 1,
				createdAt: Number(user.created_at),
				updatedAt: Number(user.updated_at),
			})) ?? []
		);
	}

	// Auth operation: grant mailbox access
	async grantMailboxAccess(
		userId: string,
		mailboxId: string,
		role: string,
	): Promise<void> {
		if (!this.#isAuthDO) throw new Error("Not an auth DO");

		this.#qb
			.insert({
				tableName: "user_mailboxes",
				data: {
					user_id: userId,
					mailbox_id: mailboxId,
					role,
				},
			})
			.execute();
	}

	// Auth operation: revoke mailbox access
	async revokeMailboxAccess(userId: string, mailboxId: string): Promise<void> {
		if (!this.#isAuthDO) throw new Error("Not an auth DO");

		this.#qb
			.delete({
				tableName: "user_mailboxes",
				where: {
					conditions: "user_id = ? AND mailbox_id = ?",
					params: [userId, mailboxId],
				},
			})
			.execute();
	}

	// Auth operation: get user mailboxes
	async getUserMailboxes(
		userId: string,
	): Promise<Array<{ mailboxId: string; role: string }>> {
		if (!this.#isAuthDO) throw new Error("Not an auth DO");

		const result = this.#qb
			.select("user_mailboxes")
			.fields(["mailbox_id", "role"])
			.where("user_id = ?", userId)
			.execute();

		return (
			result.results?.map((row) => ({
				mailboxId: String(row.mailbox_id),
				role: String(row.role),
			})) ?? []
		);
	}

	async getEmails(options: GetEmailsOptions = {}) {
		const {
			folder,
			page = 1,
			limit = 25,
			sortColumn = "date",
			sortDirection = "DESC",
		} = options;

		let query = this.#qb
			.select<EmailData>("emails")
			.fields([
				"id",
				"subject",
				"sender",
				"recipient",
				"date",
				"read",
				"starred",
				"in_reply_to",
				"email_references",
				"thread_id",
			]);

		if (folder) {
			const folderIdSubquery = this.#qb
				.select("folders")
				.fields(["id"])
				.where("name = ? OR id = ?", [folder, folder])
				.limit(1);
			query = query.where("folder_id = ?", folderIdSubquery);
		}

		const offset = (page - 1) * limit;
		query = query
			.orderBy(`${sortColumn} ${sortDirection}`)
			.limit(limit)
			.offset(offset);

		const result = query.execute();

		return (
			result.results?.map((email) => ({
				...email,
				read: !!email.read,
				starred: !!email.starred,
			})) ?? []
		);
	}

	async getEmail(id: string) {
		const email = this.#qb
			.select("emails")
			.fields(["*"])
			.where("id = ?", id)
			.one();

		if (!email.results) {
			return null;
		}

		const attachments = this.#qb
			.select("attachments")
			.fields(["*"])
			.where("email_id = ?", id)
			.execute();

		return {
			...email.results,
			read: !!email.results.read,
			starred: !!email.results.starred,
			attachments: attachments.results || [],
		};
	}

	async updateEmail(
		id: string,
		{ read, starred }: { read?: boolean; starred?: boolean },
	) {
		const data: { read?: number; starred?: number } = {};
		if (read !== undefined) {
			data.read = read ? 1 : 0;
		}
		if (starred !== undefined) {
			data.starred = starred ? 1 : 0;
		}

		if (Object.keys(data).length === 0) {
			return this.getEmail(id);
		}

		this.#qb
			.update({
				tableName: "emails",
				data,
				where: {
					conditions: "id = ?",
					params: [id],
				},
			})
			.execute();

		return this.getEmail(id);
	}

	async deleteEmail(id: string) {
		const attachments = this.#qb
			.select("attachments")
			.fields(["id", "filename"])
			.where("email_id = ?", id)
			.execute();

		this.#qb
			.delete({
				tableName: "emails",
				where: {
					conditions: "id = ?",
					params: [id],
				},
			})
			.execute();

		return attachments.results || [];
	}

	async getAttachment(id: string) {
		const result = this.#qb
			.select<AttachmentData>("attachments")
			.fields(["*"])
			.where("id = ?", id)
			.one();
		return result.results;
	}

	async getFolders() {
		const query = this.#qb.select("folders").fields(["id", "name"]);

		const result = query.execute();
		return result.results || [];
	}

	async createFolder(id: string, name: string) {
		try {
			const result = this.#qb
				.insert({
					tableName: "folders",
					data: { id, name },
					returning: ["id", "name"],
				})
				.execute();
			const newFolder = result.results;
			return { ...newFolder, unreadCount: 0 };
		} catch (e: any) {
			if (e.message.includes("UNIQUE constraint failed")) {
				return null;
			}
			throw e;
		}
	}

	async updateFolder(id: string, name: string) {
		this.#qb
			.update({
				tableName: "folders",
				data: { name },
				where: {
					conditions: "id = ?",
					params: [id],
				},
			})
			.execute();
		const query = this.#qb
			.select("folders")
			.fields(["id", "name"])
			.where("id = ?", id);
		const result = query.one();
		return result.results;
	}

	async deleteFolder(id: string) {
		const folder = this.#qb
			.select<{ is_deletable: number }>("folders")
			.fields(["is_deletable"])
			.where("id = ?", id)
			.one();

		if (!folder.results || folder.results.is_deletable === 0) {
			return false;
		}

		this.#qb
			.delete({
				tableName: "folders",
				where: {
					conditions: "id = ?",
					params: [id],
				},
			})
			.execute();

		return true;
	}

	async getContacts() {
		const query = this.#qb.select("contacts").fields(["id", "name", "email"]);
		const result = query.execute();
		return result.results || [];
	}

	async createContact(contact: { name?: string; email: string }) {
		const result = this.#qb
			.insert({
				tableName: "contacts",
				data: contact,
				returning: ["id", "name", "email"],
			})
			.execute();
		return result.results;
	}

	async updateContact(id: number, contact: { name?: string; email?: string }) {
		this.#qb
			.update({
				tableName: "contacts",
				data: contact,
				where: {
					conditions: "id = ?",
					params: [id],
				},
			})
			.execute();
		const query = this.#qb
			.select("contacts")
			.fields(["id", "name", "email"])
			.where("id = ?", id);
		const result = query.one();
		return result.results;
	}

	async deleteContact(id: number) {
		this.#qb
			.delete({
				tableName: "contacts",
				where: {
					conditions: "id = ?",
					params: [id],
				},
			})
			.execute();
		return true;
	}

	async moveEmail(id: string, folderId: string) {
		const folder = this.#qb
			.select("folders")
			.fields(["id"])
			.where("id = ?", folderId)
			.one();

		if (!folder.results) {
			return false;
		}

		this.#qb
			.update({
				tableName: "emails",
				data: { folder_id: folderId },
				where: {
					conditions: "id = ?",
					params: [id],
				},
			})
			.execute();

		return true;
	}

	async searchEmails(options: {
		query: string;
		folder?: string;
		from?: string;
		to?: string;
		date_start?: string;
		date_end?: string;
	}) {
		const { query, folder, from, to, date_start, date_end } = options;
		let qb = this.#qb
			.select<EmailData>("emails")
			.fields([
				"id",
				"subject",
				"sender",
				"recipient",
				"date",
				"read",
				"starred",
				"in_reply_to",
				"email_references",
				"thread_id",
			]);

		if (folder) {
			const folderIdSubquery = this.#qb
				.select("folders")
				.fields(["id"])
				.where("name = ? OR id = ?", [folder, folder])
				.limit(1);
			qb = qb.where("folder_id = ?", folderIdSubquery);
		}

		if (from) {
			qb = qb.where("sender LIKE ?", `%${from}%`);
		}

		if (to) {
			qb = qb.where("recipient LIKE ?", `%${to}%`);
		}

		if (date_start) {
			qb = qb.where("date >= ?", date_start);
		}

		if (date_end) {
			qb = qb.where("date <= ?", date_end);
		}

		qb = qb.where("(subject LIKE ? OR body LIKE ?)", [
			`%${query}%`,
			`%${query}%`,
		]);

		const result = qb.execute();

		return (
			result.results?.map((email) => ({
				...email,
				read: !!email.read,
				starred: !!email.starred,
			})) ?? []
		);
	}

	async createEmail(
		folder: string,
		email: EmailData,
		attachments: AttachmentData[],
	) {
		this.#qb
			.insert({
				tableName: "emails",
				data: { ...email, folder_id: folder },
			})
			.execute();

		if (attachments.length > 0) {
			this.#qb
				.insert({
					tableName: "attachments",
					data: attachments as any,
				})
				.execute();
		}
	}
}
