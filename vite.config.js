import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ["react", "react-dom"],
                    firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
                    charts: ["recharts"],
                    icons: ["lucide-react"],
                },
            },
        },
    },
});
