<template>
	<div v-if="!isRegistrationEnabled()" class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-md w-full text-center">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">Registration Disabled</h2>
			<p class="text-gray-600 mb-6">Registration is currently disabled. Please contact an administrator.</p>
			<router-link to="/login" class="text-indigo-600 hover:text-indigo-500 font-medium">
				Return to login
			</router-link>
		</div>
	</div>
	<div v-else class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-md w-full space-y-8">
			<div>
				<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
					Create your account
				</h2>
				<p class="mt-2 text-center text-sm text-gray-600">
					Or
					<router-link
						to="/login"
						class="font-medium text-indigo-600 hover:text-indigo-500"
					>
						sign in to your account
					</router-link>
				</p>
			</div>
			<form class="mt-8 space-y-6" @submit.prevent="handleRegister">
				<div v-if="authStore.error" class="rounded-md bg-red-50 p-4">
					<p class="text-sm text-red-800">{{ authStore.error }}</p>
				</div>
				<div v-if="successMessage" class="rounded-md bg-green-50 p-4">
					<p class="text-sm text-green-800">{{ successMessage }}</p>
				</div>
				<div class="rounded-md shadow-sm -space-y-px">
					<div>
						<label for="email" class="sr-only">Email address</label>
						<input
							id="email"
							v-model="email"
							type="email"
							required
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
							placeholder="Email address"
						/>
					</div>
					<div>
						<label for="password" class="sr-only">Password</label>
						<input
							id="password"
							v-model="password"
							type="password"
							required
							minlength="8"
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
							placeholder="Password (min 8 characters)"
						/>
					</div>
					<div>
						<label for="confirm-password" class="sr-only">Confirm Password</label>
						<input
							id="confirm-password"
							v-model="confirmPassword"
							type="password"
							required
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
							placeholder="Confirm password"
						/>
					</div>
				</div>

				<div>
					<button
						type="submit"
						:disabled="authStore.loading || password !== confirmPassword"
						class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
					>
						{{ authStore.loading ? "Creating account..." : "Create account" }}
					</button>
					<p v-if="password && confirmPassword && password !== confirmPassword" class="mt-2 text-sm text-red-600">
						Passwords do not match
					</p>
				</div>
			</form>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAppSettings } from "@/composables/useAppSettings";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const { isRegistrationEnabled } = useAppSettings();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const successMessage = ref("");

async function handleRegister() {
	if (password.value !== confirmPassword.value) {
		return;
	}

	try {
		await authStore.register(email.value, password.value);
		successMessage.value = "Account created! Redirecting...";
		setTimeout(() => {
			router.push("/");
		}, 1000);
	} catch (error) {
		// Error is handled by store
	}
}
</script>
