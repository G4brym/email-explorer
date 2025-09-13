import { defineStore } from "pinia";

export const useUIStore = defineStore("ui", {
	state: () => ({
		isComposeModalOpen: false,
	}),
	actions: {
		openComposeModal() {
			this.isComposeModalOpen = true;
		},
		closeComposeModal() {
			this.isComposeModalOpen = false;
		},
	},
});
