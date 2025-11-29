import { SELF, env } from "cloudflare:test";
import { describe, expect, it, beforeEach } from "vitest";

describe("Reply & Forward Functionality Integration Tests", () => {
	let sessionToken: string;
	const testMailboxId = "test@example.com";
	let originalEmailId: string;

	// Helper to make authenticated request
	const authenticatedFetch = (url: string, options: RequestInit = {}) => {
		return SELF.fetch(url, {
			...options,
			headers: {
				...options.headers,
				Authorization: `Bearer ${sessionToken}`,
			},
		});
	};

	beforeEach(async () => {
		// Setup: Create admin user and get session
		const registerResponse = await SELF.fetch("http://local.test/api/v1/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "replytest@example.com",
				password: "password123",
			}),
		});

		const loginResponse = await SELF.fetch("http://local.test/api/v1/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "replytest@example.com",
				password: "password123",
			}),
		});
		const loginBody = await loginResponse.json<any>();
		sessionToken = loginBody.id;

		// Create a test mailbox
		await authenticatedFetch(`http://local.test/api/v1/debug/create-mailbox`);

		// Create an original email to reply to
		const sendResponse = await authenticatedFetch(
			`http://local.test/api/v1/mailboxes/${testMailboxId}/emails`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					to: "recipient@example.com",
					from: testMailboxId,
					subject: "Original Email",
					text: "This is the original email body",
					html: "<p>This is the original email body</p>",
				}),
			}
		);

		const sendBody = await sendResponse.json<any>();
		originalEmailId = sendBody.id;
	});

	describe("Reply Functionality", () => {
		it("should reply to an email with proper threading headers", async () => {
			const response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "recipient@example.com",
						from: testMailboxId,
						subject: "Re: Original Email",
						text: "This is my reply",
						html: "<p>This is my reply</p>",
					}),
				}
			);

			expect(response.status).toBe(201);
			const body = await response.json<any>();
			expect(body).toMatchObject({
				status: "sent",
			});
			expect(body.id).toBeDefined();

			// Verify the reply was stored in sent folder with threading metadata
			const sentEmail = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${body.id}`
			);
			const sentEmailBody = await sentEmail.json<any>();
			
			expect(sentEmailBody.in_reply_to).toBe(originalEmailId);
			expect(sentEmailBody.thread_id).toBe(originalEmailId);
			expect(sentEmailBody.email_references).toBeDefined();
			
			const references = JSON.parse(sentEmailBody.email_references);
			expect(references).toContain(originalEmailId);
		});

		it("should build references chain for nested replies", async () => {
			// First reply
			const firstReplyResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "recipient@example.com",
						from: testMailboxId,
						subject: "Re: Original Email",
						text: "First reply",
						html: "<p>First reply</p>",
					}),
				}
			);
			const firstReplyBody = await firstReplyResponse.json<any>();
			const firstReplyId = firstReplyBody.id;

			// Get the first reply to use for second reply
			const firstReplyEmail = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${firstReplyId}`
			);
			const firstReplyEmailBody = await firstReplyEmail.json<any>();

			// Second reply (reply to the reply)
			const secondReplyResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${firstReplyId}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "recipient@example.com",
						from: testMailboxId,
						subject: "Re: Original Email",
						text: "Second reply",
						html: "<p>Second reply</p>",
					}),
				}
			);

			expect(secondReplyResponse.status).toBe(201);
			const secondReplyBody = await secondReplyResponse.json<any>();

			// Verify references chain
			const secondReplyEmail = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${secondReplyBody.id}`
			);
			const secondReplyEmailBody = await secondReplyEmail.json<any>();
			
			expect(secondReplyEmailBody.in_reply_to).toBe(firstReplyId);
			
			const references = JSON.parse(secondReplyEmailBody.email_references);
			expect(references).toContain(originalEmailId);
			expect(references).toContain(firstReplyId);
		});

		it("should reject reply to non-existent email", async () => {
			const response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/non-existent-id/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "recipient@example.com",
						from: testMailboxId,
						subject: "Re: Non-existent",
						text: "Reply to nothing",
						html: "<p>Reply to nothing</p>",
					}),
				}
			);

			expect(response.status).toBe(404);
			const body = await response.json<any>();
			expect(body.error).toContain("Original email not found");
		});

		it("should require authentication for reply", async () => {
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "recipient@example.com",
						from: testMailboxId,
						subject: "Re: Original Email",
						text: "Unauthenticated reply",
						html: "<p>Unauthenticated reply</p>",
					}),
				}
			);

			expect(response.status).toBe(401);
		});

		it("should validate required fields in reply", async () => {
			const response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "recipient@example.com",
						from: testMailboxId,
						subject: "Re: Original Email",
						// Missing text and html
					}),
				}
			);

			expect(response.status).toBe(400);
		});
	});

	describe("Forward Functionality", () => {
		it("should forward an email without threading headers", async () => {
			const response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/forward`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "newrecipient@example.com",
						from: testMailboxId,
						subject: "Fwd: Original Email",
						text: "Forwarded message",
						html: "<p>Forwarded message</p>",
					}),
				}
			);

			expect(response.status).toBe(201);
			const body = await response.json<any>();
			expect(body).toMatchObject({
				status: "sent",
			});
			expect(body.id).toBeDefined();

			// Verify the forwarded email has no threading metadata
			const forwardedEmail = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${body.id}`
			);
			const forwardedEmailBody = await forwardedEmail.json<any>();
			
			expect(forwardedEmailBody.in_reply_to).toBeNull();
			expect(forwardedEmailBody.email_references).toBeNull();
			expect(forwardedEmailBody.thread_id).toBe(body.id); // New thread
		});

		it("should reject forward of non-existent email", async () => {
			const response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/non-existent-id/forward`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "newrecipient@example.com",
						from: testMailboxId,
						subject: "Fwd: Non-existent",
						text: "Forward nothing",
						html: "<p>Forward nothing</p>",
					}),
				}
			);

			expect(response.status).toBe(404);
			const body = await response.json<any>();
			expect(body.error).toContain("Original email not found");
		});

		it("should require authentication for forward", async () => {
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/forward`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "newrecipient@example.com",
						from: testMailboxId,
						subject: "Fwd: Original Email",
						text: "Unauthenticated forward",
						html: "<p>Unauthenticated forward</p>",
					}),
				}
			);

			expect(response.status).toBe(401);
		});

		it("should validate required fields in forward", async () => {
			const response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/forward`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "newrecipient@example.com",
						from: testMailboxId,
						subject: "Fwd: Original Email",
						// Missing text and html
					}),
				}
			);

			expect(response.status).toBe(400);
		});
	});

	describe("Email Threading Metadata", () => {
		it("should preserve thread_id across replies", async () => {
			// Create multiple replies to the same original email
			const reply1Response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "recipient@example.com",
						from: testMailboxId,
						subject: "Re: Original Email",
						text: "Reply 1",
						html: "<p>Reply 1</p>",
					}),
				}
			);
			const reply1Body = await reply1Response.json<any>();

			const reply2Response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "recipient@example.com",
						from: testMailboxId,
						subject: "Re: Original Email",
						text: "Reply 2",
						html: "<p>Reply 2</p>",
					}),
				}
			);
			const reply2Body = await reply2Response.json<any>();

			// Both replies should have the same thread_id (the original email ID)
			const reply1Email = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${reply1Body.id}`
			);
			const reply1EmailBody = await reply1Email.json<any>();

			const reply2Email = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${reply2Body.id}`
			);
			const reply2EmailBody = await reply2Email.json<any>();

			expect(reply1EmailBody.thread_id).toBe(originalEmailId);
			expect(reply2EmailBody.thread_id).toBe(originalEmailId);
		});

		it("should include threading fields in email list", async () => {
			// Reply to create threading metadata
			await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "recipient@example.com",
						from: testMailboxId,
						subject: "Re: Original Email",
						text: "Test reply",
						html: "<p>Test reply</p>",
					}),
				}
			);

			// List emails in sent folder
			const listResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails?folder=sent`
			);

			expect(listResponse.status).toBe(200);
			const emails = await listResponse.json<any[]>();
			
			// Find the reply email
			const replyEmail = emails.find(e => e.subject === "Re: Original Email");
			expect(replyEmail).toBeDefined();
			expect(replyEmail.in_reply_to).toBeDefined();
			expect(replyEmail.thread_id).toBeDefined();
		});
	});

	describe("Attachments in Reply/Forward", () => {
		it("should support attachments in reply", async () => {
			const response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "recipient@example.com",
						from: testMailboxId,
						subject: "Re: Original Email",
						text: "Reply with attachment",
						html: "<p>Reply with attachment</p>",
						attachments: [
							{
								filename: "test.txt",
								content: btoa("test content"),
								type: "text/plain",
								disposition: "attachment",
							},
						],
					}),
				}
			);

			expect(response.status).toBe(201);
			const body = await response.json<any>();

			// Verify attachment was stored
			const replyEmail = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${body.id}`
			);
			const replyEmailBody = await replyEmail.json<any>();
			
			expect(replyEmailBody.attachments).toBeDefined();
			expect(replyEmailBody.attachments.length).toBe(1);
			expect(replyEmailBody.attachments[0].filename).toBe("test.txt");
		});

		it("should support attachments in forward", async () => {
			const response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/forward`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "newrecipient@example.com",
						from: testMailboxId,
						subject: "Fwd: Original Email",
						text: "Forward with attachment",
						html: "<p>Forward with attachment</p>",
						attachments: [
							{
								filename: "document.pdf",
								content: btoa("pdf content"),
								type: "application/pdf",
								disposition: "attachment",
							},
						],
					}),
				}
			);

			expect(response.status).toBe(201);
			const body = await response.json<any>();

			// Verify attachment was stored
			const forwardEmail = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${body.id}`
			);
			const forwardEmailBody = await forwardEmail.json<any>();
			
			expect(forwardEmailBody.attachments).toBeDefined();
			expect(forwardEmailBody.attachments.length).toBe(1);
			expect(forwardEmailBody.attachments[0].filename).toBe("document.pdf");
		});
	});

	describe("Edge Cases", () => {
		it("should handle reply with multiple recipients", async () => {
			const response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: ["recipient1@example.com", "recipient2@example.com"],
						from: testMailboxId,
						subject: "Re: Original Email",
						text: "Reply to multiple",
						html: "<p>Reply to multiple</p>",
					}),
				}
			);

			expect(response.status).toBe(201);
		});

		it("should handle forward with multiple recipients", async () => {
			const response = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${originalEmailId}/forward`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: ["new1@example.com", "new2@example.com"],
						from: testMailboxId,
						subject: "Fwd: Original Email",
						text: "Forward to multiple",
						html: "<p>Forward to multiple</p>",
					}),
				}
			);

			expect(response.status).toBe(201);
		});

		it("should handle long reference chains", async () => {
			let currentEmailId = originalEmailId;
			const replyIds: string[] = [originalEmailId];

			// Create a chain of 5 replies
			for (let i = 0; i < 5; i++) {
				const replyResponse = await authenticatedFetch(
					`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${currentEmailId}/reply`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							to: "recipient@example.com",
							from: testMailboxId,
							subject: `Re: Original Email (Reply ${i + 1})`,
							text: `Reply ${i + 1}`,
							html: `<p>Reply ${i + 1}</p>`,
						}),
					}
				);
				
				expect(replyResponse.status).toBe(201);
				const replyBody = await replyResponse.json<any>();
				currentEmailId = replyBody.id;
				replyIds.push(currentEmailId);
			}

			// Check the last reply has all previous messages in references
			const lastReply = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${testMailboxId}/emails/${currentEmailId}`
			);
			const lastReplyBody = await lastReply.json<any>();
			
			const references = JSON.parse(lastReplyBody.email_references);
			expect(references.length).toBeGreaterThanOrEqual(5);
		});
	});
});
