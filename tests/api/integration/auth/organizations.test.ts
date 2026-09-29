import { beforeAll, describe, expect, it } from "vitest"
import { type AuthSession, authenticatedRequest, signInAsDemo } from "../../helpers/auth.js"
import { verifyApiIsRunning } from "../../helpers/setup.js"
import { apiRequest } from "../../helpers/testClient.js"

let session: AuthSession

beforeAll(async () => {
    await verifyApiIsRunning()
    session = await signInAsDemo()
})

describe("GET /organizations", () => {
    it("returns an array of organizations for the demo user", async () => {
        const response = await authenticatedRequest({
            session,
            method: "GET",
            path: "/organizations",
        })
        expect(response.status).toBe(200)

        const data = response.data as any[]
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)

        // Each item should have organizationUser fields and nested organization
        const first = data[0]
        expect(first).toHaveProperty("id")
        expect(first).toHaveProperty("idOrganization")
        expect(first).toHaveProperty("idUser")
        expect(first).toHaveProperty("organization")
        expect(first.organization).toHaveProperty("id")
        expect(first.organization).toHaveProperty("name")
    })

    it("rejects unauthenticated requests", async () => {
        const response = await apiRequest({
            method: "GET",
            path: "/organizations",
        })
        expect(response.status).toBe(401)
    })
})

describe("POST /organizations", () => {
    it("creates a new organization", async () => {
        const orgName = `Test Org ${Date.now()}`
        const response = await authenticatedRequest({
            session,
            method: "POST",
            path: "/organizations",
            body: {
                scope: "company",
                name: orgName,
            },
        })
        expect(response.status).toBe(200)

        const data = response.data as any
        expect(data).toHaveProperty("id")
        expect(data.name).toBe(orgName)
        expect(data.scope).toBe("company")
    })

    it("creates an organization with optional fields", async () => {
        const orgName = `Full Org ${Date.now()}`
        const response = await authenticatedRequest({
            session,
            method: "POST",
            path: "/organizations",
            body: {
                scope: "association",
                name: orgName,
                siren: "123456789",
                email: "org@test.com",
            },
        })
        expect(response.status).toBe(200)

        const data = response.data as any
        expect(data.name).toBe(orgName)
    })

    it("rejects empty body", async () => {
        const response = await authenticatedRequest({
            session,
            method: "POST",
            path: "/organizations",
            body: {},
        })
        expect(response.status).toBe(400)
    })

    it("rejects unauthenticated requests", async () => {
        const response = await apiRequest({
            method: "POST",
            path: "/organizations",
            body: {
                scope: "company",
                name: "Test",
            },
        })
        expect(response.status).toBe(401)
    })
})

describe("GET /organizations/:idOrganization", () => {
    it("reads a specific organization by id", async () => {
        // First get all orgs to find an id
        const allOrgs = await authenticatedRequest({
            session,
            method: "GET",
            path: "/organizations",
        })
        const orgs = allOrgs.data as any[]
        expect(orgs.length).toBeGreaterThanOrEqual(1)

        const idOrganization = orgs[0].organization.id
        const response = await authenticatedRequest({
            session,
            method: "GET",
            path: `/organizations/${idOrganization}`,
        })
        expect(response.status).toBe(200)

        const data = response.data as any
        expect(data).toHaveProperty("id")
        expect(data.id).toBe(idOrganization)
        expect(data).toHaveProperty("name")
    })

    it("rejects unauthenticated requests", async () => {
        const response = await apiRequest({
            method: "GET",
            path: "/organizations/fake-id",
        })
        expect(response.status).toBe(401)
    })
})
