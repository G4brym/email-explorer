<template>
  <div v-if="isComposeModalOpen" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl text-gray-900 dark:text-gray-100">
      <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
        <h2 class="text-lg font-semibold">New Message</h2>
        <button @click="closeModal" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">&times;</button>
      </div>
      <form @submit.prevent="send">
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span class="block sm:inline">{{ error }}</span>
        </div>
        <div class="mb-4">
          <label for="to" class="block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
          <input type="email" id="to" v-model="to" class="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" required />
        </div>
        <div class="mb-4">
          <label for="subject" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
          <input type="text" id="subject" v-model="subject" class="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" required />
        </div>
        <div class="mb-4">
          <label for="body" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Body</label>
          <textarea id="body" v-model="body" rows="10" class="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>
        <div class="flex justify-end space-x-2">
          <button type="button" @click="closeModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Send</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useEmailStore } from "@/stores/emails";
import { useMailboxStore } from "@/stores/mailboxes";
import { useUIStore } from "@/stores/ui";

const uiStore = useUIStore();
const { isComposeModalOpen } = storeToRefs(uiStore);
const emailStore = useEmailStore();
const mailboxStore = useMailboxStore();
const { currentMailbox } = storeToRefs(mailboxStore);
const route = useRoute();

const to = ref("");
const subject = ref("");
const body = ref("");
const error = ref<string | null>(null);

const closeModal = () => {
	error.value = null;
	uiStore.closeComposeModal();
};

const send = async () => {
	error.value = null;
	if (!currentMailbox.value) {
		error.value = "No mailbox selected.";
		return;
	}
	try {
		const mailboxId = route.params.mailboxId as string;
		await emailStore.sendEmail(mailboxId, {
			to: to.value,
			from: currentMailbox.value.email,
			subject: subject.value,
			html: body.value,
			text: body.value,
		});
		to.value = "";
		subject.value = "";
		body.value = "";
		closeModal();
	} catch (e: any) {
		error.value = e.response?.data?.error || "An unexpected error occurred.";
	}
};
</script>
