import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    server: {
        host: '0.0.0.0',
        port: 5174,
        open: true
    },
    build: {
        lib: {
            entry: './src/main.js',
            name: 'sky-tiptap',
            fileName: (format) => `sky-tiptap.${format}.js`,
        },
        rollupOptions: {
            // 确保外部化 Vue，这样它就不会被打包到库中
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue',
                },
            },
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
    },
});
