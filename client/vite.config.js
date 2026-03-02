import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

// https://vite.dev/config/
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心，变动极少，长期缓存
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Ant Design 体积大但稳定，单独缓存
          "vendor-antd": ["antd", "@ant-design/icons"],
          // Markdown 渲染全家桶
          "vendor-markdown": [
            "react-markdown",
            "remark-gfm",
            "remark-math",
            "rehype-katex",
            "rehype-sanitize",
            "remark-toc",
          ],
          // KaTeX 独立缓存（数学公式渲染）
          "vendor-katex": ["katex"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/files": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
