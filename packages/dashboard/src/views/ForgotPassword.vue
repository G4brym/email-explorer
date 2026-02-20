<template>
	<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-md w-full space-y-8">
			<div>
				<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
					Reset your password
				</h2>
				<p class="mt-2 text-center text-sm text-gray-600">
					Or
					<router-link
						to="/login"
						class="font-medium text-indigo-600 hover:text-indigo-500"
					>
						return to login
					</router-link>
				</p>
			</div>

			<form class="mt-8 space-y-6" @submit.prevent="handleForgotPassword">
				<div v-if="error" class="rounded-md bg-red-50 p-4">
					<p class="text-sm text-red-800">{{ error }}</p>
				</div>

				<div v-if="successMessage" class="rounded-md bg-green-50 p-4">
					<p class="text-sm text-green-800">{{ successMessage }}</p>
				</div>

				<div v-if="!successMessage" class="rounded-md shadow-sm">
					<div>
						<label for="email" class="sr-only">Email address</label>
						<input
							id="email"
							v-model="email"
							type="email"
							required
							class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
							placeholder="Email address"
						/>
					</div>
				</div>

				<div v-if="!successMessage">
					<button
						type="submit"
						:disabled="isLoading"
						class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
					>
						{{ isLoading ? "Sending..." : "Send reset link" }}
					</button>
				</div>

				<div v-if="successMessage" class="text-center">
					<router-link
						to="/login"
						class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
					>
						Back to login
					</router-link>
				</div>
			</form>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "@/composables/useToast";
import api from "@/services/api";

const router = useRouter();
const { success, error: showError } = useToast();

const email = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

async function handleForgotPassword() {
	error.value = null;
	isLoading.value = true;

	try {
		await api.forgotPassword(email.value);
		successMessage.value = `Password reset link sent to ${email.value}. Please check your email.`;
		success("Reset link sent! Check your email.");
	} catch (e: any) {
		const errorMessage =
			e.response?.data?.error || "Failed to send reset link. Please try again.";
		error.value = errorMessage;
		showError(errorMessage);
	} finally {
		isLoading.value = false;
	}
}
</script>
