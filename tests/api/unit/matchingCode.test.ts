import { describe, expect, it } from "vitest"
import { toMatchingCode } from "#/utilities/matchingCode.js"

describe("toMatchingCode", () => {
    it("maps 1 to A", () => {
        expect(toMatchingCode(1)).toBe("A")
    })

    it("maps 26 to Z", () => {
        expect(toMatchingCode(26)).toBe("Z")
    })

    it("rolls over to two letters after Z", () => {
        expect(toMatchingCode(27)).toBe("AA")
        expect(toMatchingCode(28)).toBe("AB")
    })

    it("maps 52 to AZ and 53 to BA", () => {
        expect(toMatchingCode(52)).toBe("AZ")
        expect(toMatchingCode(53)).toBe("BA")
    })

    it("produces unique codes for a long run", () => {
        const codes = Array.from(
            {
                length: 1000,
            },
            (_, index) => toMatchingCode(index + 1),
        )
        expect(new Set(codes).size).toBe(codes.length)
    })
})
