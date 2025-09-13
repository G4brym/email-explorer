import { createRouter, createWebHistory } from "vue-router";
import Contacts from "@/views/Contacts.vue";
import EmailDetail from "@/views/EmailDetail.vue";
import EmailList from "@/views/EmailList.vue";
import Home from "@/views/Home.vue";
import Mailbox from "@/views/Mailbox.vue";
import NotFound from "@/views/NotFound.vue";
import SearchResults from "@/views/SearchResults.vue";
import Settings from "@/views/Settings.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "Home",
			component: Home,
			meta: { title: "Home" },
		},
		{
			path: "/mailbox/:mailboxId",
			name: "Mailbox",
			component: Mailbox,
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

router.afterEach((to) => {
	if (to.meta.title) {
		document.title = `${to.meta.title} - Email Explorer`;
	} else {
		document.title = "Email Explorer";
	}
});

export default router;
