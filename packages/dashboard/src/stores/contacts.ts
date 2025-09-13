import { defineStore } from "pinia";
import api from "@/services/api";
import type { Contact } from "@/types";

export const useContactStore = defineStore("contacts", {
	state: () => ({
		contacts: [] as Contact[],
	}),
	actions: {
		async fetchContacts(mailboxId: string) {
			const response = await api.listContacts(mailboxId);
			this.contacts = response.data;
		},
		async createContact(mailboxId: string, contact: any) {
			const response = await api.createContact(mailboxId, contact);
			this.contacts.push(response.data);
		},
		async updateContact(mailboxId: string, id: string, contact: any) {
			const response = await api.updateContact(mailboxId, id, contact);
			const index = this.contacts.findIndex((c) => c.id === id);
			if (index !== -1) {
				this.contacts[index] = response.data;
			}
		},
		async deleteContact(mailboxId: string, id: string) {
			await api.deleteContact(mailboxId, id);
			this.contacts = this.contacts.filter((c) => c.id !== id);
		},
	},
});
