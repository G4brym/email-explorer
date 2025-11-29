import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const apiClient = axios.create({
	baseURL: "",
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
	(config) => {
		const session = localStorage.getItem("session");
		if (session) {
			try {
				const parsed = JSON.parse(session);
				config.headers.Authorization = `Bearer ${parsed.id}`;
			} catch (e) {
				// Invalid session, ignore
			}
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// Response interceptor to handle 401
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			// Clear auth and redirect to login
			localStorage.removeItem("session");
			if (window.location.pathname !== "/login") {
				window.location.href = "/login";
			}
		}
		return Promise.reject(error);
	},
);

export default {
	// Auth
	register: (email: string, password: string) =>
		apiClient.post("/api/v1/auth/register", { email, password }),
	login: (email: string, password: string) =>
		apiClient.post("/api/v1/auth/login", { email, password }),
	logout: () => apiClient.post("/api/v1/auth/logout"),
	getCurrentUser: () => apiClient.get("/api/v1/auth/me"),

	// Set/clear auth token manually
	setAuthToken: (token: string) => {
		apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
	},
	clearAuthToken: () => {
		delete apiClient.defaults.headers.common["Authorization"];
	},

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
	replyToEmail: (mailboxId: string, emailId: string, email: any) =>
		apiClient.post(
			`/api/v1/mailboxes/${mailboxId}/emails/${emailId}/reply`,
			email,
		),
	forwardEmail: (mailboxId: string, emailId: string, email: any) =>
		apiClient.post(
			`/api/v1/mailboxes/${mailboxId}/emails/${emailId}/forward`,
			email,
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

	// Admin
	adminRegisterUser: (email: string, password: string) =>
		apiClient.post("/api/v1/auth/admin/register", { email, password }),
	adminListUsers: () => apiClient.get("/api/v1/auth/admin/users"),
	adminGrantAccess: (userId: string, mailboxId: string, role: string) =>
		apiClient.post("/api/v1/auth/admin/grant-access", {
			userId,
			mailboxId,
			role,
		}),
	adminRevokeAccess: (userId: string, mailboxId: string) =>
		apiClient.post("/api/v1/auth/admin/revoke-access", { userId, mailboxId }),
};
