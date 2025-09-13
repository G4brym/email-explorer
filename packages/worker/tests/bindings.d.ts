import type { Env } from "../worker-configuration";

declare module "cloudflare:test" {
	interface ProvidedEnv extends Env {}
}
