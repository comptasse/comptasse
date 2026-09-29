import { describe, expect, it } from "vitest"
import { compareAmounts } from "./compareAmounts.js"

describe("compareAmounts", () => {
    it("returns true for identical values", () => {
        expect(
            compareAmounts({
                a: 100,
                b: 100,
            }),
        ).toBe(true)
    })

    it("returns true for values within tolerance (< 0.0090)", () => {
        expect(
            compareAmounts({
                a: 100,
                b: 100.008,
            }),
        ).toBe(true)
        expect(
            compareAmounts({
                a: 100,
                b: 99.992,
            }),
        ).toBe(true)
    })

    it("returns false for values outside tolerance (>= 0.0090)", () => {
        expect(
            compareAmounts({
                a: 100,
                b: 100.01,
            }),
        ).toBe(false)
        expect(
            compareAmounts({
                a: 100,
                b: 99.99,
            }),
        ).toBe(false)
    })

    it("returns true at the boundary (exactly 0.0089)", () => {
        expect(
            compareAmounts({
                a: 0,
                b: 0.0089,
            }),
        ).toBe(true)
    })

    it("returns false at the boundary (exactly 0.009)", () => {
        expect(
            compareAmounts({
                a: 0,
                b: 0.009,
            }),
        ).toBe(false)
    })

    it("returns true for both zeros", () => {
        expect(
            compareAmounts({
                a: 0,
                b: 0,
            }),
        ).toBe(true)
    })

    it("returns true for negative values within tolerance", () => {
        expect(
            compareAmounts({
                a: -50,
                b: -50.005,
            }),
        ).toBe(true)
    })

    it("returns false for large differences", () => {
        expect(
            compareAmounts({
                a: 1000,
                b: 2000,
            }),
        ).toBe(false)
    })
})
