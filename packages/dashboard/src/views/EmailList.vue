<template>
  <div class="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white capitalize">{{ folderName }}</h1>
      <button 
        @click="handleRefresh"
        :disabled="isRefreshing"
        class="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        :title="isRefreshing ? 'Refreshing...' : 'Refresh emails'"
      >
        <svg v-if="!isRefreshing" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <svg v-else class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </button>
    </div>
    <ul v-if="emails.length > 0" class="divide-y divide-gray-100 dark:divide-gray-700/50">
      <li v-for="email in emails" :key="email.id" class="group relative transition-all duration-200" :class="{ 'bg-indigo-50/30 dark:bg-indigo-900/10': !email.read, 'hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/30 dark:hover:from-indigo-900/10 dark:hover:to-purple-900/10': true }">
        <router-link :to="{ name: 'EmailDetail', params: { id: email.id }, query: { fromFolder: folderId } }" class="block px-6 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-grow overflow-hidden min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <div v-if="!email.read" class="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full flex-shrink-0"></div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white truncate" :class="{'font-bold': !email.read}">{{ email.sender }}</p>
              </div>
              <p class="text-base text-gray-800 dark:text-gray-300 truncate" :class="{'font-semibold': !email.read, 'font-normal': email.read}">{{ email.subject }}</p>
            </div>
            <div class="flex-shrink-0 flex items-center gap-2">
              <p class="text-xs text-gray-500 dark:text-gray-400 group-hover:hidden whitespace-nowrap">{{ email.date }}</p>
              <div class="hidden group-hover:flex items-center gap-1">
                <button @click.prevent="toggleStarStatus(email)" class="p-2 text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-gray-700/50 transition-all duration-200" :class="{'text-yellow-500 dark:text-yellow-400': email.starred}" :title="email.starred ? 'Unstar' : 'Star'">
                  <svg v-if="email.starred" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button @click.prevent="toggleReadStatus(email)" class="p-2 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-all duration-200" :title="email.read ? 'Mark as unread' : 'Mark as read'">
                  <svg v-if="email.read" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </button>
                <button @click.prevent="handleDelete(email.id)" class="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700/50 transition-all duration-200" title="Delete">
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
    <div v-else class="p-16 text-center">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
        <svg class="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">This folder is empty</h2>
      <p class="text-gray-600 dark:text-gray-400">No emails found in this folder.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useEmailStore } from "@/stores/emails";
import { useFolderStore } from "@/stores/folders";
import type { Email } from "@/types";

const emailStore = useEmailStore();
const { emails, isRefreshing } = storeToRefs(emailStore);
const folderStore = useFolderStore();
const { folders } = storeToRefs(folderStore);
const route = useRoute();

let refreshInterval: ReturnType<typeof setInterval> | null = null;

const folderId = computed(() => route.params.folder as string);

const folderName = computed(() => {
	const foundFolder = folders.value.find((f) => f.id === folderId.value);
	return foundFolder ? foundFolder.name : folderId.value;
});

const startAutoRefresh = () => {
	if (refreshInterval) clearInterval(refreshInterval);
	refreshInterval = setInterval(() => {
		emailStore.fetchEmails(route.params.mailboxId as string, {
			folder: folderId.value,
		});
	}, 30000);
};

const stopAutoRefresh = () => {
	if (refreshInterval) {
		clearInterval(refreshInterval);
		refreshInterval = null;
	}
};

const handleRefresh = () => {
	emailStore.fetchEmails(route.params.mailboxId as string, {
		folder: folderId.value,
	});
};

onMounted(() => {
	emailStore.fetchEmails(route.params.mailboxId as string, {
		folder: folderId.value,
	});
	startAutoRefresh();
});

onUnmounted(() => {
	stopAutoRefresh();
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
