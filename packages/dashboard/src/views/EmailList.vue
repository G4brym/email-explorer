<template>
  <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white">{{ folderName }}</h1>
    </div>
    <ul v-if="emails.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
      <li v-for="email in emails" :key="email.id" class="group relative p-4" :class="{ 'bg-gray-100 dark:bg-gray-700': !email.read, 'hover:bg-gray-50 dark:hover:bg-gray-600': true }">
        <router-link :to="{ name: 'EmailDetail', params: { id: email.id }, query: { fromFolder: folderId } }" class="block">
          <div class="flex items-start justify-between">
            <div class="flex-grow overflow-hidden mr-4">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate" :class="{'font-bold': !email.read}">{{ email.sender }}</p>
              <p class="text-sm text-gray-800 dark:text-gray-300 mt-1" :class="{'font-bold': !email.read}">{{ email.subject }}</p>
            </div>
            <div class="flex-shrink-0 flex items-center">
              <p class="text-xs text-gray-500 dark:text-gray-400 group-hover:hidden">{{ email.date }}</p>
              <div class="hidden group-hover:flex items-center">
                <button @click.prevent="toggleStarStatus(email)" class="p-2 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" :class="{'text-yellow-500 dark:text-yellow-400': email.starred}" :title="email.starred ? 'Unstar' : 'Star'">
                  <svg v-if="email.starred" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button @click.prevent="toggleReadStatus(email)" class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" :title="email.read ? 'Mark as unread' : 'Mark as read'">
                  <svg v-if="email.read" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </button>
                <button @click.prevent="handleDelete(email.id)" class="p-2 text-gray-500 hover:text-red-700 dark:text-gray-400 dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </router-link>
      </li>
    </ul>
    <div v-else class="p-8 text-center">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">This folder is empty</h2>
      <p class="text-gray-600 dark:text-gray-400 mt-1">No emails found in this folder.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useEmailStore } from "@/stores/emails";
import { useFolderStore } from "@/stores/folders";
import type { Email } from "@/types";

const emailStore = useEmailStore();
const { emails } = storeToRefs(emailStore);
const folderStore = useFolderStore();
const { folders } = storeToRefs(folderStore);
const route = useRoute();

const folderId = computed(() => route.params.folder as string);

const folderName = computed(() => {
	const foundFolder = folders.value.find((f) => f.id === folderId.value);
	return foundFolder ? foundFolder.name : folderId.value;
});

onMounted(() => {
	emailStore.fetchEmails(route.params.mailboxId as string, {
		folder: folderId.value,
	});
});

watch(folderId, (newFolderId) => {
	emailStore.fetchEmails(route.params.mailboxId as string, {
		folder: newFolderId,
	});
});

const toggleReadStatus = (email: Email) => {
	emailStore.updateEmail(route.params.mailboxId as string, email.id, {
		read: !email.read,
	});
};

const toggleStarStatus = (email: Email) => {
	emailStore.updateEmail(route.params.mailboxId as string, email.id, {
		starred: !email.starred,
	});
};

const handleDelete = (emailId: string) => {
	if (confirm("Are you sure you want to delete this email?")) {
		emailStore.deleteEmail(route.params.mailboxId as string, emailId);
	}
};
</script>
