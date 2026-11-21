import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "renderer",
  // relative asset paths: Electron loads the build with loadFile (file://)
  base: "./",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
