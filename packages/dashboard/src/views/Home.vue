<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">Mailboxes</h1>
    <div v-if="mailboxes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="mailbox in mailboxes" :key="mailbox.id" class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
        <router-link :to="{ name: 'Mailbox', params: { mailboxId: mailbox.id } }" class="block p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ mailbox.name }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ mailbox.email }}</p>
        </router-link>
      </div>
    </div>
    <div v-else class="text-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">No mailboxes found</h2>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Get started by setting up email routing to send emails into this worker.
      </p>
      <p class="text-gray-600 dark:text-gray-400 mt-4">
        To configure, you need to add a DNS record to your domain to allow Cloudflare to route your emails.
        Follow the instructions on the
        <a href="https://developers.cloudflare.com/email-routing/setup/email-routing-addresses/" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">
          Cloudflare Email Routing documentation
        </a>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { useMailboxStore } from "@/stores/mailboxes";

const mailboxStore = useMailboxStore();
const { mailboxes } = storeToRefs(mailboxStore);

onMounted(() => {
	mailboxStore.fetchMailboxes();
});
</script>
