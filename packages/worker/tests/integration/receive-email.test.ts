import { env, createExecutionContext } from "cloudflare:test";
import { describe, expect, it, beforeEach } from "vitest";
import { authenticatedFetch, mailboxId, testAuthBeforeAll } from "./utils";

// Build a raw RFC 2822 email string for testing
function buildRawEmail(headers: Record<string, string>, body: string): string {
	let raw = "";
	for (const [key, value] of Object.entries(headers)) {
		raw += `${key}: ${value}\r\n`;
	}
	raw += `\r\n${body}`;
	return raw;
}

// Simulate receiving an email by calling the worker's email handler
async function simulateReceiveEmail(rawEmailStr: string) {
	const worker = await import("../../dev/index");
	const rawBytes = new TextEncoder().encode(rawEmailStr);
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(rawBytes);
			controller.close();
		},
	});

	await worker.default.email(
		{ raw: stream, rawSize: rawBytes.length },
		env,
		createExecutionContext(),
	);
}

describe("Incoming Email Threading Tests", () => {
	beforeEach(async () => {
		await testAuthBeforeAll();
		await authenticatedFetch("http://local.test/api/v1/debug/create-mailbox", { method: "POST" });
	});

	describe("Threading Header Preservation", () => {
		it("should store In-Reply-To and References from incoming email", async () => {
			const rawEmail = buildRawEmail(
				{
					From: "sender@external.com",
					To: mailboxId,
					Subject: "Re: Test Thread",
					"Content-Type": "text/plain",
					"Message-ID": "<reply-1@external.com>",
					"In-Reply-To": "<original@external.com>",
					References:
						"<first@external.com> <original@external.com>",
				},
				"This is a threaded reply",
			);

			await simulateReceiveEmail(rawEmail);

			// Fetch emails from inbox
			const listResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?folder=inbox`,
			);
			expect(listResponse.status).toBe(200);
			const emails = await listResponse.json<any[]>();
			expect(emails.length).toBeGreaterThanOrEqual(1);

			const received = emails.find(
				(e: any) => e.subject === "Re: Test Thread",
			);
			expect(received).toBeDefined();

			// Fetch full email details
			const emailResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${received.id}`,
			);
			const emailBody = await emailResponse.json<any>();

			// Verify threading headers are stored without angle brackets
			expect(emailBody.in_reply_to).toBe("original@external.com");
			expect(emailBody.thread_id).toBe("first@external.com");

			const references = JSON.parse(emailBody.email_references);
			expect(references).toEqual([
				"first@external.com",
				"original@external.com",
			]);
		});

		it("should handle incoming email without threading headers", async () => {
			const rawEmail = buildRawEmail(
				{
					From: "sender@external.com",
					To: mailboxId,
					Subject: "New Conversation",
					"Content-Type": "text/plain",
					"Message-ID": "<new-msg@external.com>",
				},
				"This starts a new thread",
			);

			await simulateReceiveEmail(rawEmail);

			const listResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?folder=inbox`,
			);
			const emails = await listResponse.json<any[]>();
			const received = emails.find(
				(e: any) => e.subject === "New Conversation",
			);
			expect(received).toBeDefined();

			const emailResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${received.id}`,
			);
			const emailBody = await emailResponse.json<any>();

			// No threading headers — fields should be null/default
			expect(emailBody.in_reply_to).toBeNull();
			expect(emailBody.email_references).toBeNull();
			// thread_id should fall back to the email's own ID
			expect(emailBody.thread_id).toBe(emailBody.id);
		});

		it("should strip angle brackets from In-Reply-To for consistency with outgoing emails", async () => {
			const rawEmail = buildRawEmail(
				{
					From: "sender@external.com",
					To: mailboxId,
					Subject: "Bracket Test",
					"Content-Type": "text/plain",
					"Message-ID": "<test-msg@external.com>",
					"In-Reply-To": "<original-msg@external.com>",
				},
				"Testing angle bracket stripping",
			);

			await simulateReceiveEmail(rawEmail);

			const listResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?folder=inbox`,
			);
			const emails = await listResponse.json<any[]>();
			const received = emails.find(
				(e: any) => e.subject === "Bracket Test",
			);
			expect(received).toBeDefined();

			const emailResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${received.id}`,
			);
			const emailBody = await emailResponse.json<any>();

			// Must NOT contain angle brackets
			expect(emailBody.in_reply_to).toBe("original-msg@external.com");
			expect(emailBody.in_reply_to).not.toContain("<");
			expect(emailBody.in_reply_to).not.toContain(">");
		});

		it("should strip angle brackets from References for consistency with outgoing emails", async () => {
			const rawEmail = buildRawEmail(
				{
					From: "sender@external.com",
					To: mailboxId,
					Subject: "References Bracket Test",
					"Content-Type": "text/plain",
					"Message-ID": "<test-msg@external.com>",
					References:
						"<ref1@external.com> <ref2@external.com> <ref3@external.com>",
				},
				"Testing references bracket stripping",
			);

			await simulateReceiveEmail(rawEmail);

			const listResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?folder=inbox`,
			);
			const emails = await listResponse.json<any[]>();
			const received = emails.find(
				(e: any) => e.subject === "References Bracket Test",
			);
			expect(received).toBeDefined();

			const emailResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${received.id}`,
			);
			const emailBody = await emailResponse.json<any>();

			const references = JSON.parse(emailBody.email_references);
			expect(references).toEqual([
				"ref1@external.com",
				"ref2@external.com",
				"ref3@external.com",
			]);
			// No angle brackets in any reference
			for (const ref of references) {
				expect(ref).not.toContain("<");
				expect(ref).not.toContain(">");
			}
		});
	});

	describe("Reply to Incoming Email", () => {
		it("should correctly chain threading when replying to an incoming email", async () => {
			// Receive an incoming email with threading headers
			const rawEmail = buildRawEmail(
				{
					From: "sender@external.com",
					To: mailboxId,
					Subject: "External Thread",
					"Content-Type": "text/plain",
					"Message-ID": "<ext-reply@external.com>",
					"In-Reply-To": "<ext-original@external.com>",
					References: "<ext-original@external.com>",
				},
				"An incoming reply in an external thread",
			);

			await simulateReceiveEmail(rawEmail);

			// Find the received email
			const listResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?folder=inbox`,
			);
			const emails = await listResponse.json<any[]>();
			const received = emails.find(
				(e: any) => e.subject === "External Thread",
			);
			expect(received).toBeDefined();

			// Reply to the incoming email
			const replyResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${received.id}/reply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: "sender@external.com",
						from: mailboxId,
						subject: "Re: External Thread",
						text: "My reply to the external thread",
						html: "<p>My reply to the external thread</p>",
					}),
				},
			);

			expect(replyResponse.status).toBe(201);
			const replyBody = await replyResponse.json<any>();

			// Verify the reply has proper threading
			const replyEmail = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${replyBody.id}`,
			);
			const replyEmailBody = await replyEmail.json<any>();

			expect(replyEmailBody.in_reply_to).toBe(received.id);

			// References should include the incoming email's references chain + the incoming email ID
			const references = JSON.parse(replyEmailBody.email_references);
			expect(references).toContain("ext-original@external.com");
			expect(references).toContain(received.id);

			// References should NOT contain angle brackets (no double-wrapping)
			for (const ref of references) {
				expect(ref).not.toContain("<");
				expect(ref).not.toContain(">");
			}
		});
	});

	describe("Threading with Only In-Reply-To", () => {
		it("should use In-Reply-To as thread_id when References is absent", async () => {
			const rawEmail = buildRawEmail(
				{
					From: "sender@external.com",
					To: mailboxId,
					Subject: "Reply Without References",
					"Content-Type": "text/plain",
					"Message-ID": "<reply-no-refs@external.com>",
					"In-Reply-To": "<original-no-refs@external.com>",
				},
				"A reply without a References header",
			);

			await simulateReceiveEmail(rawEmail);

			const listResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?folder=inbox`,
			);
			const emails = await listResponse.json<any[]>();
			const received = emails.find(
				(e: any) => e.subject === "Reply Without References",
			);
			expect(received).toBeDefined();

			const emailResponse = await authenticatedFetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${received.id}`,
			);
			const emailBody = await emailResponse.json<any>();

			// With no References, thread_id should fall back to inReplyTo
			expect(emailBody.in_reply_to).toBe("original-no-refs@external.com");
			expect(emailBody.email_references).toBeNull();
			expect(emailBody.thread_id).toBe("original-no-refs@external.com");
		});
	});
});
