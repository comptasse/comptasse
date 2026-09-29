import { describe, expect, it } from "vitest"
import { cookiePrefix } from "./variables.js"

describe("variables", () => {
    it("exports the correct cookie prefix", () => {
        expect(cookiePrefix).toBe("comptasse")
    })

    it("cookie prefix is a string", () => {
        expect(typeof cookiePrefix).toBe("string")
    })
})
