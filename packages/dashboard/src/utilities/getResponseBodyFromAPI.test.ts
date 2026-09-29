import { describe, expect, it } from "vitest"
import { buildUrl } from "./getResponseBodyFromAPI.js"

describe("buildUrl", () => {
    it("does not let a short body key (id) corrupt a longer path token (:idOrganization)", () => {
        const { url, remainingBody } = buildUrl(
            "https://api.example.com",
            "/organizations/:idOrganization/years/:idYear/entries/:idEntry",
            {
                idOrganization: "org1",
            },
            {
                id: "entry1",
                idEntry: "entry1",
                idYear: "year1",
                idOrganization: "org1",
                idFile: null,
            },
            "PATCH",
        )

        expect(url.pathname).toBe("/organizations/org1/years/year1/entries/entry1")
        // `id` is not a path param, so it stays in the body (stripped server-side).
        expect(remainingBody.id).toBe("entry1")
        expect(remainingBody.idOrganization).toBeUndefined()
        expect(remainingBody.idYear).toBeUndefined()
        expect(remainingBody.idEntry).toBeUndefined()
    })

    it("does not let :idEntry corrupt :idEntryLine", () => {
        const { url } = buildUrl(
            "https://api.example.com",
            "/organizations/:idOrganization/years/:idYear/entries/:idEntry/lines/:idEntryLine",
            {
                idOrganization: "org1",
            },
            {
                idEntry: "entry1",
                idEntryLine: "line1",
                idYear: "year1",
            },
            "PATCH",
        )

        expect(url.pathname).toBe("/organizations/org1/years/year1/entries/entry1/lines/line1")
    })

    it("leaves unresolved path tokens untouched and excludes consumed params from the body", () => {
        const { url, remainingBody } = buildUrl(
            "https://api.example.com",
            "/organizations/:idOrganization/files/:idFile",
            undefined,
            {
                idFile: "f1",
            },
            "GET",
        )

        expect(url.pathname).toBe("/organizations/:idOrganization/files/f1")
        expect(remainingBody.idFile).toBeUndefined()
    })
})
