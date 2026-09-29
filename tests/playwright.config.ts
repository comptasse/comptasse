import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
    testDir: "./e2e",
    outputDir: "./test-results",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        [
            "html",
            {
                outputFolder: "./playwright-report",
            },
        ],
    ],
    timeout: 30000,
    use: {
        baseURL: process.env.DASHBOARD_BASE_URL ?? "http://localhost:5173",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
            },
        },
    ],
    webServer: undefined,
})
