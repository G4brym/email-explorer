<template>
  <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Contacts</h1>
    </div>
    <ul class="divide-y divide-gray-200 dark:divide-gray-700">
      <li v-for="contact in contacts" :key="contact.id" class="p-4">
        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ contact.name }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ contact.email }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useContactStore } from "@/stores/contacts";

const contactStore = useContactStore();
const { contacts } = storeToRefs(contactStore);
const route = useRoute();

onMounted(() => {
	contactStore.fetchContacts(route.params.mailboxId as string);
});
</script>
