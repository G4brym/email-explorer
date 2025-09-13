import axios from "axios";

const apiClient = axios.create({
	baseURL: "",
	headers: {
		"Content-Type": "application/json",
	},
});

export default {
	// Mailboxes
	listMailboxes: () => apiClient.get("/api/v1/mailboxes"),
	getMailbox: (mailboxId: string) =>
		apiClient.get(`/api/v1/mailboxes/${mailboxId}`),
	updateMailbox: (mailboxId: string, settings: any) =>
		apiClient.put(`/api/v1/mailboxes/${mailboxId}`, { settings }),
	deleteMailbox: (mailboxId: string) =>
		apiClient.delete(`/api/v1/mailboxes/${mailboxId}`),

	// Emails
	listEmails: (mailboxId: string, params: any) =>
		apiClient.get(`/api/v1/mailboxes/${mailboxId}/emails`, { params }),
	sendEmail: (mailboxId: string, email: any) =>
		apiClient.post(`/api/v1/mailboxes/${mailboxId}/emails`, email),
	getEmail: (mailboxId: string, id: string) =>
		apiClient.get(`/api/v1/mailboxes/${mailboxId}/emails/${id}`),
	updateEmail: (mailboxId: string, id: string, data: any) =>
		apiClient.put(`/api/v1/mailboxes/${mailboxId}/emails/${id}`, data),
	deleteEmail: (mailboxId: string, id: string) =>
		apiClient.delete(`/api/v1/mailboxes/${mailboxId}/emails/${id}`),
	moveEmail: (mailboxId: string, id: string, folderId: string) =>
		apiClient.post(`/api/v1/mailboxes/${mailboxId}/emails/${id}/move`, {
			folderId,
		}),
	getAttachment: (mailboxId: string, emailId: string, attachmentId: string) =>
		apiClient.get(
			`/api/v1/mailboxes/${mailboxId}/emails/${emailId}/attachments/${attachmentId}`,
			{ responseType: "blob" },
		),

	// Folders
	listFolders: (mailboxId: string) =>
		apiClient.get(`/api/v1/mailboxes/${mailboxId}/folders`),
	createFolder: (mailboxId: string, name: string) =>
		apiClient.post(`/api/v1/mailboxes/${mailboxId}/folders`, { name }),
	updateFolder: (mailboxId: string, id: string, name: string) =>
		apiClient.put(`/api/v1/mailboxes/${mailboxId}/folders/${id}`, { name }),
	deleteFolder: (mailboxId: string, id: string) =>
		apiClient.delete(`/api/v1/mailboxes/${mailboxId}/folders/${id}`),

	// Contacts
	listContacts: (mailboxId: string) =>
		apiClient.get(`/api/v1/mailboxes/${mailboxId}/contacts`),
	createContact: (mailboxId: string, contact: any) =>
		apiClient.post(`/api/v1/mailboxes/${mailboxId}/contacts`, contact),
	updateContact: (mailboxId: string, id: string, contact: any) =>
		apiClient.put(`/api/v1/mailboxes/${mailboxId}/contacts/${id}`, contact),
	deleteContact: (mailboxId: string, id: string) =>
		apiClient.delete(`/api/v1/mailboxes/${mailboxId}/contacts/${id}`),

	// Search
	searchEmails: (mailboxId: string, params: any) =>
		apiClient.get(`/api/v1/mailboxes/${mailboxId}/search`, { params }),
};
