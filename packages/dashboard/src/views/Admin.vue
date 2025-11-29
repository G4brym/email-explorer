<template>
	<div class="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
					Admin Panel
				</h1>
				<p class="text-gray-600 dark:text-gray-400">Manage users and mailbox access</p>
			</div>
			<router-link
				to="/"
				class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
			>
				← Back to Home
			</router-link>
		</div>

		<!-- Register New User Section -->
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Register New User</h2>
			<form @submit.prevent="handleRegisterUser" class="space-y-4">
				<div v-if="registerError" class="rounded-md bg-red-50 p-4">
					<p class="text-sm text-red-800">{{ registerError }}</p>
				</div>
				<div v-if="registerSuccess" class="rounded-md bg-green-50 p-4">
					<p class="text-sm text-green-800">{{ registerSuccess }}</p>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="new-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Email Address
						</label>
						<input
							id="new-email"
							v-model="newUser.email"
							type="email"
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							placeholder="user@example.com"
						/>
					</div>
					<div>
						<label for="new-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Password
						</label>
						<input
							id="new-password"
							v-model="newUser.password"
							type="password"
							required
							minlength="8"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							placeholder="Min 8 characters"
						/>
					</div>
				</div>
				<button
					type="submit"
					:disabled="registerLoading"
					class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
				>
					{{ registerLoading ? "Creating..." : "Create User" }}
				</button>
			</form>
		</div>

		<!-- Users List -->
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-bold text-gray-900 dark:text-white">Users</h2>
				<button
					@click="loadUsers"
					:disabled="usersLoading"
					class="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
				>
					{{ usersLoading ? "Loading..." : "Refresh" }}
				</button>
			</div>

			<div v-if="usersLoading && users.length === 0" class="text-center py-8 text-gray-500">
				Loading users...
			</div>

			<div v-else-if="users.length === 0" class="text-center py-8 text-gray-500">
				No users found
			</div>

			<div v-else class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead>
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
						<tr v-for="user in users" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
							<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{{ user.email }}</td>
							<td class="px-4 py-3 text-sm">
								<span v-if="user.isAdmin" class="px-2 py-1 text-xs font-semibold text-indigo-800 bg-indigo-100 rounded-full">
									Admin
								</span>
								<span v-else class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">
									User
								</span>
							</td>
							<td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
								{{ formatDate(user.createdAt) }}
							</td>
							<td class="px-4 py-3 text-sm">
								<button
									@click="openAccessModal(user)"
									class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
								>
									Manage Access
								</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<!-- Access Management Modal -->
		<div
			v-if="selectedUser"
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
			@click.self="closeAccessModal"
		>
			<div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
				<div class="p-6 border-b border-gray-200 dark:border-gray-700">
					<div class="flex items-center justify-between">
						<h3 class="text-xl font-bold text-gray-900 dark:text-white">
							Manage Access for {{ selectedUser.email }}
						</h3>
						<button
							@click="closeAccessModal"
							class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<div class="p-6">
					<!-- Grant Access Form -->
					<div class="mb-6">
						<h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grant Mailbox Access</h4>
						<form @submit.prevent="handleGrantAccess" class="space-y-4">
							<div v-if="accessError" class="rounded-md bg-red-50 p-4">
								<p class="text-sm text-red-800">{{ accessError }}</p>
							</div>
							<div v-if="accessSuccess" class="rounded-md bg-green-50 p-4">
								<p class="text-sm text-green-800">{{ accessSuccess }}</p>
							</div>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Mailbox ID
									</label>
									<input
										v-model="accessForm.mailboxId"
										type="text"
										required
										class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
										placeholder="user@example.com"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Role
									</label>
									<select
										v-model="accessForm.role"
										required
										class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									>
										<option value="owner">Owner</option>
										<option value="admin">Admin</option>
										<option value="write">Write</option>
										<option value="read">Read</option>
									</select>
								</div>
							</div>
							<div class="flex gap-2">
								<button
									type="submit"
									:disabled="accessLoading"
									class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
								>
									{{ accessLoading ? "Granting..." : "Grant Access" }}
								</button>
								<button
									type="button"
									@click="handleRevokeAccess"
									:disabled="accessLoading || !accessForm.mailboxId"
									class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
								>
									{{ accessLoading ? "Revoking..." : "Revoke Access" }}
								</button>
							</div>
						</form>
					</div>

					<!-- Role Descriptions -->
					<div class="border-t border-gray-200 dark:border-gray-700 pt-4">
						<h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Role Descriptions:</h4>
						<ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
							<li><strong>Owner:</strong> Full control of the mailbox</li>
							<li><strong>Admin:</strong> Can manage settings and users</li>
							<li><strong>Write:</strong> Can send and manage emails</li>
							<li><strong>Read:</strong> Can only view emails</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth";

