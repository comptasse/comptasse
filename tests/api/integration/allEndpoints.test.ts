import * as routes from "@comptasse/application-metadata/routes"
import { beforeAll, describe, expect, it } from "vitest"
import { verifyApiIsRunning } from "../helpers/setup.js"
import { apiRequest } from "../helpers/testClient.js"

type RouteDefinition = {
    method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT"
    path: string
    name: string | undefined
}

function isRouteDefinition(value: unknown): value is RouteDefinition {
    return (
        typeof value === "object" &&
        value !== null &&
        "method" in value &&
        "path" in value &&
        typeof (
            value as {
                path: unknown
            }
        ).path === "string" &&
        typeof (
            value as {
                method: unknown
            }
        ).method === "string"
    )
}

const routeDefinitions: RouteDefinition[] = Object.values(routes).filter(isRouteDefinition)

/**
 * Route definitions exported by the metadata package but **not** registered in
 * the API router (their handler files are entirely commented out, or no handler
 * exists). They must stay 404 until implemented; if one becomes reachable,
 * remove it from this list so the coverage stays accurate.
 */
const KNOWN_UNMOUNTED = new Set<string>([
    "compute-one-entry",
    "POST /organizations/:idOrganization/years/:idYear/accounts/generate",
    "POST /organizations/:idOrganization/years/:idYear/journals/generate",
    "POST /organizations/:idOrganization/years/:idYear/balance-sheets/generate",
    "POST /organizations/:idOrganization/years/:idYear/balance-sheets/connect-accounts",
    "POST /organizations/:idOrganization/years/:idYear/income-statements/generate",
    "POST /organizations/:idOrganization/years/:idYear/income-statements/connect-accounts",
    "POST /organizations/:idOrganization/years/:idYear/computations/generate",
])

/** Replace every `:param` token with a placeholder so the router can match. */
function buildPath(path: string): string {
    return path.replace(/:idOrganization/, "idOrganization").replace(/:[A-Za-z0-9_]+/g, "does_not_exist")
}

describe("API endpoint catalog", () => {
    it("exports a route definition for every endpoint (>= 90)", () => {
        expect(routeDefinitions.length).toBeGreaterThanOrEqual(90)
    })

    it("has unique route names", () => {
        const names = routeDefinitions.map((r) => r.name).filter((name): name is string => Boolean(name))
        expect(new Set(names).size).toBe(names.length)
    })
})

describe("All API endpoints are mounted", () => {
    beforeAll(async () => {
        await verifyApiIsRunning()
    })

    it.each(
        routeDefinitions.map(
            (route) =>
                [
                    route.name ?? `${route.method} ${route.path}`,
                    route,
                ] as const,
        ),
    )("%s is reachable", async (label, route) => {
        const response = await apiRequest({
            method: route.method,
            path: buildPath(route.path),
            // Non-GET requests are validated, so send an (invalid) object body.
            body: route.method === "GET" ? undefined : {},
        })

        // Protected routes answer 401 without a session; public routes may
        // answer 200/400/500. The one thing a mounted route must never be
        // is 404. Known-unmounted definitions must remain 404.
        if (KNOWN_UNMOUNTED.has(label)) {
            expect(response.status).toBe(404)
        } else {
            expect(response.status).not.toBe(404)
        }
    })
})
