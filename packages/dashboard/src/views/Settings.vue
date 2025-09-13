<template>
  <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>
    <div v-if="mailbox">
      <form @submit.prevent="updateSettings" class="space-y-6">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input type="text" id="name" v-model="mailbox.name" class="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" />
        </div>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input type="email" id="email" v-model="mailbox.email" class="mt-1 block w-full bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded-md shadow-sm sm:text-sm p-3" disabled />
        </div>
        <div class="flex justify-end">
          <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useMailboxStore } from "@/stores/mailboxes";

const mailboxStore = useMailboxStore();
const { currentMailbox: mailbox } = storeToRefs(mailboxStore);
const route = useRoute();

onMounted(() => {
	mailboxStore.fetchMailbox(route.params.mailboxId as string);
});

const updateSettings = () => {
	if (mailbox.value) {
		mailboxStore.updateMailbox(
			route.params.mailboxId as string,
			mailbox.value.settings,
		);
	}
};
</script>
