import { SELF, env } from "cloudflare:test";
import { describe, expect, it, beforeEach } from "vitest";

describe("Mailbox Authorization Regression Tests (Issue #19)", () => {
	// Helper to make authenticated request
	const authenticatedFetch = (
		url: string,
		sessionToken: string,
		options: RequestInit = {},
	) => {
		return SELF.fetch(url, {
			...options,
			headers: {
				...options.headers,
				Authorization: `Bearer ${sessionToken}`,
			},
		});
	};

	// Helper to create a mailbox in R2
	const createMailbox = async (mailboxId: string, settings = {}) => {
		// @ts-expect-error
		await env.BUCKET.put(
			`mailboxes/${mailboxId}.json`,
			JSON.stringify(settings),
		);
	};

	// Setup: create admin, non-admin user, and mailboxes
	const setupUsersAndMailboxes = async () => {
		// Register admin (first user)
		await SELF.fetch("http://local.test/api/v1/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "admin@test.com",
				password: "password123",
			}),
		});

		const adminLogin = await SELF.fetch(
			"http://local.test/api/v1/auth/login",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: "admin@test.com",
					password: "password123",
				}),
			},
		);
		const adminBody = await adminLogin.json<any>();
		const adminToken = adminBody.id;

		// Create non-admin user
		const registerRes = await authenticatedFetch(
			"http://local.test/api/v1/auth/admin/register",
			adminToken,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: "user@test.com",
					password: "password123",
				}),
			},
		);
		const user = await registerRes.json<any>();

		// Login as non-admin user
		const userLogin = await SELF.fetch(
			"http://local.test/api/v1/auth/login",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: "user@test.com",
					password: "password123",
				}),
			},
		);
		const userBody = await userLogin.json<any>();
		const userToken = userBody.id;

		// Create mailboxes in R2
		await createMailbox("allowed@test.com");
		await createMailbox("forbidden@test.com");
		await createMailbox("another-forbidden@test.com");

		// Grant user access only to "allowed@test.com"
		await authenticatedFetch(
			"http://local.test/api/v1/auth/admin/grant-access",
			adminToken,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user.id,
					mailboxId: "allowed@test.com",
					role: "read",
				}),
			},
		);

		return { adminToken, userToken, userId: user.id };
	};

	describe("GetMailboxes endpoint filtering", () => {
		it("should only return mailboxes the non-admin user has access to", async () => {
			const { userToken } = await setupUsersAndMailboxes();

			const response = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes",
				userToken,
			);

			expect(response.status).toBe(200);
			const mailboxes = await response.json<any[]>();

			// Non-admin user should only see the mailbox they have access to
			expect(mailboxes.length).toBe(1);
			expect(mailboxes[0].id).toBe("allowed@test.com");
		});

		it("should return all mailboxes for admin users", async () => {
			const { adminToken } = await setupUsersAndMailboxes();

			const response = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes",
				adminToken,
			);

			expect(response.status).toBe(200);
			const mailboxes = await response.json<any[]>();

			// Admin should see all mailboxes
			const ids = mailboxes.map((m: any) => m.id);
			expect(ids).toContain("allowed@test.com");
			expect(ids).toContain("forbidden@test.com");
			expect(ids).toContain("another-forbidden@test.com");
		});

		it("should return no mailboxes for a non-admin user with no access grants", async () => {
			// Register admin
			await SELF.fetch("http://local.test/api/v1/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: "admin2@test.com",
					password: "password123",
				}),
			});

			const adminLogin = await SELF.fetch(
				"http://local.test/api/v1/auth/login",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "admin2@test.com",
						password: "password123",
					}),
				},
			);
			const adminBody = await adminLogin.json<any>();
			const adminToken = adminBody.id;

			// Create non-admin user with no mailbox access
			await authenticatedFetch(
				"http://local.test/api/v1/auth/admin/register",
				adminToken,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "noaccess@test.com",
						password: "password123",
					}),
				},
			);

			const userLogin = await SELF.fetch(
				"http://local.test/api/v1/auth/login",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "noaccess@test.com",
						password: "password123",
					}),
				},
			);
			const userBody = await userLogin.json<any>();
			const userToken = userBody.id;

			// Create a mailbox
			await createMailbox("some-mailbox@test.com");

			const response = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes",
				userToken,
			);

			expect(response.status).toBe(200);
			const mailboxes = await response.json<any[]>();
			expect(mailboxes.length).toBe(0);
		});
	});

	describe("Mailbox route middleware authorization", () => {
		it("should return 403 when non-admin accesses a mailbox they don't have access to", async () => {
			const { userToken } = await setupUsersAndMailboxes();

			const response = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/forbidden@test.com",
				userToken,
			);

			expect(response.status).toBe(403);
			const body = await response.json<any>();
			expect(body.error).toContain("don't have access");
		});

		it("should allow non-admin to access a mailbox they have been granted access to", async () => {
			const { userToken } = await setupUsersAndMailboxes();

			const response = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/allowed@test.com",
				userToken,
			);

			expect(response.status).toBe(200);
		});

		it("should allow admin to access any mailbox", async () => {
			const { adminToken } = await setupUsersAndMailboxes();

			const response = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/forbidden@test.com",
				adminToken,
			);

			// Admin can access any mailbox (404 if it doesn't have settings, but not 403)
			expect(response.status).not.toBe(403);
		});

		it("should block non-admin from accessing sub-routes of unauthorized mailbox", async () => {
			const { userToken } = await setupUsersAndMailboxes();

			// Try to access emails of a forbidden mailbox
			const emailsResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/forbidden@test.com/emails",
				userToken,
			);
			expect(emailsResponse.status).toBe(403);

			// Try to access folders of a forbidden mailbox
			const foldersResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/forbidden@test.com/folders",
				userToken,
			);
			expect(foldersResponse.status).toBe(403);

			// Try to access contacts of a forbidden mailbox
			const contactsResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/forbidden@test.com/contacts",
				userToken,
			);
			expect(contactsResponse.status).toBe(403);

			// Try to search in a forbidden mailbox
			const searchResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/forbidden@test.com/search?query=test",
				userToken,
			);
			expect(searchResponse.status).toBe(403);
		});

		it("should allow non-admin to access sub-routes of authorized mailbox", async () => {
			const { userToken } = await setupUsersAndMailboxes();

			// Access folders of an allowed mailbox
			const foldersResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/allowed@test.com/folders",
				userToken,
			);
			expect(foldersResponse.status).toBe(200);

			// Access emails of an allowed mailbox
			const emailsResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/allowed@test.com/emails",
				userToken,
			);
			expect(emailsResponse.status).toBe(200);

			// Access contacts of an allowed mailbox
			const contactsResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/allowed@test.com/contacts",
				userToken,
			);
			expect(contactsResponse.status).toBe(200);
		});
	});

	describe("Access grant and revoke lifecycle", () => {
		it("should block access after mailbox access is revoked", async () => {
			const { adminToken, userToken, userId } =
				await setupUsersAndMailboxes();

			// Verify user can access the allowed mailbox
			const beforeResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/allowed@test.com/folders",
				userToken,
			);
			expect(beforeResponse.status).toBe(200);

			// Revoke access
			await authenticatedFetch(
				"http://local.test/api/v1/auth/admin/revoke-access",
				adminToken,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: userId,
						mailboxId: "allowed@test.com",
					}),
				},
			);

			// Verify user can no longer access the mailbox
			const afterResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/allowed@test.com",
				userToken,
			);
			expect(afterResponse.status).toBe(403);

			// Verify the mailbox no longer appears in the list
			const listResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes",
				userToken,
			);
			const mailboxes = await listResponse.json<any[]>();
			expect(mailboxes.length).toBe(0);
		});

		it("should allow access after mailbox access is granted", async () => {
			const { adminToken, userToken, userId } =
				await setupUsersAndMailboxes();

			// Verify user cannot access the forbidden mailbox
			const beforeResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/forbidden@test.com",
				userToken,
			);
			expect(beforeResponse.status).toBe(403);

			// Grant access to the forbidden mailbox
			await authenticatedFetch(
				"http://local.test/api/v1/auth/admin/grant-access",
				adminToken,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: userId,
						mailboxId: "forbidden@test.com",
						role: "read",
					}),
				},
			);

			// Verify user can now access the mailbox
			const afterResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes/forbidden@test.com",
				userToken,
			);
			expect(afterResponse.status).not.toBe(403);

			// Verify the mailbox now appears in the list
			const listResponse = await authenticatedFetch(
				"http://local.test/api/v1/mailboxes",
				userToken,
			);
			const mailboxes = await listResponse.json<any[]>();
			const ids = mailboxes.map((m: any) => m.id);
			expect(ids).toContain("allowed@test.com");
			expect(ids).toContain("forbidden@test.com");
			expect(ids).not.toContain("another-forbidden@test.com");
		});
	});
});
