import { EmailMessage } from "cloudflare:email";
import { contentJson, fromHono, OpenAPIRoute } from "chanfana";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import PostalMime from "postal-mime";
import { z } from "zod";
import { buildMimeMessage } from "./mime-builder";
import {
	GetMe,
	GetUsers,
	PostAdminRegister,
	PostGrantAccess,
	PostLogin,
	PostLogout,
	PostRegister,
	PostRevokeAccess,
	PutUser,
} from "./routes/auth";
import { PostForwardEmail, PostReplyEmail } from "./routes/reply-forward";
import type { EmailExplorerOptions, Env, Session } from "./types";

type AppContext = Context<{ Bindings: Env; Variables: { session?: Session } }>;

export { MailboxDO } from "./durableObject";

// Schemas
const MailboxSchema = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string(),
});

const MailboxDetailsSchema = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string(),
	settings: z.record(z.any()),
});

const UpdateMailboxRequestSchema = z.object({
	settings: z.record(z.any()),
});

const ErrorResponseSchema = z.object({
	error: z.string(),
});

const EmailMetadataSchema = z.object({
	id: z.string(),
	subject: z.string(),
	sender: z.string(),
	recipient: z.string(),
	date: z.string(),
	read: z.boolean(),
	starred: z.boolean(),
	in_reply_to: z.string().nullable().optional(),
	email_references: z.string().nullable().optional(),
	thread_id: z.string().nullable().optional(),
});

const AttachmentSchema = z.object({
	id: z.string(),
	filename: z.string(),
	mimetype: z.string(),
	size: z.number(),
	content_id: z.string().optional(),
	disposition: z.string().optional(),
});

const EmailSchema = EmailMetadataSchema.extend({
	body: z.string().nullable(),
	attachments: z.array(AttachmentSchema),
});

const SendEmailRequestSchema = z
	.object({
		to: z.union([z.string().email(), z.array(z.string().email())]),
		from: z.string().email(),
		subject: z.string(),
		html: z.string().optional(),
		text: z.string().optional(),
		attachments: z
			.array(
				z.object({
					content: z.string(), // base64 encoded
					filename: z.string(),
					type: z.string(),
					disposition: z.enum(["attachment", "inline"]),
					contentId: z.string().optional(),
				}),
			)
			.optional(),
		in_reply_to: z.string().optional(),
		references: z.array(z.string()).optional(),
		thread_id: z.string().optional(),
	})
	.refine((data) => data.html || data.text, {
		message: "Either 'html' or 'text' must be provided",
	});

const SendEmailResponseSchema = z.object({
	id: z.string(),
	status: z.string(),
});

const UpdateEmailStatusRequestSchema = z.object({
	read: z.boolean().optional(),
	starred: z.boolean().optional(),
});

const MoveEmailRequestSchema = z.object({
	folderId: z.string(),
});

const SuccessResponseSchema = z.object({
	status: z.string(),
});

const FolderSchema = z.object({
	id: z.string(),
	name: z.string(),
	unreadCount: z.number(),
});

const CreateFolderRequestSchema = z.object({
	name: z.string(),
});

const UpdateFolderRequestSchema = z.object({
	name: z.string(),
});

const ContactSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
});

const CreateContactRequestSchema = z.object({
	name: z.string().optional(),
	email: z.string(),
});

const UpdateContactRequestSchema = z.object({
	name: z.string().optional(),
	email: z.string().optional(),
});

function slugify(text: string) {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/[^\w-]+/g, "") // Remove all non-word chars
		.replace(/--+/g, "-") // Replace multiple - with single -
		.replace(/^-+/, "") // Trim - from start of text
		.replace(/-+$/, ""); // Trim - from end of text
}

// Routes
class GetMailboxes extends OpenAPIRoute {
	schema = {
		summary: "List all mailboxes",
		operationId: "listMailboxes",
		tags: ["Mailboxes"],
		responses: {
			"200": {
				description: "List of mailboxes",
				...contentJson(z.array(MailboxSchema)),
			},
		},
	};

	async handle(c: AppContext) {
		const list = await c.env.BUCKET.list({
			prefix: "mailboxes/",
		});
		const mailboxes = list.objects.map((obj) => {
			const id = obj.key.replace("mailboxes/", "").replace(".json", "");
			return {
				id,
				name: id,
				email: id,
			};
		});
		return c.json(mailboxes);
	}
}

