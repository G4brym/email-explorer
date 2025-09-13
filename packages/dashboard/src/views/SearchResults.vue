<template>
  <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Search Results</h1>
    </div>
    <div v-if="isLoading" class="p-4 text-center text-gray-500 dark:text-gray-400">
      <p>Loading...</p>
    </div>
    <div v-else-if="results.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
      <p>No results found.</p>
    </div>
    <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
      <li v-for="email in results" :key="email.id">
        <router-link :to="{ name: 'EmailDetail', params: { id: email.id } }" class="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ email.sender }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ email.date }}</p>
          </div>
          <p class="text-sm text-gray-800 dark:text-gray-300 mt-1">{{ email.subject }}</p>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSearchStore } from "@/stores/search";

const searchStore = useSearchStore();
const { results, isLoading } = storeToRefs(searchStore);
</script>
