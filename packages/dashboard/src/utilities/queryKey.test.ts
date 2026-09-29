import { afterEach, describe, expect, it } from "vitest"
import { buildQueryKey } from "./queryKey.js"

const routeDefinition = {
    path: "/organizations/:idOrganization/years/:idYear/entries",
}

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

describe("buildQueryKey", () => {
    it("resolves idOrganization from the route with the same key that a request uses", () => {
        stubBrowser({
            pathname: "/organisation/org1/exercice/year1/écritures",
            cookie: "",
        })
        expect(
            buildQueryKey(routeDefinition, {
                idYear: "year1",
            }),
        ).toEqual([
            routeDefinition.path,
            {
                idYear: "year1",
            },
            {
                idOrganization: "org1",
            },
        ])
    })

    it("does not modify the key for routes without :idOrganization", () => {
        stubBrowser({
            pathname: "/parametres",
            cookie: "",
        })
        expect(
            buildQueryKey(
                {
                    path: "/organizations",
                },
                {},
            ),
        ).toEqual([
            "/organizations",
            {},
            {},
        ])
    })
})
