import { describe, expect, it } from "vitest"
import { levenshtein } from "./levenshtein.js"

describe("levenshtein", () => {
    it("returns 0 for identical strings", () => {
        expect(levenshtein("hello", "hello")).toBe(0)
    })

    it("returns the length of the other string when one is empty", () => {
        expect(levenshtein("", "hello")).toBe(5)
        expect(levenshtein("hello", "")).toBe(5)
    })

    it("returns 0 for two empty strings", () => {
        expect(levenshtein("", "")).toBe(0)
    })

    it("handles single character substitution", () => {
        expect(levenshtein("cat", "bat")).toBe(1)
    })

    it("handles single character insertion", () => {
        expect(levenshtein("cat", "cats")).toBe(1)
    })

    it("handles single character deletion", () => {
        expect(levenshtein("cats", "cat")).toBe(1)
    })

    it("computes correct distance for completely different strings", () => {
        expect(levenshtein("abc", "xyz")).toBe(3)
    })

    it("computes correct distance for classic example", () => {
        expect(levenshtein("kitten", "sitting")).toBe(3)
    })

    it("handles single character strings", () => {
        expect(levenshtein("a", "b")).toBe(1)
        expect(levenshtein("a", "a")).toBe(0)
    })

    it("is case sensitive", () => {
        expect(levenshtein("Hello", "hello")).toBe(1)
    })
})