class GetMailbox extends OpenAPIRoute {
	schema = {
		summary: "Get a single mailbox",
		operationId: "getMailbox",
		tags: ["Mailboxes"],
		request: {
			params: z.object({
				mailboxId: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "Mailbox details",
				...contentJson(MailboxDetailsSchema),
			},
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId } = data.params;
		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.get(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}
		const settings = await obj.json();
		const response = {
			id: mailboxId,
			name: mailboxId,
			email: mailboxId,
			settings: settings,
		};
		return c.json(response);
	}
}

class PutMailbox extends OpenAPIRoute {
	schema = {
		summary: "Update a mailbox",
		operationId: "updateMailbox",
		tags: ["Mailboxes"],
		request: {
			params: z.object({
				mailboxId: z.string(),
			}),
			body: contentJson(UpdateMailboxRequestSchema),
		},
		responses: {
			"200": {
				description: "Updated mailbox",
				...contentJson(MailboxDetailsSchema),
			},
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId } = data.params;
		const { settings } = data.body;
		const key = `mailboxes/${mailboxId}.json`;

		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		await c.env.BUCKET.put(key, JSON.stringify(settings));

		const response = {
			id: mailboxId,
			name: mailboxId,
			email: mailboxId,
			settings: settings,
		};
		return c.json(response);
	}
}

class DeleteMailbox extends OpenAPIRoute {
	schema = {
		summary: "Delete a mailbox",
		operationId: "deleteMailbox",
		tags: ["Mailboxes"],
		request: {
			params: z.object({
				mailboxId: z.string(),
			}),
		},
		responses: {
			"204": { description: "Deleted successfully" },
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId } = data.params;
		const key = `mailboxes/${mailboxId}.json`;

		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		await c.env.BUCKET.delete(key);

		// TODO: delete durable object
		return c.body(null, 204);
	}
}

class GetEmails extends OpenAPIRoute {
	schema = {
		summary: "List emails in a mailbox",
		operationId: "listEmails",
		tags: ["Emails"],
		request: {
			params: z.object({
				mailboxId: z.string(),
			}),
			query: z.object({
				folder: z.string().optional(),
				page: z.number().int().optional(),
				limit: z.number().int().optional(),
				sortColumn: z.string().optional(),
				sortDirection: z.enum(["ASC", "DESC"]).optional(),
				filter: z.string().optional(),
			}),
		},
		responses: {
			"200": {
				description: "List of email metadata",
				...contentJson(z.array(EmailMetadataSchema)),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId } = data.params;
		const { folder, page, limit, sortColumn, sortDirection } = data.query;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const id = ns.idFromName(mailboxId);
		const stub = ns.get(id);

		const emails = await stub.getEmails({
			folder,
			page,
			limit,
			sortColumn,
			sortDirection,
		});

		return c.json(emails);
	}
}

class PostEmail extends OpenAPIRoute {
	schema = {
		summary: "Send an email",
		operationId: "sendEmail",
		tags: ["Emails"],
		request: {
			params: z.object({
				mailboxId: z.string(),
			}),
			body: contentJson(SendEmailRequestSchema),
		},
		responses: {
			"201": {
				description: "Email sent successfully",
				...contentJson(SendEmailResponseSchema),
			},
			"400": {
				description: "Bad request",
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId } = data.params;
		const {
			to,
			from,
			subject,
			html,
			text,
			attachments,
			in_reply_to,
			references,
			thread_id,
		} = data.body;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		// Normalize 'to' to string (EmailMessage expects string)
		const toStr = Array.isArray(to) ? to[0] : to;

		// Build MIME message using Workers-compatible builder
		const mimeMessage = buildMimeMessage({
			from,
			to,
			subject,
			text,
			html,
			attachments: attachments?.map((att) => ({
				filename: att.filename,
				content: att.content,
				type: att.type,
				disposition: att.disposition,
				contentId: att.contentId,
			})),
			inReplyTo: in_reply_to,
			references: references,
		});

		const message = new EmailMessage(from, toStr, mimeMessage);

		try {
			await c.env.SEND_EMAIL.send(message);
		} catch (e) {
			return c.json({ error: (e as Error).message }, 500);
		}

		const messageId = crypto.randomUUID();

		const ns = c.env.MAILBOX;
		const id = ns.idFromName(mailboxId);
		const stub = ns.get(id);

		const attachmentData = [];
		if (attachments) {
			for (const att of attachments) {
				const attachmentId = crypto.randomUUID();
				const key = `attachments/${messageId}/${attachmentId}/${att.filename}`;
				await c.env.BUCKET.put(key, atob(att.content));
				attachmentData.push({
					id: attachmentId,
					email_id: messageId,
					filename: att.filename,
					mimetype: att.type,
					size: atob(att.content).length,
					content_id: att.contentId || null,
					disposition: att.disposition,
				});
			}
		}

		await stub.createEmail(
			"sent",
			{
				id: messageId,
				subject,
				sender: from,
				recipient: toStr,
				date: new Date().toISOString(),
				body: html || text || "",
				in_reply_to: in_reply_to || null,
				email_references: references ? JSON.stringify(references) : null,
				thread_id: thread_id || in_reply_to || messageId,
			},
			attachmentData,
		);

		return c.json({ id: messageId, status: "sent" }, 201);
	}
}

class GetEmail extends OpenAPIRoute {
	schema = {
		summary: "Get a single email",
		operationId: "getEmail",
		tags: ["Emails"],
		request: {
			params: z.object({
				mailboxId: z.string(),
				id: z.string(),
			}),
		},
		responses: {
			"200": { description: "Email details", ...contentJson(EmailSchema) },
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId, id } = data.params;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const doId = ns.idFromName(mailboxId);
		const stub = ns.get(doId);

		const email = await stub.getEmail(id);

		if (!email) {
			return c.json({ error: "Email not found" }, 404);
		}

		return c.json(email);
	}
}

class PutEmail extends OpenAPIRoute {
	schema = {
		summary: "Update an email",
		operationId: "updateEmail",
		tags: ["Emails"],
		request: {
			params: z.object({
				mailboxId: z.string(),
				id: z.string(),
			}),
			body: contentJson(UpdateEmailStatusRequestSchema),
		},
		responses: {
			"200": {
				description: "Updated email metadata",
				...contentJson(EmailMetadataSchema),
			},
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId, id } = data.params;
		const { read, starred } = data.body;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const doId = ns.idFromName(mailboxId);
		const stub = ns.get(doId);

		const email = await stub.updateEmail(id, { read, starred });

		if (!email) {
			return c.json({ error: "Email not found" }, 404);
		}

		return c.json(email);
	}
}

class DeleteEmail extends OpenAPIRoute {
	schema = {
		summary: "Delete an email",
		operationId: "deleteEmail",
		tags: ["Emails"],
		request: {
			params: z.object({
				mailboxId: z.string(),
				id: z.string(),
			}),
		},
		responses: {
			"204": { description: "Deleted successfully" },
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId, id } = data.params;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const doId = ns.idFromName(mailboxId);
		const stub = ns.get(doId);

		const attachments = await stub.deleteEmail(id);

		if (attachments.length > 0) {
			const keys = attachments.map(
				(att) => `attachments/${id}/${att.id}/${att.filename}`,
			);
			await c.env.BUCKET.delete(keys);
		}

		return c.body(null, 204);
	}
}

class PostMoveEmail extends OpenAPIRoute {
	schema = {
		summary: "Move an email to a folder",
		operationId: "moveEmail",
		tags: ["Emails"],
		request: {
			params: z.object({
				mailboxId: z.string(),
				id: z.string(),
			}),
			body: contentJson(MoveEmailRequestSchema),
		},
		responses: {
			"200": {
				description: "Moved successfully",
				...contentJson(SuccessResponseSchema),
			},
			"400": {
				description: "Bad request",
				...contentJson(ErrorResponseSchema),
			},
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId, id } = data.params;
		const { folderId } = data.body;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const doId = ns.idFromName(mailboxId);
		const stub = ns.get(doId);

		const success = await stub.moveEmail(id, folderId);

		if (!success) {
			return c.json({ error: "Folder not found" }, 400);
		}

		return c.json({ status: "moved" });
	}
}

class GetFolders extends OpenAPIRoute {
	schema = {
		summary: "List all folders",
		operationId: "listFolders",
		tags: ["Folders"],
		request: {
			params: z.object({
				mailboxId: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "List of folders",
				...contentJson(z.array(FolderSchema)),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId } = data.params;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const id = ns.idFromName(mailboxId);
		const stub = ns.get(id);

		const folders = await stub.getFolders();

		return c.json(folders);
	}
}

class PostFolder extends OpenAPIRoute {
	schema = {
		summary: "Create a folder",
		operationId: "createFolder",
		tags: ["Folders"],
		request: {
			params: z.object({
				mailboxId: z.string(),
			}),
			body: contentJson(CreateFolderRequestSchema),
		},
		responses: {
			"201": { description: "Folder created", ...contentJson(FolderSchema) },
			"400": {
				description: "Bad request",
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId } = data.params;
		const { name } = data.body;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const doId = ns.idFromName(mailboxId);
		const stub = ns.get(doId);

		const slug = slugify(name);
		const newFolder = await stub.createFolder(slug, name);

		if (!newFolder) {
			return c.json({ error: "Folder with this name already exists" }, 409);
		}

		return c.json(newFolder, 201);
	}
}

class PutFolder extends OpenAPIRoute {
	schema = {
		summary: "Update a folder",
		operationId: "updateFolder",
		tags: ["Folders"],
		request: {
			params: z.object({
				mailboxId: z.string(),
				id: z.string(),
			}),
			body: contentJson(UpdateFolderRequestSchema),
		},
		responses: {
			"200": { description: "Updated folder", ...contentJson(FolderSchema) },
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId, id } = data.params;
		const { name } = data.body;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const doId = ns.idFromName(mailboxId);
		const stub = ns.get(doId);

		const updatedFolder = await stub.updateFolder(id, name);

		if (!updatedFolder) {
			return c.json({ error: "Folder not found" }, 404);
		}

		return c.json(updatedFolder);
	}
}

class DeleteFolder extends OpenAPIRoute {
	schema = {
		summary: "Delete a folder",
		operationId: "deleteFolder",
		tags: ["Folders"],
		request: {
			params: z.object({
				mailboxId: z.string(),
				id: z.string(),
			}),
		},
		responses: {
			"204": { description: "Deleted successfully" },
			"400": {
				description: "Bad request",
				...contentJson(ErrorResponseSchema),
			},
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId, id } = data.params;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const doId = ns.idFromName(mailboxId);
		const stub = ns.get(doId);

		const success = await stub.deleteFolder(id);

		if (!success) {
			return c.json({ error: "Folder not found or cannot be deleted" }, 400);
		}

		return c.body(null, 204);
	}
}

class GetContacts extends OpenAPIRoute {
	schema = {
		summary: "List all contacts",
		operationId: "listContacts",
		tags: ["Contacts"],
		request: {
			params: z.object({
				mailboxId: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "List of contacts",
				...contentJson(z.array(ContactSchema)),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId } = data.params;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const id = ns.idFromName(mailboxId);
		const stub = ns.get(id);

		const contacts = await stub.getContacts();

		return c.json(contacts);
	}
}

class PostContact extends OpenAPIRoute {
	schema = {
		summary: "Create a contact",
		operationId: "createContact",
		tags: ["Contacts"],
		request: {
			params: z.object({
				mailboxId: z.string(),
			}),
			body: contentJson(CreateContactRequestSchema),
		},
		responses: {
			"201": { description: "Contact created", ...contentJson(ContactSchema) },
			"400": {
				description: "Bad request",
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId } = data.params;
		const { name, email } = data.body;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const id = ns.idFromName(mailboxId);
		const stub = ns.get(id);

		const newContact = await stub.createContact({ name, email });

		return c.json(newContact, 201);
	}
}

class PutContact extends OpenAPIRoute {
	schema = {
		summary: "Update a contact",
		operationId: "updateContact",
		tags: ["Contacts"],
		request: {
			params: z.object({
				mailboxId: z.string(),
				id: z.string(),
			}),
			body: contentJson(UpdateContactRequestSchema),
		},
		responses: {
			"200": { description: "Updated contact", ...contentJson(ContactSchema) },
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId, id } = data.params;
		const { name, email } = data.body;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const doId = ns.idFromName(mailboxId);
		const stub = ns.get(doId);

		const updatedContact = await stub.updateContact(Number.parseInt(id, 10), {
			name,
			email,
		});

		if (!updatedContact) {
			return c.json({ error: "Contact not found" }, 404);
		}

		return c.json(updatedContact);
	}
}

class DeleteContact extends OpenAPIRoute {
	schema = {
		summary: "Delete a contact",
		operationId: "deleteContact",
		tags: ["Contacts"],
		request: {
			params: z.object({
				mailboxId: z.string(),
				id: z.string(),
			}),
		},
		responses: {
			"204": { description: "Deleted successfully" },
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId, id } = data.params;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const doId = ns.idFromName(mailboxId);
		const stub = ns.get(doId);

		stub.deleteContact(Number.parseInt(id, 10));

		return c.body(null, 204);
	}
}

class GetSearch extends OpenAPIRoute {
	schema = {
		summary: "Search for emails",
		operationId: "searchEmails",
		tags: ["Search"],
		request: {
			params: z.object({
				mailboxId: z.string(),
			}),
			query: z.object({
				query: z.string(),
				folder: z.string().optional(),
				from: z.string().optional(),
				to: z.string().optional(),
				date_start: z.string().datetime().optional(),
				date_end: z.string().datetime().optional(),
			}),
		},
		responses: {
			"200": {
				description: "List of matching emails",
				...contentJson(z.array(EmailMetadataSchema)),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId } = data.params;
		const { query, folder, from, to, date_start, date_end } = data.query;

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const id = ns.idFromName(mailboxId);
		const stub = ns.get(id);

		const emails = await stub.searchEmails({
			query,
			folder,
			from,
			to,
			date_start,
			date_end,
		});

		return c.json(emails);
	}
}

class GetAttachment extends OpenAPIRoute {
	schema = {
		summary: "Get an email attachment",
		operationId: "getAttachment",
		tags: ["Emails"],
		request: {
			params: z.object({
				mailboxId: z.string(),
				emailId: z.string(),
				attachmentId: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "Attachment file",
				content: {
					"application/octet-stream": {
						schema: z.string().openapi({ format: "binary" }),
					},
				},
			},
			"404": { description: "Not found", ...contentJson(ErrorResponseSchema) },
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mailboxId, emailId, attachmentId } = data.params ?? {};

		const key = `mailboxes/${mailboxId}.json`;
		const obj = await c.env.BUCKET.head(key);
		if (!obj) {
			return c.json({ error: "Not found" }, 404);
		}

		const ns = c.env.MAILBOX;
		const doId = ns.idFromName(mailboxId);
		const stub = ns.get(doId);

		const attachment = await stub.getAttachment(attachmentId);

		if (!attachment) {
			return c.json({ error: "Attachment not found" }, 404);
		}

		const attachmentKey = `attachments/${emailId}/${attachmentId}/${attachment.filename}`;
		const attachmentObj = await c.env.BUCKET.get(attachmentKey);

		if (!attachmentObj) {
			return c.json({ error: "Attachment file not found" }, 404);
		}

		const headers = new Headers();
		headers.set("Content-Type", attachment.mimetype);
		headers.set(
			"Content-Disposition",
			`attachment; filename="${attachment.filename}"`,
		);

		return new Response(attachmentObj.body, {
			headers,
		});
	}
}

class CreateDummyMailbox extends OpenAPIRoute {
	schema = {
		summary: "Create a dummy mailbox for debugging",
		operationId: "createDummyMailbox",
		tags: ["Debug"],
		responses: {
			"200": {
				description: "Dummy mailbox created",
				...contentJson(z.object({ status: z.string() })),
			},
		},
	};

	async handle(c: AppContext) {
		const mailboxId = "test@example.com";
		const key = `mailboxes/${mailboxId}.json`;
		const settings = {
			fromName: "Test User",
			forwarding: {
				enabled: false,
				email: "",
			},
			signature: {
				enabled: true,
				text: "Sent from my awesome email client",
			},
			autoReply: {
				enabled: false,
				subject: "",
				message: "",
			},
		};

		await c.env.BUCKET.put(key, JSON.stringify(settings));

		const ns = c.env.MAILBOX;
		const id = ns.idFromName(mailboxId);
		const stub = ns.get(id);

		// This will trigger the first run of the durable object
		await stub.getFolders();

		return c.json({ status: "ok" });
	}
}

// Helper function to extract session token
function getSessionToken(request: Request): string | null {
	// Try Authorization header first
	const authHeader = request.headers.get("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.substring(7);
	}

	// Try cookie
	const cookie = request.headers.get("Cookie");
	if (cookie) {
		const match = cookie.match(/session=([^;]+)/);
		return match ? match[1] : null;
	}

	return null;
}

// Helper function to validate session
async function validateSession(
	request: Request,
	env: Env,
): Promise<Session | null> {
	const token = getSessionToken(request);
	if (!token) return null;

	const authId = env.MAILBOX.idFromName("AUTH");
	const authDO = env.MAILBOX.get(authId);

	try {
		const session = await authDO.validateSession(token);
		return session;
	} catch {
		return null;
	}
}

// Helper function to check if route is public
function isPublicRoute(pathname: string): boolean {
	const publicRoutes = [
		"/api/v1/auth/register",
		"/api/v1/auth/login",
		"/api/docs",
		"/api/openapi.json",
	];
	return publicRoutes.some((route) => pathname.startsWith(route));
}

// Helper function to check if route requires session (auth routes)
function requiresSession(pathname: string): boolean {
	const authRoutes = [
		"/api/v1/auth/me",
		"/api/v1/auth/logout",
		"/api/v1/auth/admin",
	];
	return authRoutes.some((route) => pathname.startsWith(route));
}

const app = new Hono<{ Bindings: Env; Variables: { session?: Session } }>();
app.use("/api/*", cors());
const openapi = fromHono(app);

// Auth endpoints
openapi.post("/api/v1/auth/register", PostRegister);
openapi.post("/api/v1/auth/login", PostLogin);
openapi.post("/api/v1/auth/logout", PostLogout);
openapi.get("/api/v1/auth/me", GetMe);
openapi.post("/api/v1/auth/admin/register", PostAdminRegister);
openapi.get("/api/v1/auth/admin/users", GetUsers);
openapi.put("/api/v1/auth/admin/users/:userId", PutUser);
openapi.post("/api/v1/auth/admin/grant-access", PostGrantAccess);
openapi.post("/api/v1/auth/admin/revoke-access", PostRevokeAccess);

// Existing endpoints
openapi.post("/api/v1/debug/create-mailbox", CreateDummyMailbox);
openapi.get("/api/v1/mailboxes", GetMailboxes);
openapi.get("/api/v1/mailboxes/:mailboxId", GetMailbox);
openapi.put("/api/v1/mailboxes/:mailboxId", PutMailbox);
openapi.delete("/api/v1/mailboxes/:mailboxId", DeleteMailbox);
openapi.get("/api/v1/mailboxes/:mailboxId/emails", GetEmails);
openapi.post("/api/v1/mailboxes/:mailboxId/emails", PostEmail);
openapi.get("/api/v1/mailboxes/:mailboxId/emails/:id", GetEmail);
openapi.put("/api/v1/mailboxes/:mailboxId/emails/:id", PutEmail);
openapi.delete("/api/v1/mailboxes/:mailboxId/emails/:id", DeleteEmail);
openapi.post("/api/v1/mailboxes/:mailboxId/emails/:id/move", PostMoveEmail);
openapi.post("/api/v1/mailboxes/:mailboxId/emails/:id/reply", PostReplyEmail);
openapi.post(
	"/api/v1/mailboxes/:mailboxId/emails/:id/forward",
	PostForwardEmail,
);
openapi.get("/api/v1/mailboxes/:mailboxId/folders", GetFolders);
openapi.post("/api/v1/mailboxes/:mailboxId/folders", PostFolder);
openapi.put("/api/v1/mailboxes/:mailboxId/folders/:id", PutFolder);
openapi.delete("/api/v1/mailboxes/:mailboxId/folders/:id", DeleteFolder);
openapi.get("/api/v1/mailboxes/:mailboxId/contacts", GetContacts);
openapi.post("/api/v1/mailboxes/:mailboxId/contacts", PostContact);
openapi.put("/api/v1/mailboxes/:mailboxId/contacts/:id", PutContact);
openapi.delete("/api/v1/mailboxes/:mailboxId/contacts/:id", DeleteContact);
openapi.get("/api/v1/mailboxes/:mailboxId/search", GetSearch);
openapi.get(
	"/api/v1/mailboxes/:mailboxId/emails/:emailId/attachments/:attachmentId",
	GetAttachment,
);

async function streamToArrayBuffer(stream: ReadableStream, streamSize: number) {
	const result = new Uint8Array(streamSize);
	let bytesRead = 0;
	const reader = stream.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		result.set(value, bytesRead);
		bytesRead += value.length;
	}
	return result;
}

async function receiveEmail(
	event: { raw: ReadableStream; rawSize: number },
	env: Env,
	_ctx: ExecutionContext,
) {
	const rawEmail = await streamToArrayBuffer(event.raw, event.rawSize);
	const parser = new PostalMime();
	const parsedEmail = await parser.parse(rawEmail);

	if (
		!parsedEmail.to ||
		parsedEmail.to.length === 0 ||
		!parsedEmail.to[0].address
	) {
		throw new Error("received email with empty to");
	}

	const mailboxId = parsedEmail.to[0].address;
	const messageId = crypto.randomUUID();

	const key = `mailboxes/${mailboxId}.json`;
	const obj = await env.BUCKET.head(key);
	if (!obj) {
		await env.BUCKET.put(key, JSON.stringify({}));
	}

	const ns = env.MAILBOX;
	const id = ns.idFromName(mailboxId);
	const stub = ns.get(id);

	const attachmentData = [];
	if (parsedEmail.attachments) {
		for (const att of parsedEmail.attachments) {
			const attachmentId = crypto.randomUUID();
			const key = `attachments/${messageId}/${attachmentId}/${att.filename}`;
			await env.BUCKET.put(key, att.content);
			attachmentData.push({
				id: attachmentId,
				email_id: messageId,
				filename: att.filename || "untitled",
				mimetype: att.mimeType,
				size:
					typeof att.content === "string"
						? att.content.length
						: att.content.byteLength,
				content_id: att.contentId || null,
				disposition: att.disposition,
			});
		}
	}

	await stub.createEmail(
		"inbox",
		{
			id: messageId,
			subject: parsedEmail.subject || "",
			sender: parsedEmail.from?.address || "",
			recipient: parsedEmail.to[0].address,
			date: new Date().toISOString(),
			body: parsedEmail.html || parsedEmail.text || "",
		},
		attachmentData,
	);
}

const defaultOptions: EmailExplorerOptions = {
	auth: {
		enabled: true, // Auth is enabled by default for security
		registerEnabled: undefined, // Smart mode: first user becomes admin, then registration closes
	},
};

export function EmailExplorer(_options: EmailExplorerOptions = {}) {
	// Merge user options with defaults
	const options: EmailExplorerOptions = {
		auth: {
			...defaultOptions.auth,
			..._options.auth,
		},
	};

	return {
		async email(
			event: { raw: ReadableStream; rawSize: number },
			env: Env,
			context: ExecutionContext,
		) {
			await receiveEmail(event, env, context);
		},
		async fetch(request: Request, env: Env, context: ExecutionContext) {
			// Make options available to routes via env
			env.config = options;

			// Create a new request with context for middleware
			const url = new URL(request.url);

			// Check if auth is required (either globally enabled or auth-specific routes)
			// Auth is enforced by default (when enabled is undefined) unless explicitly disabled
			const needsAuth =
				(options.auth?.enabled !== false && !isPublicRoute(url.pathname)) ||
				requiresSession(url.pathname);

			if (needsAuth) {
				const session = await validateSession(request, env);
				if (!session) {
					return new Response(JSON.stringify({ error: "Unauthorized" }), {
						status: 401,
						headers: { "Content-Type": "application/json" },
					});
				}

				// Create new Hono app with session in context
				const authApp = new Hono<{
					Bindings: Env;
					Variables: { session?: Session };
				}>();

				// Middleware to inject session
				authApp.use("*", async (c, next) => {
					c.set("session", session);
					await next();
				});

				// Mount the main app
				authApp.route("/", app);

				return authApp.fetch(request, env, context);
			}

			return app.fetch(request, env, context);
		},
	};
}
