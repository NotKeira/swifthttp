import {defineConfig} from "vitest/config";
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'dist/',
                '__tests__/',
                '**/*.test.ts',
                '**/*.spec.ts',
                'vitest.config.ts'
            ],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 90,
                statements: 90
            },
        },
        include: ['__tests__/**/*.test.ts'],
        exclude: ['node_modules', 'dist']
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});