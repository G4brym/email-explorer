import { defineStore } from "pinia";
import api from "@/services/api";
import type { Email } from "@/types";

export const useSearchStore = defineStore("search", {
	state: () => ({
		results: [] as Email[],
		isLoading: false,
	}),
	actions: {
		async searchEmails(mailboxId: string, query: string) {
			this.isLoading = true;
			try {
				const response = await api.searchEmails(mailboxId, { query });
				this.results = response.data;
			} finally {
				this.isLoading = false;
			}
		},
	},
});
