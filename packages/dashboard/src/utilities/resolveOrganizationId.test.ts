import { afterEach, describe, expect, it } from "vitest"
import { resolveOrganizationId } from "./resolveOrganizationId.js"

function stubBrowser(parameters: { pathname: string; cookie: string }) {
    ;(
        globalThis as {
            window?: unknown
        }
    ).window = {
        location: {
            pathname: parameters.pathname,
        },
    }
    ;(
        globalThis as {
            document?: unknown
        }
    ).document = {
        cookie: parameters.cookie,
    }
}

afterEach(() => {
    delete (
        globalThis as {
            window?: unknown
        }
    ).window
    delete (
        globalThis as {
            document?: unknown
        }
    ).document
})

describe("resolveOrganizationId", () => {
    it("prefers the organization from the route", () => {
        stubBrowser({
            pathname: "/organisation/org_from_url/stockage",
            cookie: "comptasse_id_organization=org_from_cookie",
        })
        expect(resolveOrganizationId()).toBe("org_from_url")
    })

    it("falls back to the cookie when no /organisation route is present", () => {
        stubBrowser({
            pathname: "/parametres",
            cookie: "comptasse_id_organization=org_from_cookie",
        })
        expect(resolveOrganizationId()).toBe("org_from_cookie")
    })

    it("returns undefined when neither the route nor the cookie is available", () => {
        stubBrowser({
            pathname: "/parametres",
            cookie: "",
        })
        expect(resolveOrganizationId()).toBeUndefined()
    })
})
