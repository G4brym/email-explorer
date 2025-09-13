<template>
  <div v-if="email" class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden flex flex-col h-full">
    <div class="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <button @click="router.back()" class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-2" title="Back">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{{ email.subject }}</h1>
        </div>
        <div class="flex items-center space-x-2">
          <button @click="toggleReadStatus" class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" :title="email.read ? 'Mark as unread' : 'Mark as read'">
            <svg v-if="email.read" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </button>
          <button @click="toggleStarStatus" class="p-2 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" :class="{'text-yellow-500 dark:text-yellow-400': email.starred}" :title="email.starred ? 'Unstar' : 'Star'">
            <svg v-if="email.starred" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <div class="relative" ref="moveMenu">
            <button @click="isMoveMenuOpen = !isMoveMenuOpen" class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Move to folder">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </button>
            <div v-if="isMoveMenuOpen" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
              <button v-for="folder in moveToFolders" :key="folder.id" @click="handleMove(folder.id)" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                {{ folder.name }}
              </button>
            </div>
          </div>
          <button @click="handleDelete" class="p-2 text-gray-500 hover:text-red-700 dark:text-gray-400 dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ email.sender }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">To: {{ email.recipient }}</p>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ email.date }}</p>
      </div>
    </div>
    <div class="flex-grow">
      <EmailIframe :body="emailBodyWithInlineImages" />
    </div>
    <div v-if="email.attachments && email.attachments.length > 0" class="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attachments</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="attachment in email.attachments" :key="attachment.id" class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
          <div class="w-0 flex-grow mr-4">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ attachment.filename }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatBytes(attachment.size) }}</p>
          </div>
          <a :href="getAttachmentUrl(attachment.id)" target="_blank" class="ml-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="Download">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import EmailIframe from "@/components/EmailIframe.vue";
import { useEmailStore } from "@/stores/emails";
import { useFolderStore } from "@/stores/folders";

const emailStore = useEmailStore();
const { currentEmail: email } = storeToRefs(emailStore);
const folderStore = useFolderStore();
const { folders } = storeToRefs(folderStore);
const route = useRoute();
const router = useRouter();

const isMoveMenuOpen = ref(false);
const moveMenu = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
	if (moveMenu.value && !moveMenu.value.contains(event.target as Node)) {
		isMoveMenuOpen.value = false;
	}
};

watch(isMoveMenuOpen, (isOpen) => {
	if (isOpen) {
		document.addEventListener("click", handleClickOutside);
	} else {
		document.removeEventListener("click", handleClickOutside);
	}
});

onBeforeUnmount(() => {
	document.removeEventListener("click", handleClickOutside);
});

const moveToFolders = computed(() => {
	const fromFolder = route.query.fromFolder as string;
	return folders.value.filter((folder) => folder.id !== fromFolder);
});

const emailBodyWithInlineImages = computed(() => {
	if (!email.value || !email.value.body) {
		return "";
	}

	let body = email.value.body;
	const mailboxId = route.params.mailboxId as string;
	const emailId = route.params.id as string;

	if (email.value.attachments && email.value.attachments.length > 0) {
		for (const attachment of email.value.attachments) {
			if (attachment.disposition === "inline" && attachment.content_id) {
				const url = getAttachmentUrl(attachment.id);
				const cid = attachment.content_id.startsWith("<")
					? attachment.content_id.slice(1, -1)
					: attachment.content_id;
				const regex = new RegExp(`cid:${cid}`, "g");
				body = body.replace(regex, url);
			}
		}
	}

	return body;
});

const getAttachmentUrl = (attachmentId: string) => {
	const mailboxId = route.params.mailboxId as string;
	const emailId = route.params.id as string;
	return `/api/v1/mailboxes/${mailboxId}/emails/${emailId}/attachments/${attachmentId}`;
};

const formatBytes = (bytes: number, decimals = 2) => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

onMounted(async () => {
	const mailboxId = route.params.mailboxId as string;
	const emailId = route.params.id as string;

	await emailStore.fetchEmail(mailboxId, emailId);
	folderStore.fetchFolders(mailboxId);

	if (email.value && !email.value.read) {
		emailStore.updateEmail(mailboxId, emailId, { read: true });
	}
});

const toggleReadStatus = () => {
	if (email.value) {
		emailStore.updateEmail(route.params.mailboxId as string, email.value.id, {
			read: !email.value.read,
		});
	}
};

const toggleStarStatus = () => {
	if (email.value) {
		emailStore.updateEmail(route.params.mailboxId as string, email.value.id, {
			starred: !email.value.starred,
		});
	}
};

const handleMove = (folderId: string) => {
	if (email.value) {
		emailStore.moveEmail(
			route.params.mailboxId as string,
			email.value.id,
			folderId,
		);
		isMoveMenuOpen.value = false;
		router.back();
	}
};

const handleDelete = () => {
	if (email.value && confirm("Are you sure you want to delete this email?")) {
		emailStore.deleteEmail(route.params.mailboxId as string, email.value.id);
		router.push({
			name: "EmailList",
			params: { mailboxId: route.params.mailboxId, folder: "inbox" },
		});
	}
};
</script>
