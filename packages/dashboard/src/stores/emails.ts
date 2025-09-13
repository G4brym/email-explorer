import { defineStore } from "pinia";
import api from "@/services/api";
import type { Email } from "@/types";

export const useEmailStore = defineStore("emails", {
	state: () => ({
		emails: [] as Email[],
		currentEmail: null as Email | null,
	}),
	actions: {
		async fetchEmails(mailboxId: string, params: any) {
			const response = await api.listEmails(mailboxId, params);
			this.emails = response.data;
		},
		async fetchEmail(mailboxId: string, id: string) {
			const response = await api.getEmail(mailboxId, id);
			this.currentEmail = response.data;
		},
		async sendEmail(mailboxId: string, email: any) {
			await api.sendEmail(mailboxId, email);
		},
		async updateEmail(mailboxId: string, id: string, data: any) {
			const response = await api.updateEmail(mailboxId, id, data);
			const updatedEmail = response.data;
			const index = this.emails.findIndex((email) => email.id === id);
			if (index !== -1) {
				this.emails[index] = { ...this.emails[index], ...updatedEmail };
			}
			if (this.currentEmail && this.currentEmail.id === id) {
				this.currentEmail = { ...this.currentEmail, ...updatedEmail };
			}
		},
		async deleteEmail(mailboxId: string, id: string) {
			await api.deleteEmail(mailboxId, id);
			this.emails = this.emails.filter((email) => email.id !== id);
		},
		async moveEmail(mailboxId: string, id: string, folderId: string) {
			await api.moveEmail(mailboxId, id, folderId);
			this.emails = this.emails.filter((email) => email.id !== id);
		},
	},
});
