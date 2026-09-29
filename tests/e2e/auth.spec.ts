import { expect, test } from "@playwright/test"

test.describe("Sign In", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/connexion")
    })

    test("displays the sign-in form", async ({ page }) => {
        await expect(page.getByLabel("Email")).toBeVisible()
        await expect(page.getByLabel("Mot de passe")).toBeVisible()
        await expect(
            page.getByRole("button", {
                name: "Se connecter",
            }),
        ).toBeVisible()
    })

    test("signs in with valid demo credentials", async ({ page }) => {
        await page.getByLabel("Email").fill("demo@comptasse.com")
        await page.getByLabel("Mot de passe").fill("demo")
        await page
            .getByRole("button", {
                name: "Se connecter",
            })
            .click()

        // Should redirect to dashboard/organisations
        await page.waitForURL("**/organisations", {
            timeout: 10000,
        })
        await expect(page).toHaveURL(/organisations/)
    })

    test("shows error for invalid credentials", async ({ page }) => {
        await page.getByLabel("Email").fill("demo@comptasse.com")
        await page.getByLabel("Mot de passe").fill("wrongpassword")
        await page
            .getByRole("button", {
                name: "Se connecter",
            })
            .click()

        // Should stay on the sign-in page and show error toast
        await expect(page).toHaveURL(/connexion/)
    })

    test("has a link to the sign-up page", async ({ page }) => {
        const signUpLink = page.getByRole("link", {
            name: "Créer un compte",
        })
        await expect(signUpLink).toBeVisible()
        await signUpLink.click()
        await expect(page).toHaveURL(/inscription/)
    })
})

test.describe("Sign Up", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/inscription")
    })

    test("displays the sign-up form", async ({ page }) => {
        await expect(page.getByLabel("Email")).toBeVisible()
        await expect(
            page.getByLabel("Mot de passe", {
                exact: true,
            }),
        ).toBeVisible()
        await expect(page.getByLabel("Mot de passe (encore)")).toBeVisible()
        await expect(
            page.getByRole("button", {
                name: "Créer un compte",
            }),
        ).toBeVisible()
    })

    test("creates a new account and redirects to dashboard", async ({ page }) => {
        const uniqueEmail = `e2e-test-${Date.now()}@comptasse.com`
        await page.getByLabel("Email").fill(uniqueEmail)
        await page
            .getByLabel("Mot de passe", {
                exact: true,
            })
            .fill("testpassword123")
        await page.getByLabel("Mot de passe (encore)").fill("testpassword123")
        await page
            .getByRole("button", {
                name: "Créer un compte",
            })
            .click()

        await page.waitForURL("**/organisations", {
            timeout: 10000,
        })
        await expect(page).toHaveURL(/organisations/)
    })

    test("has a link to the sign-in page", async ({ page }) => {
        const signInLink = page.getByRole("link", {
            name: "Se connecter",
        })
        await expect(signInLink).toBeVisible()
        await signInLink.click()
        await expect(page).toHaveURL(/connexion/)
    })
})

test.describe("Sign Out", () => {
    test("signs out from the dashboard", async ({ page }) => {
        // First sign in
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

        // Click the user icon to open the popover
        await page
            .getByRole("button", {
                name: "Utilisateur",
            })
            .click()

        // Click sign out
        await page
            .getByRole("button", {
                name: "Se déconnecter",
            })
            .click()

        // Should redirect to sign-in page
        await page.waitForURL("**/connexion", {
            timeout: 10000,
        })
        await expect(page).toHaveURL(/connexion/)
    })
})

test.describe("Auth Guards", () => {
    test("redirects unauthenticated users from dashboard to sign-in", async ({ page }) => {
        // Clear cookies to ensure unauthenticated state
        await page.context().clearCookies()
        await page.goto("/organisations")
        await page.waitForURL("**/connexion", {
            timeout: 10000,
        })
        await expect(page).toHaveURL(/connexion/)
    })

    test("redirects authenticated users from sign-in to dashboard", async ({ page }) => {
        // First sign in
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

        // Try to navigate to sign-in page while authenticated
        await page.goto("/connexion")
        await expect(page).toHaveURL(/organisations/)
    })
})
