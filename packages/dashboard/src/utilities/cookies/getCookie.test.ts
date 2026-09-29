import { afterEach, describe, expect, it, vi } from "vitest"

// We need to mock document.cookie since we're in node environment
const documentMock = {
    cookie: "",
}

vi.stubGlobal("document", documentMock)

import { getCookie } from "./getCookie.js"

describe("getCookie", () => {
    afterEach(() => {
        documentMock.cookie = ""
    })

    it("returns the value of an existing cookie", () => {
        documentMock.cookie = "comptasse_is_auth=true; comptasse_session=abc123"
        expect(getCookie("comptasse_is_auth")).toBe("true")
    })

    it("returns the value of a specific cookie among many", () => {
        documentMock.cookie = "other=value; comptasse_session=xyz789; another=test"
        expect(getCookie("comptasse_session")).toBe("xyz789")
    })

    it("returns undefined when cookie is not found", () => {
        documentMock.cookie = "other=value"
        expect(getCookie("comptasse_is_auth")).toBeUndefined()
    })

    it("returns undefined when document.cookie is empty", () => {
        documentMock.cookie = ""
        expect(getCookie("comptasse_is_auth")).toBeUndefined()
    })

    it("returns undefined when cookie value is empty", () => {
        documentMock.cookie = "comptasse_is_auth="
        expect(getCookie("comptasse_is_auth")).toBeUndefined()
    })
})