interface User {
	id: string;
	email: string;
	isAdmin: boolean;
	createdAt: number;
	updatedAt: number;
}

const router = useRouter();
const authStore = useAuthStore();

// Check if user is admin
if (!authStore.isAdmin) {
	router.push("/");
}

// Register User State
const newUser = ref({ email: "", password: "" });
const registerLoading = ref(false);
const registerError = ref("");
const registerSuccess = ref("");

// Users List State
const users = ref<User[]>([]);
const usersLoading = ref(false);

// Access Management State
const selectedUser = ref<User | null>(null);
const accessForm = ref({ mailboxId: "", role: "read" });
const accessLoading = ref(false);
const accessError = ref("");
const accessSuccess = ref("");

onMounted(() => {
	loadUsers();
});

async function handleRegisterUser() {
	registerLoading.value = true;
	registerError.value = "";
	registerSuccess.value = "";

	try {
		await api.adminRegisterUser(newUser.value.email, newUser.value.password);
		registerSuccess.value = `User ${newUser.value.email} created successfully!`;
		newUser.value = { email: "", password: "" };
		// Reload users list
		await loadUsers();
	} catch (error: any) {
		registerError.value =
			error.response?.data?.error || "Failed to create user";
	} finally {
		registerLoading.value = false;
	}
}

async function loadUsers() {
	usersLoading.value = true;
	try {
		const response = await api.adminListUsers();
		users.value = response.data;
	} catch (error: any) {
		console.error("Failed to load users:", error);
	} finally {
		usersLoading.value = false;
	}
}

function openAccessModal(user: User) {
	selectedUser.value = user;
	accessForm.value = { mailboxId: "", role: "read" };
	accessError.value = "";
	accessSuccess.value = "";
}

function closeAccessModal() {
	selectedUser.value = null;
	accessForm.value = { mailboxId: "", role: "read" };
	accessError.value = "";
	accessSuccess.value = "";
}

async function handleGrantAccess() {
	if (!selectedUser.value) return;

	accessLoading.value = true;
	accessError.value = "";
	accessSuccess.value = "";

	try {
		await api.adminGrantAccess(
			selectedUser.value.id,
			accessForm.value.mailboxId,
			accessForm.value.role,
		);
		accessSuccess.value = `Access granted successfully!`;
		accessForm.value.mailboxId = "";
	} catch (error: any) {
		accessError.value = error.response?.data?.error || "Failed to grant access";
	} finally {
		accessLoading.value = false;
	}
}

async function handleRevokeAccess() {
	if (!selectedUser.value || !accessForm.value.mailboxId) return;

	if (
		!confirm(
			`Revoke access to ${accessForm.value.mailboxId} for ${selectedUser.value.email}?`,
		)
	) {
		return;
	}

	accessLoading.value = true;
	accessError.value = "";
	accessSuccess.value = "";

	try {
		await api.adminRevokeAccess(
			selectedUser.value.id,
			accessForm.value.mailboxId,
		);
		accessSuccess.value = `Access revoked successfully!`;
		accessForm.value.mailboxId = "";
	} catch (error: any) {
		accessError.value =
			error.response?.data?.error || "Failed to revoke access";
	} finally {
		accessLoading.value = false;
	}
}

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
</script>
