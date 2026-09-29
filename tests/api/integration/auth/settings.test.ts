import { beforeAll, describe, expect, it } from "vitest"
import { type AuthSession, authenticatedRequest, signInAsDemo } from "../../helpers/auth.js"
import { verifyApiIsRunning } from "../../helpers/setup.js"
import { apiRequest } from "../../helpers/testClient.js"

let session: AuthSession

beforeAll(async () => {
    await verifyApiIsRunning()
    session = await signInAsDemo()
})

describe("GET /users/me", () => {
    it("returns the current user session and user data", async () => {
        const response = await authenticatedRequest({
            session,
            method: "GET",
            path: "/users/me",
        })
        expect(response.status).toBe(200)

        const data = response.data as any
        expect(data).toHaveProperty("id")
        expect(data).toHaveProperty("idUser")
        expect(data).toHaveProperty("isActive")
        expect(data.isActive).toBe(true)
        expect(data).toHaveProperty("user")
        expect(data.user).toHaveProperty("id")
        expect(data.user).toHaveProperty("email")
        expect(data.user.email).toBe("demo@comptasse.com")
    })

    it("rejects unauthenticated requests", async () => {
        const response = await apiRequest({
            method: "GET",
            path: "/users/me",
        })
        expect(response.status).toBe(401)
    })
})

describe("PATCH /users/me", () => {
    it("updates the user alias", async () => {
        const newAlias = `TestAlias-${Date.now()}`
        const response = await authenticatedRequest({
            session,
            method: "PATCH",
            path: "/users/me",
            body: {
                alias: newAlias,
            },
        })
        expect(response.status).toBe(200)

        const data = response.data as any
        expect(data).toHaveProperty("id")
        expect(data.alias).toBe(newAlias)
    })

    it("allows setting alias to null", async () => {
        const response = await authenticatedRequest({
            session,
            method: "PATCH",
            path: "/users/me",
            body: {
                alias: null,
            },
        })
        expect(response.status).toBe(200)

        const data = response.data as any
        expect(data.alias).toBeNull()
    })

    it("rejects unauthenticated requests", async () => {
        const response = await apiRequest({
            method: "PATCH",
            path: "/users/me",
            body: {
                alias: "test",
            },
        })
        expect(response.status).toBe(401)
    })
})

describe("PATCH /users/me/password", () => {
    it("succeeds when new passwords match and current password is correct", async () => {
        const response = await authenticatedRequest({
            session,
            method: "PATCH",
            path: "/users/me/password",
            body: {
                currentPassword: "demo",
                newPassword: "NewPassword123!",
                newPasswordCheck: "NewPassword123!",
            },
        })
        expect(response.status).toBe(200)

        // Restore original password so other tests are not affected
        const restoreResponse = await authenticatedRequest({
            session,
            method: "PATCH",
            path: "/users/me/password",
            body: {
                currentPassword: "NewPassword123!",
                newPassword: "demo",
                newPasswordCheck: "demo",
            },
        })
        expect(restoreResponse.status).toBe(200)
    })

    it("rejects request with wrong current password and mismatched new passwords", async () => {
        const response = await authenticatedRequest({
            session,
            method: "PATCH",
            path: "/users/me/password",
            body: {
                currentPassword: "wrong_password",
                newPassword: "NewPassword123!",
                newPasswordCheck: "DifferentPassword456!",
            },
        })
        // Passwords don't match so it fails on password mismatch check
        expect(response.status).toBe(400)
    })

    it("rejects unauthenticated requests", async () => {
        const response = await apiRequest({
            method: "PATCH",
            path: "/users/me/password",
            body: {
                currentPassword: "demo",
                newPassword: "NewPassword123!",
                newPasswordCheck: "NewPassword123!",
            },
        })
        expect(response.status).toBe(401)
    })
})

describe("PATCH /users/me/email", () => {
    it("rejects unauthenticated requests", async () => {
        const response = await apiRequest({
            method: "PATCH",
            path: "/users/me/email",
            body: {
                currentPassword: "demo",
                emailToValidate: "new@example.com",
            },
        })
        expect(response.status).toBe(401)
    })

    it("rejects requests with empty body", async () => {
        const response = await authenticatedRequest({
            session,
            method: "PATCH",
            path: "/users/me/email",
            body: {},
        })
        expect(response.status).toBe(400)
    })

    it("rejects an incorrect current password", async () => {
        const response = await authenticatedRequest({
            session,
            method: "PATCH",
            path: "/users/me/email",
            body: {
                currentPassword: "wrong_password",
                emailToValidate: "new@example.com",
            },
        })
        expect(response.status).toBe(400)
    })
})
