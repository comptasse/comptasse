import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^#/,
                replacement: path.resolve(__dirname, "./src"),
            },
            {
                find: /^@comptasse\/application-metadata$/,
                replacement: path.resolve(__dirname, "../metadata/src/index.ts"),
            },
            {
                find: /^@comptasse\/application-metadata\/routes$/,
                replacement: path.resolve(__dirname, "../metadata/src/routes/index.ts"),
            },
            {
                find: /^@comptasse\/application-metadata\/schemas$/,
                replacement: path.resolve(__dirname, "../metadata/src/schemas/index.ts"),
            },
            {
                find: /^@comptasse\/application-metadata\/models$/,
                replacement: path.resolve(__dirname, "../metadata/src/models/index.ts"),
            },
            {
                find: /^@comptasse\/application-metadata\/components$/,
                replacement: path.resolve(__dirname, "../metadata/src/components/index.ts"),
            },
            {
                find: /^@comptasse\/application-metadata\/utilities$/,
                replacement: path.resolve(__dirname, "../metadata/src/utilities/index.ts"),
            },
        ],
    },
    test: {
        include: [
            "../../tests/api/**/*.test.ts",
            "../../tests/cli/**/*.test.ts",
        ],
        globals: true,
        testTimeout: 15000,
        hookTimeout: 30000,
        fileParallelism: false,
        transform: {
            "^.+\\.ts$": "tsx",
        },
        resolve: {
            conditions: [
                "source",
            ],
        },
    },
})
