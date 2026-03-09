<template>
	<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-md w-full space-y-8">
			<div>
				<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
					Create new password
				</h2>
				<p class="mt-2 text-center text-sm text-gray-600">
					Enter your new password below
				</p>
			</div>

			<form class="mt-8 space-y-6" @submit.prevent="handleResetPassword">
				<div v-if="error" class="rounded-md bg-red-50 p-4">
					<p class="text-sm text-red-800">{{ error }}</p>
				</div>

				<div v-if="successMessage" class="rounded-md bg-green-50 p-4">
					<p class="text-sm text-green-800">{{ successMessage }}</p>
				</div>

				<div v-if="!successMessage" class="rounded-md shadow-sm -space-y-px">
					<div>
						<label for="password" class="sr-only">New password</label>
						<input
							id="password"
							v-model="password"
							type="password"
							required
							minlength="8"
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
							placeholder="New password (min 8 characters)"
						/>
					</div>
					<div>
						<label for="confirm-password" class="sr-only">Confirm password</label>
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

				<div v-if="password && confirmPassword && password !== confirmPassword" class="text-sm text-red-600">
					Passwords do not match
				</div>

				<div v-if="!successMessage">
					<button
						type="submit"
						:disabled="isLoading || password !== confirmPassword || !password"
						class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
					>
						{{ isLoading ? "Resetting..." : "Reset password" }}
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
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "@/composables/useToast";
import api from "@/services/api";

const router = useRouter();
const route = useRoute();
const { success, error: showError } = useToast();

const password = ref("");
const confirmPassword = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const token = ref<string | null>(null);

onMounted(() => {
	token.value = route.query.token as string;
	if (!token.value) {
		error.value = "Invalid reset link. Please request a new password reset.";
	}
});

async function handleResetPassword() {
	if (!token.value) {
		error.value = "Invalid reset link. Please request a new password reset.";
		return;
	}

	if (password.value !== confirmPassword.value) {
		error.value = "Passwords do not match";
		return;
	}

	error.value = null;
	isLoading.value = true;

	try {
		await api.resetPassword(token.value, password.value);
		successMessage.value =
			"Password reset successfully! You can now log in with your new password.";
		success("Password reset successfully!", 5000);
		setTimeout(() => {
			router.push("/login");
		}, 5000);
	} catch (e: any) {
		const errorMessage =
			e.response?.data?.error || "Failed to reset password. Please try again.";
		error.value = errorMessage;
		showError(errorMessage);
	} finally {
		isLoading.value = false;
	}
}
</script>
