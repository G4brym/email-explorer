import { defineStore } from "pinia";
import api from "@/services/api";
import type { Mailbox } from "@/types";

export const useMailboxStore = defineStore("mailboxes", {
	state: () => ({
		mailboxes: [] as Mailbox[],
		currentMailbox: null as Mailbox | null,
	}),
	actions: {
		async fetchMailboxes() {
			const response = await api.listMailboxes();
			this.mailboxes = response.data;
		},
		async fetchMailbox(id: string) {
			const response = await api.getMailbox(id);
			this.currentMailbox = response.data;
		},
		async updateMailbox(id: string, settings: any) {
			const response = await api.updateMailbox(id, settings);
			this.currentMailbox = response.data;
		},
		async deleteMailbox(id: string) {
			await api.deleteMailbox(id);
			this.mailboxes = this.mailboxes.filter((mailbox) => mailbox.id !== id);
		},
	},
});
