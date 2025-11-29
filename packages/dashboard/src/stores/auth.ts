import { defineStore } from "pinia";
import { computed, ref } from "vue";
import api from "@/services/api";

export interface User {
	id: string;
	email: string;
	isAdmin: boolean;
}

export interface Session {
	id: string;
	userId: string;
	email: string;
	isAdmin: boolean;
	expiresAt: number;
}

export const useAuthStore = defineStore("auth", () => {
	const session = ref<Session | null>(null);
	const loading = ref(false);
	const error = ref<string | null>(null);

	const isAuthenticated = computed(() => session.value !== null);
	const isAdmin = computed(() => session.value?.isAdmin ?? false);
	const currentUser = computed(() =>
		session.value
			? {
					id: session.value.userId,
					email: session.value.email,
					isAdmin: session.value.isAdmin,
				}
			: null,
	);

	// Load session from localStorage on init
	const storedSession = localStorage.getItem("session");
	if (storedSession) {
		try {
			session.value = JSON.parse(storedSession);
		} catch (e) {
			localStorage.removeItem("session");
		}
	}

	async function register(email: string, password: string) {
		loading.value = true;
		error.value = null;
		try {
			const response = await api.register(email, password);
			// After registration, login
			await login(email, password);
			return response.data;
		} catch (err: any) {
			error.value = err.response?.data?.error || "Registration failed";
			throw err;
		} finally {
			loading.value = false;
		}
	}

	async function login(email: string, password: string) {
		loading.value = true;
		error.value = null;
		try {
			const response = await api.login(email, password);
			session.value = response.data;
			// Store session in localStorage
			localStorage.setItem("session", JSON.stringify(response.data));
			// Set default auth header for future requests
			api.setAuthToken(response.data.id);
			return response.data;
		} catch (err: any) {
			error.value = err.response?.data?.error || "Login failed";
			throw err;
		} finally {
			loading.value = false;
		}
	}

	async function logout() {
		loading.value = true;
		try {
			if (session.value) {
				await api.logout();
			}
		} catch (err) {
			console.error("Logout error:", err);
		} finally {
			session.value = null;
			localStorage.removeItem("session");
			api.clearAuthToken();
			loading.value = false;
		}
	}

	async function checkAuth() {
		if (!session.value) return false;

		// Check if session is expired
		if (session.value.expiresAt < Date.now()) {
			await logout();
			return false;
		}

		loading.value = true;
		try {
			const response = await api.getCurrentUser();
			// Update session with fresh data
			session.value = {
				...session.value,
				email: response.data.email,
				isAdmin: response.data.isAdmin,
			};
			localStorage.setItem("session", JSON.stringify(session.value));
			return true;
		} catch (_err) {
			await logout();
			return false;
		} finally {
			loading.value = false;
		}
	}

	return {
		session,
		loading,
		error,
		isAuthenticated,
		isAdmin,
		currentUser,
		register,
		login,
		logout,
		checkAuth,
	};
});
