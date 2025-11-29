import { defineStore } from "pinia";

export type ComposeMode = "new" | "reply" | "reply-all" | "forward";

export interface ComposeOptions {
	mode: ComposeMode;
	originalEmail?: any;
}

export const useUIStore = defineStore("ui", {
	state: () => ({
		isComposeModalOpen: false,
		composeOptions: { mode: "new" as ComposeMode, originalEmail: null } as ComposeOptions,
	}),
	actions: {
		openComposeModal(options?: ComposeOptions) {
			this.composeOptions = options || { mode: "new", originalEmail: null };
			this.isComposeModalOpen = true;
		},
		closeComposeModal() {
			this.isComposeModalOpen = false;
			this.composeOptions = { mode: "new", originalEmail: null };
		},
	},
});
