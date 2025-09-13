import { SELF, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const mailboxId = "test@example.com";

async function createMailbox(settings = {}) {
	// @ts-expect-error
	await env.BUCKET.put(`mailboxes/${mailboxId}.json`, JSON.stringify(settings));
}

describe("API Integration Tests", () => {
	// Tests for Mailboxes
	describe("Mailboxes API", () => {
		it("should get an empty list of mailboxes", async () => {
			const response = await SELF.fetch(`http://local.test/api/v1/mailboxes`);
			const body = await response.json<any[]>();

			expect(response.status).toBe(200);
			expect(body).toEqual([]);
		});

		it("should get a list with one mailbox", async () => {
			await createMailbox();
			const response = await SELF.fetch(`http://local.test/api/v1/mailboxes`);
			const body = await response.json<any[]>();

			expect(response.status).toBe(200);
			expect(body.length).toBe(1);
			expect(body[0]).toEqual(
				expect.objectContaining({
					id: mailboxId,
					name: mailboxId,
					email: mailboxId,
				}),
			);
		});

		it("should get a single mailbox", async () => {
			await createMailbox({ setting1: "value1" });
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}`,
			);
			const body = await response.json<any>();

			expect(response.status).toBe(200);
			expect(body).toEqual(
				expect.objectContaining({
					id: mailboxId,
					name: mailboxId,
					email: mailboxId,
					settings: { setting1: "value1" },
				}),
			);
		});

		it("should return 404 for a non-existent mailbox", async () => {
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/nonexistent@example.com`,
			);
			expect(response.status).toBe(404);
		});

		it("should update a mailbox", async () => {
			await createMailbox();
			const updatedSettings = { setting2: "value2" };
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ settings: updatedSettings }),
				},
			);
			const body = await response.json<any>();

			expect(response.status).toBe(200);
			expect(body.settings).toEqual(updatedSettings);
		});

		it("should delete a mailbox", async () => {
			await createMailbox();
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}`,
				{
					method: "DELETE",
				},
			);
			expect(response.status).toBe(204);

			const getResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}`,
			);
			expect(getResponse.status).toBe(404);
		});
	});

	// Tests for Emails
	describe("Emails API", () => {
		it("should get an empty list of emails", async () => {
			await createMailbox();
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
			);
			const body = await response.json<any[]>();

			expect(response.status).toBe(200);
			expect(body).toEqual([]);
		});

		it("should send an email", async () => {
			await createMailbox();
			const emailData = {
				to: ["recipient@example.com"],
				from: "sender@example.com",
				subject: "Test Email",
				text: "This is a test email.",
			};
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData),
				},
			);
			const body = await response.json<any>();

			expect(response.status).toBe(201);
			expect(body.status).toBe("sent");
		});

		it("should get an email", async () => {
			await createMailbox();
			const emailData = {
				to: ["recipient@example.com"],
				from: "sender@example.com",
				subject: "Test Email",
				text: "This is a test email.",
			};
			const postResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData),
				},
			);
			const postBody = await postResponse.json<any>();
			const emailId = postBody.id;

			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId}`,
			);
			const body = await response.json<any>();

			expect(response.status).toBe(200);
			expect(body.subject).toBe("Test Email");
		});

		it("should update an email", async () => {
			await createMailbox();
			const emailData = {
				to: ["recipient@example.com"],
				from: "sender@example.com",
				subject: "Test Email",
				text: "This is a test email.",
			};
			const postResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData),
				},
			);
			const postBody = await postResponse.json<any>();
			const emailId = postBody.id;

			const updatedData = {
				read: true,
				starred: true,
			};
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updatedData),
				},
			);
			const body = await response.json<any>();

			expect(response.status).toBe(200);
			expect(body.read).toBe(true);
			expect(body.starred).toBe(true);
		});

		it("should delete an email", async () => {
			await createMailbox();
			const emailData = {
				to: ["recipient@example.com"],
				from: "sender@example.com",
				subject: "Test Email",
				text: "This is a test email.",
			};
			const postResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData),
				},
			);
			const postBody = await postResponse.json<any>();
			const emailId = postBody.id;

			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId}`,
				{
					method: "DELETE",
				},
			);
			expect(response.status).toBe(204);

			const getResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId}`,
			);
			expect(getResponse.status).toBe(404);
		});

		it("should filter emails by folder", async () => {
			await createMailbox();

			// Create a new folder
			const folderData = { name: "Test Folder" };
			const folderResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(folderData),
				},
			);
			const folderBody = await folderResponse.json<any>();
			const folderId = folderBody.id;

			// Create an email in the new folder
			const emailData1 = {
				to: ["recipient1@example.com"],
				from: "sender@example.com",
				subject: "Email in Test Folder",
				text: "This email should be in the test folder.",
			};
			const postEmailResponse1 = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData1),
				},
			);
			const postEmailBody1 = await postEmailResponse1.json<any>();
			const emailId1 = postEmailBody1.id;
			await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId1}/move`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ folderId }),
				},
			);

			// Create another email (will be in "Sent" by default)
			const emailData2 = {
				to: ["recipient2@example.com"],
				from: "sender@example.com",
				subject: "Email in Sent Folder",
				text: "This email should be in the sent folder.",
			};
			await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData2),
				},
			);

			// Get emails filtered by the new folder
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?folder=Test%20Folder`,
			);
			const body = await response.json<any[]>();

			expect(response.status).toBe(200);
			expect(body.length).toBe(1);
			expect(body[0].subject).toBe("Email in Test Folder");

			// Get all emails
			const allEmailsResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
			);
			const allEmailsBody = await allEmailsResponse.json<any[]>();
			expect(allEmailsResponse.status).toBe(200);
			expect(allEmailsBody.length).toBe(2);
		});

		it("should filter emails by folder id", async () => {
			await createMailbox();

			// Create a new folder
			const folderData = { name: "Another Test Folder" };
			const folderResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(folderData),
				},
			);
			const folderBody = await folderResponse.json<any>();
			const folderId = folderBody.id;

			// Create an email in the new folder
			const emailData1 = {
				to: ["recipient1@example.com"],
				from: "sender@example.com",
				subject: "Email in Another Test Folder",
				text: "This email should be in another test folder.",
			};
			const postEmailResponse1 = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData1),
				},
			);
			const postEmailBody1 = await postEmailResponse1.json<any>();
			const emailId1 = postEmailBody1.id;
			await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId1}/move`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ folderId }),
				},
			);

			// Get emails filtered by the new folder
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?folder=${folderId}`,
			);
			const body = await response.json<any[]>();

			expect(response.status).toBe(200);
			expect(body.length).toBe(1);
			expect(body[0].subject).toBe("Email in Another Test Folder");
		});

		it("should paginate emails", async () => {
			await createMailbox();
			// Create 3 emails
			for (let i = 0; i < 3; i++) {
				await SELF.fetch(
					`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							to: [`recipient${i}@example.com`],
							from: "sender@example.com",
							subject: `Email ${i}`,
							text: `This is email ${i}.`,
						}),
					},
				);
			}

			// Get page 1 with 2 emails
			const page1Response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?page=1&limit=2`,
			);
			const page1Body = await page1Response.json<any[]>();
			expect(page1Response.status).toBe(200);
			expect(page1Body.length).toBe(2);

			// Get page 2 with 1 email
			const page2Response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?page=2&limit=2`,
			);
			const page2Body = await page2Response.json<any[]>();
			expect(page2Response.status).toBe(200);
			expect(page2Body.length).toBe(1);
		});

		it("should sort emails", async () => {
			await createMailbox();
			// Create 2 emails
			await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: ["recipient1@example.com"],
						from: "sender@example.com",
						subject: "A Subject",
						text: "...",
					}),
				},
			);
			await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: ["recipient2@example.com"],
						from: "sender@example.com",
						subject: "B Subject",
						text: "...",
					}),
				},
			);

			// Sort by subject ascending
			const ascResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?sortColumn=subject&sortDirection=ASC`,
			);
			const ascBody = await ascResponse.json<any[]>();
			expect(ascResponse.status).toBe(200);
			expect(ascBody[0].subject).toBe("A Subject");
			expect(ascBody[1].subject).toBe("B Subject");

			// Sort by subject descending
			const descResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?sortColumn=subject&sortDirection=DESC`,
			);
			const descBody = await descResponse.json<any[]>();
			expect(descResponse.status).toBe(200);
			expect(descBody[0].subject).toBe("B Subject");
			expect(descBody[1].subject).toBe("A Subject");
		});
	});

	// Tests for Folders
	describe("Folders API", () => {
		it("should get a list of folders", async () => {
			await createMailbox();
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
			);
			const body = await response.json<any[]>();

			expect(response.status).toBe(200);
			expect(body.length).toBeGreaterThan(0); // Default folders
		});

		it("should create a folder", async () => {
			await createMailbox();
			const folderData = {
				name: "Test Folder",
			};
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(folderData),
				},
			);
			const body = await response.json<any>();

			expect(response.status).toBe(201);
			expect(body.name).toBe("Test Folder");
		});

		it("should update a folder", async () => {
			await createMailbox();
			const folderData = {
				name: "Test Folder",
			};
			const postResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(folderData),
				},
			);
			const postBody = await postResponse.json<any>();
			const folderId = postBody.id;

			const updatedData = {
				name: "Updated Folder",
			};
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders/${folderId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updatedData),
				},
			);
			const body = await response.json<any>();

			expect(response.status).toBe(200);
			expect(body.name).toBe("Updated Folder");
		});

		it("should delete a folder", async () => {
			await createMailbox();
			const folderData = {
				name: "Test Folder",
			};
			const postResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(folderData),
				},
			);
			const postBody = await postResponse.json<any>();
			const folderId = postBody.id;

			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders/${folderId}`,
				{
					method: "DELETE",
				},
			);
			expect(response.status).toBe(204);
		});

		it("should return 409 when creating a folder that already exists", async () => {
			await createMailbox();
			const folderData = { name: "Duplicate-Folder" };
			const initialResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(folderData),
				},
			);
			expect(initialResponse.status).toBe(201);

			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(folderData),
				},
			);

			expect(response.status).toBe(409);
		});

		it("should not delete a non-deletable folder", async () => {
			await createMailbox();
			// Get default folders
			const foldersResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
			);
			const foldersBody = await foldersResponse.json<any[]>();
			const inboxFolder = foldersBody.find((f) => f.name === "Inbox");

			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders/${inboxFolder.id}`,
				{
					method: "DELETE",
				},
			);
			expect(response.status).toBe(400);
		});
	});

	// Tests for Contacts
	describe("Contacts API", () => {
		it("should get an empty list of contacts", async () => {
			await createMailbox();
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/contacts`,
			);
			const body = await response.json<any[]>();

			expect(response.status).toBe(200);
			expect(body).toEqual([]);
		});

		it("should create a contact", async () => {
			await createMailbox();
			const contactData = {
				name: "Test Contact",
				email: "contact@example.com",
			};
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/contacts`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(contactData),
				},
			);
			const body = await response.json<any>();

			expect(response.status).toBe(201);
			expect(body.name).toBe("Test Contact");
		});

		it("should update a contact", async () => {
			await createMailbox();
			const contactData = {
				name: "Test Contact",
				email: "contact@example.com",
			};
			const postResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/contacts`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(contactData),
				},
			);
			const postBody = await postResponse.json<any>();
			const contactId = postBody.id;

			const updatedData = {
				name: "Updated Contact",
				email: "contact@example.com",
			};
			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/contacts/${contactId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updatedData),
				},
			);
			const body = await response.json<any>();

			expect(response.status).toBe(200);
			expect(body.name).toBe("Updated Contact");
		});

		it("should delete a contact", async () => {
			await createMailbox();
			const contactData = {
				name: "Test Contact",
				email: "contact@example.com",
			};
			const postResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/contacts`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(contactData),
				},
			);
			const postBody = await postResponse.json<any>();
			const contactId = postBody.id;

			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/contacts/${contactId}`,
				{
					method: "DELETE",
				},
			);
			expect(response.status).toBe(204);
		});
	});

	// Tests for Search
	describe("Search API", () => {
		it("should search for emails", async () => {
			await createMailbox();
			const emailData = {
				to: ["recipient@example.com"],
				from: "sender@example.com",
				subject: "Test Email",
				text: "This is a test email about searching.",
			};
			await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData),
				},
			);

			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/search?query=searching`,
			);
			const body = await response.json<any[]>();

			expect(response.status).toBe(200);
			expect(body.length).toBe(1);
			expect(body[0].subject).toBe("Test Email");
		});
	});

	// Tests for Move Email
	describe("Move Email API", () => {
		it("should move an email to a different folder", async () => {
			await createMailbox();
			// Create email
			const emailData = {
				to: ["recipient@example.com"],
				from: "sender@example.com",
				subject: "Test Email",
				text: "This is a test email.",
			};
			const postResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData),
				},
			);
			const postBody = await postResponse.json<any>();
			const emailId = postBody.id;

			// Create folder if it doesn't exist
			const foldersResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
			);
			const foldersBody = await foldersResponse.json<any[]>();
			let archiveFolder = foldersBody.find((f) => f.name === "Archive");

			if (!archiveFolder) {
				const folderData = { name: "Archive" };
				const folderResponse = await SELF.fetch(
					`http://local.test/api/v1/mailboxes/${mailboxId}/folders`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(folderData),
					},
				);
				archiveFolder = await folderResponse.json<any>();
			}
			const folderId = archiveFolder.id.toString();

			// Move email
			const moveResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId}/move`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ folderId }),
				},
			);
			expect(moveResponse.status).toBe(200);

			// Verify email is in the new folder
			const emailsInFolderResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails?folder=Archive`,
			);
			const emailsInFolderBody = await emailsInFolderResponse.json<any[]>();
			expect(emailsInFolderResponse.status).toBe(200);
			expect(emailsInFolderBody.length).toBe(1);
			expect(emailsInFolderBody[0].id).toBe(emailId);
		});

		it("should return 400 when moving to a non-existent folder", async () => {
			await createMailbox();
			const emailData = {
				to: ["recipient@example.com"],
				from: "sender@example.com",
				subject: "Test Email",
				text: "This is a test email.",
			};
			const postResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData),
				},
			);
			const postBody = await postResponse.json<any>();
			const emailId = postBody.id;

			const moveResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId}/move`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ folderId: 999 }), // Non-existent folder
				},
			);
			expect(moveResponse.status).toBe(400);
		});
	});

	// Tests for Attachments
	describe("Attachments API", () => {
		it("should get an attachment", async () => {
			await createMailbox();
			const attachmentContent = "this is a test attachment";
			const attachmentContentBase64 = btoa(attachmentContent);

			const emailData = {
				to: ["recipient@example.com"],
				from: "sender@example.com",
				subject: "Email with attachment",
				text: "...",
				attachments: [
					{
						content: attachmentContentBase64,
						filename: "test.txt",
						type: "text/plain",
						disposition: "attachment",
					},
				],
			};

			const postEmailResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailData),
				},
			);
			const postEmailBody = await postEmailResponse.json<any>();
			const emailId = postEmailBody.id;

			const getEmailResponse = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId}`,
			);
			const getEmailBody = await getEmailResponse.json<any>();
			const attachmentId = getEmailBody.attachments[0].id;

			const response = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId}/attachments/${attachmentId}`,
			);
			const body = await response.text();

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Disposition")).toBe(
				`attachment; filename="test.txt"`,
			);
			expect(body).toBe(attachmentContent);
		});

		it("should handle attachments with and without contentId", async () => {
			await createMailbox();
			const attachmentContent = "this is a test attachment";
			const attachmentContentBase64 = btoa(attachmentContent);

			const emailDataWithContentId = {
				to: ["recipient@example.com"],
				from: "sender@example.com",
				subject: "Email with contentId",
				text: "...",
				attachments: [
					{
						content: attachmentContentBase64,
						filename: "test.txt",
						type: "text/plain",
						disposition: "inline",
						contentId: "my-content-id",
					},
				],
			};

			const emailDataWithoutContentId = {
				to: ["recipient@example.com"],
				from: "sender@example.com",
				subject: "Email without contentId",
				text: "...",
				attachments: [
					{
						content: attachmentContentBase64,
						filename: "test2.txt",
						type: "text/plain",
						disposition: "attachment",
					},
				],
			};

			// Send email with contentId
			const postEmailResponse1 = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailDataWithContentId),
				},
			);
			expect(postEmailResponse1.status).toBe(201);
			const postEmailBody1 = await postEmailResponse1.json<any>();
			const emailId1 = postEmailBody1.id;

			// Send email without contentId
			const postEmailResponse2 = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(emailDataWithoutContentId),
				},
			);
			expect(postEmailResponse2.status).toBe(201);
			const postEmailBody2 = await postEmailResponse2.json<any>();
			const emailId2 = postEmailBody2.id;

			// Verify first email and attachment
			const getEmailResponse1 = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId1}`,
			);
			const getEmailBody1 = await getEmailResponse1.json<any>();
			expect(getEmailResponse1.status).toBe(200);
			expect(getEmailBody1.attachments.length).toBe(1);
			expect(getEmailBody1.attachments[0].content_id).toBe("my-content-id");

			// Verify second email and attachment
			const getEmailResponse2 = await SELF.fetch(
				`http://local.test/api/v1/mailboxes/${mailboxId}/emails/${emailId2}`,
			);
			const getEmailBody2 = await getEmailResponse2.json<any>();
			expect(getEmailResponse2.status).toBe(200);
			expect(getEmailBody2.attachments.length).toBe(1);
			expect(getEmailBody2.attachments[0].content_id).toBe(null);
		});
	});
});
