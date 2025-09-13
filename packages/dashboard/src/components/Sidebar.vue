<template>
  <aside class="w-64 bg-white dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700">
    <button @click="openComposeModal" class="w-full mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Compose</button>
    <nav>
      <ul class="space-y-2">
        <li>
          <router-link :to="{ name: 'EmailList', params: { mailboxId: route.params.mailboxId, folder: 'inbox' } }" class="flex items-center py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <span class="mr-3"></span> <!-- Icon placeholder -->
            Inbox
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'EmailList', params: { mailboxId: route.params.mailboxId, folder: 'sent' } }" class="flex items-center py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <span class="mr-3"></span> <!-- Icon placeholder -->
            Sent
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'EmailList', params: { mailboxId: route.params.mailboxId, folder: 'draft' } }" class="flex items-center py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <span class="mr-3"></span> <!-- Icon placeholder -->
            Draft
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'EmailList', params: { mailboxId: route.params.mailboxId, folder: 'archive' } }" class="flex items-center py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <span class="mr-3"></span> <!-- Icon placeholder -->
            Archive
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'EmailList', params: { mailboxId: route.params.mailboxId, folder: 'trash' } }" class="flex items-center py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <span class="mr-3"></span> <!-- Icon placeholder -->
            Trash
          </router-link>
        </li>
        <li class="pt-4">
          <div class="flex items-center justify-between">
            <h2 class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Folders</h2>
            <button @click="createNewFolder" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <ul class="mt-2 space-y-2">
            <li v-for="folder in customFolders" :key="folder.id">
              <router-link :to="{ name: 'EmailList', params: { mailboxId: route.params.mailboxId, folder: folder.id } }" class="flex items-center py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{{ folder.name }}</router-link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useFolderStore } from "@/stores/folders";
import { useUIStore } from "@/stores/ui";

const folderStore = useFolderStore();
const { folders } = storeToRefs(folderStore);
const uiStore = useUIStore();
const route = useRoute();

const defaultFolderIds = ["archive", "inbox", "sent", "spam", "trash", "draft"];
const customFolders = computed(() => {
	return folders.value.filter(
		(folder) => !defaultFolderIds.includes(folder.name.toLowerCase()),
	);
});

onMounted(() => {
	folderStore.fetchFolders(route.params.mailboxId as string);
});

const openComposeModal = () => {
	uiStore.openComposeModal();
};

const createNewFolder = () => {
	const folderName = prompt("Enter a name for the new folder:");
	if (folderName) {
		folderStore.createFolder(route.params.mailboxId as string, folderName);
	}
};
</script>
