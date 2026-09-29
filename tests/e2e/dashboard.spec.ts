import { expect, test } from "@playwright/test"

test.describe("Dashboard", () => {
    test.beforeEach(async ({ page }) => {
        // Sign in as demo user
        await page.goto("/connexion")
        await page.getByLabel("Email").fill("demo@comptasse.com")
        await page.getByLabel("Mot de passe").fill("demo")
        await page
            .getByRole("button", {
                name: "Se connecter",
            })
            .click()
        await page.waitForURL("**/organisations", {
            timeout: 10000,
        })
    })

    test("displays the organizations page after sign-in", async ({ page }) => {
        await expect(page).toHaveURL(/organisations/)
    })

    test("shows the demo organizations", async ({ page }) => {
        // The demo user has organizations seeded
        await expect(page.getByText("Demo company")).toBeVisible({
            timeout: 5000,
        })
    })

    test("can navigate to settings", async ({ page }) => {
        // Click user icon to open popover, then settings/support
        await page
            .getByRole("button", {
                name: "Utilisateur",
            })
            .click()
        const supportLink = page.getByRole("link", {
            name: "Support",
        })
        await expect(supportLink).toBeVisible()
    })
})
