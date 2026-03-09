<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">Mailboxes</h1>
        <p class="text-gray-600 dark:text-gray-400">Manage your email accounts</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ authStore.currentUser?.email }}</p>
          <p v-if="authStore.isAdmin" class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Admin</p>
        </div>
        <button
          @click="openCreateMailboxModal"
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Mailbox
        </button>
        <router-link
          v-if="authStore.isAdmin"
          to="/admin"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Admin Panel
        </router-link>
        <button
          @click="handleLogout"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
    <div v-if="mailboxes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link 
        v-for="mailbox in mailboxes" 
        :key="mailbox.id" 
        :to="{ name: 'Mailbox', params: { mailboxId: mailbox.id } }"
        class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {{ mailbox.name.charAt(0).toUpperCase() }}
            </div>
            <svg class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">{{ mailbox.name }}</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {{ mailbox.email }}
          </p>
        </div>
      </router-link>
    </div>
    <div v-else class="text-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-12 border border-gray-200 dark:border-gray-700">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">No mailboxes found</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Get started by setting up email routing to send emails into this worker.
      </p>
      <div class="bg-indigo-50 dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto border border-indigo-200 dark:border-gray-700">
        <p class="text-gray-700 dark:text-gray-300 mb-2">
          To configure, you need to add a DNS record to your domain to allow Cloudflare to route your emails.
        </p>
        <a 
          href="https://developers.cloudflare.com/email-routing/setup/email-routing-addresses/" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
        >
          View Cloudflare Email Routing documentation
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
    <div v-if="isCreateModalOpen" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="flex justify-between items-center bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5">
          <h2 class="text-xl font-bold text-white">Create New Mailbox</h2>
          <button @click="closeCreateMailboxModal" class="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form @submit.prevent="handleCreateMailbox" class="p-6">
          <div v-if="createError" class="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-start gap-3" role="alert">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span class="block sm:inline">{{ createError }}</span>
          </div>
          <div class="mb-5">
            <label for="mailbox-email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <input 
              type="email" 
              id="mailbox-email" 
              v-model="newMailboxEmail" 
              class="block w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent dark:focus:ring-green-400 text-gray-900 dark:text-gray-100 px-4 py-3 transition-all duration-200" 
              placeholder="mailbox@example.com"
              required 
            />
          </div>
          <div class="mb-6">
            <label for="mailbox-name" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
            <input 
              type="text" 
              id="mailbox-name" 
              v-model="newMailboxName" 
              class="block w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent dark:focus:ring-green-400 text-gray-900 dark:text-gray-100 px-4 py-3 transition-all duration-200" 
              placeholder="My Mailbox"
              required 
            />
          </div>
          <div class="flex justify-end gap-3">
            <button 
              type="button" 
              @click="closeCreateMailboxModal" 
              class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="isCreatingMailbox"
              class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <svg v-if="!isCreatingMailbox" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <svg v-else class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isCreatingMailbox ? 'Creating...' : 'Create Mailbox' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "@/composables/useToast";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useMailboxStore } from "@/stores/mailboxes";

const router = useRouter();
const mailboxStore = useMailboxStore();
const authStore = useAuthStore();
const { mailboxes } = storeToRefs(mailboxStore);
const { success: showSuccessToast, error: showErrorToast } = useToast();

const isCreateModalOpen = ref(false);
const newMailboxEmail = ref("");
const newMailboxName = ref("");
const isCreatingMailbox = ref(false);
const createError = ref<string | null>(null);

onMounted(() => {
	mailboxStore.fetchMailboxes();
});

const openCreateMailboxModal = () => {
	isCreateModalOpen.value = true;
	newMailboxEmail.value = "";
	newMailboxName.value = "";
	createError.value = null;
};

const closeCreateMailboxModal = () => {
	isCreateModalOpen.value = false;
	newMailboxEmail.value = "";
	newMailboxName.value = "";
	createError.value = null;
};

const handleCreateMailbox = async () => {
	createError.value = null;

	if (!newMailboxEmail.value || !newMailboxName.value) {
		createError.value = "Please fill in all fields";
		return;
	}

	isCreatingMailbox.value = true;
	try {
		await api.createMailbox(newMailboxEmail.value, newMailboxName.value);
		showSuccessToast("Mailbox created successfully!");
		closeCreateMailboxModal();
		await mailboxStore.fetchMailboxes();
	} catch (e: any) {
		const errorMessage = e.response?.data?.error || "Failed to create mailbox";
		createError.value = errorMessage;
		showErrorToast(errorMessage);
	} finally {
		isCreatingMailbox.value = false;
	}
};

async function handleLogout() {
	await authStore.logout();
	router.push("/login");
}
</script>
