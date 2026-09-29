import { describe, expect, it } from "vitest"
import { toRoman } from "./toRoman.js"

describe("toRoman", () => {
    it("returns empty string for 0", () => {
        expect(toRoman(0)).toBe("")
    })

    it("converts single digits", () => {
        expect(toRoman(1)).toBe("I")
        expect(toRoman(2)).toBe("II")
        expect(toRoman(3)).toBe("III")
        expect(toRoman(4)).toBe("IV")
        expect(toRoman(5)).toBe("V")
        expect(toRoman(6)).toBe("VI")
        expect(toRoman(7)).toBe("VII")
        expect(toRoman(8)).toBe("VIII")
        expect(toRoman(9)).toBe("IX")
    })

    it("converts tens", () => {
        expect(toRoman(10)).toBe("X")
        expect(toRoman(40)).toBe("XL")
        expect(toRoman(50)).toBe("L")
        expect(toRoman(90)).toBe("XC")
    })

    it("converts hundreds", () => {
        expect(toRoman(100)).toBe("C")
        expect(toRoman(400)).toBe("CD")
        expect(toRoman(500)).toBe("D")
        expect(toRoman(900)).toBe("CM")
    })

    it("converts thousands", () => {
        expect(toRoman(1000)).toBe("M")
        expect(toRoman(2000)).toBe("MM")
        expect(toRoman(3000)).toBe("MMM")
    })

    it("converts complex numbers", () => {
        expect(toRoman(1994)).toBe("MCMXCIV")
        expect(toRoman(2024)).toBe("MMXXIV")
        expect(toRoman(3999)).toBe("MMMCMXCIX")
        expect(toRoman(14)).toBe("XIV")
        expect(toRoman(42)).toBe("XLII")
    })
})
