<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
    <Sidebar />
    <div class="flex-1 flex flex-col">
      <Header />
      <main class="flex-1 overflow-y-auto p-4">
        <router-view />
      </main>
    </div>
    <ComposeEmail />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import ComposeEmail from "@/components/ComposeEmail.vue";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import { useMailboxStore } from "@/stores/mailboxes";

const mailboxStore = useMailboxStore();
const route = useRoute();

onMounted(() => {
	mailboxStore.fetchMailbox(route.params.mailboxId as string);
});
</script>
