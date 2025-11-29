import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	esbuild: {
		target: "esnext",
	},
	test: {
		poolOptions: {
			workers: {
				// singleWorker: true,
				wrangler: {
					configPath: "../dev/wrangler.jsonc",
				},
				miniflare: {
					compatibilityFlags: ["nodejs_compat", "nodejs_als"],
					serviceBindings: {
						async SEND_EMAIL() {
							return {};
						},
					},
				},
			},
		},
	},
});
