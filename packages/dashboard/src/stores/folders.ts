import { defineStore } from "pinia";
import api from "@/services/api";
import type { Folder } from "@/types";

export const useFolderStore = defineStore("folders", {
	state: () => ({
		folders: [] as Folder[],
	}),
	actions: {
		async fetchFolders(mailboxId: string) {
			const response = await api.listFolders(mailboxId);
			this.folders = response.data;
		},
		async createFolder(mailboxId: string, name: string) {
			const response = await api.createFolder(mailboxId, name);
			this.folders.push(response.data);
		},
		async updateFolder(mailboxId: string, id: string, name: string) {
			const response = await api.updateFolder(mailboxId, id, name);
			const index = this.folders.findIndex((folder) => folder.id === id);
			if (index !== -1) {
				this.folders[index] = response.data;
			}
		},
		async deleteFolder(mailboxId: string, id: string) {
			await api.deleteFolder(mailboxId, id);
			this.folders = this.folders.filter((folder) => folder.id !== id);
		},
	},
});
