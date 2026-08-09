// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const baseConfig = defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      watch: {
        ignored: ["**/.output/**", "**/.vinxi/**", "**/.tanstack/**", "**/dist/**", "**/.git/**"],
      },
    },
  },
});

export default async (env: any) => {
  const resolved = await (typeof baseConfig === "function" ? baseConfig(env) : baseConfig);
  if (resolved && resolved.plugins) {
    resolved.plugins = resolved.plugins.filter((plugin: any) => {
      if (plugin && typeof plugin === "object" && "name" in plugin) {
        return !plugin.name.includes("tsconfig-paths");
      }
      return true;
    });
  }
  return resolved;
};
