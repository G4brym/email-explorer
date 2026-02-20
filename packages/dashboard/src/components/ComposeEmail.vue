<template>
  <div v-if="isComposeModalOpen" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all">
      <div class="flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-white">{{ modalTitle }}</h2>
        </div>
        <button @click="closeModal" class="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form @submit.prevent="send" class="p-6">
        <div v-if="error" class="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-start gap-3" role="alert">
          <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span class="block sm:inline">{{ error }}</span>
        </div>
        <div class="mb-5">
          <label for="to" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">To</label>
          <input 
            type="email" 
            id="to" 
            v-model="to" 
            class="block w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:focus:ring-indigo-400 text-gray-900 dark:text-gray-100 px-4 py-3 transition-all duration-200" 
            placeholder="recipient@example.com"
            required 
          />
        </div>
        <div class="mb-5">
          <label for="subject" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject</label>
          <input 
            type="text" 
            id="subject" 
            v-model="subject" 
            class="block w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:focus:ring-indigo-400 text-gray-900 dark:text-gray-100 px-4 py-3 transition-all duration-200" 
            placeholder="Email subject"
            required 
          />
        </div>
        <div class="mb-6">
          <label for="body" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Message</label>
          <RichTextEditor v-model="body" />
        </div>
        <div class="flex justify-end gap-3">
          <button 
            type="button" 
            @click="closeModal" 
            class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-all duration-200"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isLoading"
            class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <svg v-if="!isLoading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <svg v-else class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Sending...' : 'Send Message' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "@/composables/useToast";
import api from "@/services/api";
import { useEmailStore } from "@/stores/emails";
import { useMailboxStore } from "@/stores/mailboxes";
import { useUIStore } from "@/stores/ui";
import RichTextEditor from "./RichTextEditor.vue";

const uiStore = useUIStore();
const { isComposeModalOpen, composeOptions } = storeToRefs(uiStore);
const emailStore = useEmailStore();
const mailboxStore = useMailboxStore();
const { currentMailbox } = storeToRefs(mailboxStore);
const route = useRoute();
const { success: showSuccessToast, error: showErrorToast } = useToast();

const to = ref("");
const subject = ref("");
const body = ref("");
const error = ref<string | null>(null);
const isLoading = ref(false);

const modalTitle = computed(() => {
	switch (composeOptions.value.mode) {
		case "reply":
			return "Reply";
		case "reply-all":
			return "Reply All";
		case "forward":
			return "Forward";
		default:
			return "New Message";
	}
});

// Format quoted text for replies
const formatQuotedText = (text: string) => {
	return text
		.split("\n")
		.map((line) => `> ${line}`)
		.join("\n");
};

const closeModal = () => {
	error.value = null;
	to.value = "";
	subject.value = "";
	body.value = "";
	uiStore.closeComposeModal();
};

// Watch for compose modal opening and pre-populate fields
watch(isComposeModalOpen, (isOpen) => {
	if (isOpen) {
		const options = composeOptions.value;
		const original = options.originalEmail;

		if (options.mode === "reply" && original) {
			to.value = original.sender;
			subject.value = original.subject.startsWith("Re: ")
				? original.subject
				: `Re: ${original.subject}`;
			body.value = `<br><br><blockquote style="border-left: 2px solid #ccc; margin: 0; padding-left: 1em; color: #666;">On ${original.date}, ${original.sender} wrote:<br><br>${original.body}</blockquote>`;
		} else if (options.mode === "reply-all" && original) {
			// For reply all, include both sender and original recipient
			const recipients = new Set([original.sender]);
			if (
				original.recipient &&
				original.recipient !== currentMailbox.value?.email
			) {
				recipients.add(original.recipient);
			}
			to.value = Array.from(recipients).join(", ");
			subject.value = original.subject.startsWith("Re: ")
				? original.subject
				: `Re: ${original.subject}`;
			body.value = `<br><br><blockquote style="border-left: 2px solid #ccc; margin: 0; padding-left: 1em; color: #666;">On ${original.date}, ${original.sender} wrote:<br><br>${original.body}</blockquote>`;
		} else if (options.mode === "forward" && original) {
			to.value = "";
			subject.value = original.subject.startsWith("Fwd: ")
				? original.subject
				: `Fwd: ${original.subject}`;
			body.value = `<br><br><div style="border: 1px solid #ddd; padding: 1em; background-color: #f9f9f9; margin: 1em 0;">
<strong>Forwarded message:</strong><br>
<strong>From:</strong> ${original.sender}<br>
<strong>Date:</strong> ${original.date}<br>
<strong>Subject:</strong> ${original.subject}<br><br>
${original.body}
</div>`;
		} else {
			to.value = "";
			subject.value = "";
			body.value = "";
		}
	}
});

// Helper to strip HTML tags
const stripHtml = (html: string) => {
	const div = document.createElement("div");
	div.innerHTML = html;
	return div.textContent || div.innerText || "";
};

// Helper to convert HTML to plain text with better formatting
const htmlToPlainText = (html: string): string => {
	const div = document.createElement("div");
	div.innerHTML = html;

	// Replace <br> and <p> tags with newlines
	let text = html
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>/gi, "\n\n")
		.replace(/<p[^>]*>/gi, "")
		.replace(/<div[^>]*>/gi, "")
		.replace(/<\/div>/gi, "\n");

	div.innerHTML = text;
	return (div.textContent || div.innerText || "").trim();
};

const send = async () => {
	error.value = null;
	if (!currentMailbox.value) {
		error.value = "No mailbox selected.";
		return;
	}
	isLoading.value = true;
	try {
		const mailboxId = route.params.mailboxId as string;
		const emailData = {
			to: to.value,
			from: currentMailbox.value.email,
			subject: subject.value,
			html: body.value,
			text: htmlToPlainText(body.value),
		};

		// Use appropriate API endpoint based on mode
		if (
			composeOptions.value.mode === "reply" ||
			composeOptions.value.mode === "reply-all"
		) {
			const originalEmailId = composeOptions.value.originalEmail?.id;
			if (originalEmailId) {
				await api.replyToEmail(mailboxId, originalEmailId, emailData);
			} else {
				throw new Error("Original email not found");
			}
		} else if (composeOptions.value.mode === "forward") {
			const originalEmailId = composeOptions.value.originalEmail?.id;
			if (originalEmailId) {
				await api.forwardEmail(mailboxId, originalEmailId, emailData);
			} else {
				throw new Error("Original email not found");
			}
		} else {
			await emailStore.sendEmail(mailboxId, emailData);
		}

		to.value = "";
		subject.value = "";
		body.value = "";
		closeModal();
		showSuccessToast("Email sent successfully!");
	} catch (e: any) {
		const errorMessage =
			e.response?.data?.error || "An unexpected error occurred.";
		error.value = errorMessage;
		showErrorToast(errorMessage);
	} finally {
		isLoading.value = false;
	}
};
</script>
