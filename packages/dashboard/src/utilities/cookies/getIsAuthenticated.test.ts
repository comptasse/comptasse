import { afterEach, describe, expect, it, vi } from "vitest"

const documentMock = {
    cookie: "",
}

vi.stubGlobal("document", documentMock)

import { getIsAuthenticated } from "./getIsAuthenticated.js"

describe("getIsAuthenticated", () => {
    afterEach(() => {
        documentMock.cookie = ""
    })

    it("returns true when comptasse_is_auth cookie is 'true'", () => {
        documentMock.cookie = "comptasse_is_auth=true"
        expect(getIsAuthenticated()).toBe(true)
    })

    it("returns false when comptasse_is_auth cookie is 'false'", () => {
        documentMock.cookie = "comptasse_is_auth=false"
        expect(getIsAuthenticated()).toBe(false)
    })

    it("returns undefined when comptasse_is_auth cookie is not present", () => {
        documentMock.cookie = "other_cookie=value"
        expect(getIsAuthenticated()).toBeUndefined()
    })

    it("returns undefined when no cookies are set", () => {
        documentMock.cookie = ""
        expect(getIsAuthenticated()).toBeUndefined()
    })

    it("returns true when comptasse_is_auth is among multiple cookies", () => {
        documentMock.cookie = "session=abc; comptasse_is_auth=true; other=xyz"
        expect(getIsAuthenticated()).toBe(true)
    })
})
