<template>
  <header class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="relative w-full max-w-md">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3">
        <!-- Search Icon -->
        <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
      </span>
      <input type="text" v-model="searchQuery" @keyup.enter="performSearch" placeholder="Search" class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-3" />
    </div>
    <div>
      <router-link to="/" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white mr-4">Mailboxes</router-link>
      <a href="#" @click.prevent="handleSettingsClick" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">Settings</a>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";

const searchQuery = ref("");
const searchStore = useSearchStore();
const route = useRoute();
const router = useRouter();

const performSearch = () => {
	const mailboxId = route.params.mailboxId as string;
	searchStore.searchEmails(mailboxId, searchQuery.value);
	router.push({ name: "SearchResults" });
};

const handleSettingsClick = () => {
	const mailboxId = route.params.mailboxId as string;
	if (route.name === "Settings") {
		if (mailboxId) {
			router.push({
				name: "EmailList",
				params: { mailboxId, folder: "inbox" },
			});
		} else {
			router.push("/");
		}
	} else {
		if (mailboxId) {
			router.push({ name: "Settings", params: { mailboxId } });
		}
	}
};
</script>
