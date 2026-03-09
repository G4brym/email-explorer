import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Admin from "@/views/Admin.vue";
import Contacts from "@/views/Contacts.vue";
import EmailDetail from "@/views/EmailDetail.vue";
import EmailList from "@/views/EmailList.vue";
import ForgotPassword from "@/views/ForgotPassword.vue";
import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import Mailbox from "@/views/Mailbox.vue";
import NotFound from "@/views/NotFound.vue";
import Register from "@/views/Register.vue";
import ResetPassword from "@/views/ResetPassword.vue";
import SearchResults from "@/views/SearchResults.vue";
import Settings from "@/views/Settings.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/login",
			name: "Login",
			component: Login,
			meta: { title: "Login", public: true },
		},
		{
			path: "/register",
			name: "Register",
			component: Register,
			meta: { title: "Register", public: true },
		},
		{
			path: "/forgot-password",
			name: "ForgotPassword",
			component: ForgotPassword,
			meta: { title: "Forgot Password", public: true },
		},
		{
			path: "/reset-password",
			name: "ResetPassword",
			component: ResetPassword,
			meta: { title: "Reset Password", public: true },
		},
		{
			path: "/",
			name: "Home",
			component: Home,
			meta: { title: "Home", requiresAuth: true },
		},
		{
			path: "/admin",
			name: "Admin",
			component: Admin,
			meta: { title: "Admin Panel", requiresAuth: true, requiresAdmin: true },
		},
		{
			path: "/mailbox/:mailboxId",
			name: "Mailbox",
			component: Mailbox,
			meta: { requiresAuth: true },
			redirect: (to) => {
				return {
					name: "EmailList",
					params: { mailboxId: to.params.mailboxId, folder: "inbox" },
				};
			},
			children: [
				{
					path: "emails/:folder",
					name: "EmailList",
					component: EmailList,
					meta: { title: "Emails" },
				},
				{
					path: "email/:id",
					name: "EmailDetail",
					component: EmailDetail,
					meta: { title: "Email" },
				},
				{
					path: "contacts",
					name: "Contacts",
					component: Contacts,
					meta: { title: "Contacts" },
				},
				{
					path: "settings",
					name: "Settings",
					component: Settings,
					meta: { title: "Settings" },
				},
				{
					path: "search",
					name: "SearchResults",
					component: SearchResults,
					meta: { title: "Search" },
				},
			],
		},
		{
			path: "/:pathMatch(.*)*",
			name: "NotFound",
			component: NotFound,
			meta: { title: "Not Found" },
		},
	],
});

// Navigation guard for authentication
router.beforeEach(async (to, _from, next) => {
	const authStore = useAuthStore();
	const isPublicRoute = to.meta.public === true;
	const requiresAuth = to.meta.requiresAuth !== false; // Auth required by default
	const requiresAdmin = to.meta.requiresAdmin === true;

	// Initialize auth token if exists
	if (authStore.session && !authStore.loading) {
		const sessionData = authStore.session;
		// Check if session is expired
		if (sessionData.expiresAt < Date.now()) {
			await authStore.logout();
		}
	}

	if (!isPublicRoute && requiresAuth && !authStore.isAuthenticated) {
		// Redirect to login if not authenticated
		next({ name: "Login", query: { redirect: to.fullPath } });
	} else if (requiresAdmin && !authStore.isAdmin) {
		// Redirect to home if not admin
		next({ name: "Home" });
	} else if (
		isPublicRoute &&
		authStore.isAuthenticated &&
		(to.name === "Login" ||
			to.name === "Register" ||
			to.name === "ForgotPassword")
	) {
		// Redirect to home if already authenticated and trying to access login/register/forgot-password
		next({ name: "Home" });
	} else {
		next();
	}
});

router.afterEach((to) => {
	if (to.meta.title) {
		document.title = `${to.meta.title} - Email Explorer`;
	} else {
		document.title = "Email Explorer";
	}
});

export default router;
