import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { transform } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const privateDir = path.resolve(__dirname, "..", "Private");

export default defineConfig({
  server: {
    port: 5173,
    fs: {
      allow: [privateDir, path.resolve(__dirname)],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
      resolveExtensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    },
  },
  plugins: [
    {
      name: "feature-flags-jsx",
      enforce: "pre",
      async transform(code, id) {
        const isLibraryJs =
          id.endsWith(".js") &&
          (id.includes("feature-flags") || id.includes("api-keys"));
        if (isLibraryJs) {
          const result = await transform(code, {
            loader: "jsx",
            sourcefile: id,
          });
          return {
            code: result.code,
            map: result.map ? JSON.parse(result.map) : null,
          };
        }
        return null;
      },
    },
    react(),
  ],
});
