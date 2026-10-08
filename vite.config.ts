import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
    plugins: [cloudflare()],
    appType: "mpa",
    environments: {
        client: {
            build: {
                rolldownOptions: { input: ["index.html", "404.html"] },
            },
        },
    },
});
