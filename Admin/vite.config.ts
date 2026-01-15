import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { transform } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const privateDir = path.resolve(__dirname, "..", "Private");
const billingDir = path.resolve(__dirname, "..", "..", "Billing");
const adminI18nPath = path.resolve(__dirname, "src", "lib", "i18n.tsx");
const devHost = process.env.ADMIN_DEV_HOST || "0.0.0.0";
const devPort = Number(process.env.ADMIN_DEV_PORT || 8101);
const publicHost = process.env.ADMIN_PUBLIC_HOST || "";
const hmrClientPort = Number(process.env.ADMIN_DEV_CLIENT_PORT || devPort);
const hmrProtocol = process.env.ADMIN_DEV_HMR_PROTOCOL || "wss";

export default defineConfig({
  server: {
    host: devHost === "true" ? true : devHost,
    port: devPort,
    allowedHosts: [publicHost || "admin.local.einstore.pro"],
    hmr: {
      ...(publicHost ? { host: publicHost } : {}),
      clientPort: hmrClientPort,
      protocol: hmrProtocol,
    },
    fs: {
      allow: [privateDir, billingDir, path.resolve(__dirname)],
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
      name: "billing-admin-i18n-alias",
      resolveId(source, importer) {
        if (!importer || !source.startsWith(".")) {
          return null;
        }
        const resolved = path.resolve(path.dirname(importer), source);
        const expectedSuffix = path.join("Einstore", "Admin", "src", "lib", "i18n");
        if (path.normalize(resolved).endsWith(expectedSuffix)) {
          return adminI18nPath;
        }
        return null;
      },
    },
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
            jsx: "automatic",
            jsxImportSource: "react",
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
