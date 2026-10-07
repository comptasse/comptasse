import { describe, expect, it } from "vitest"
import { includesStringOrBoolean } from "./filterFns.js"

function makeRow(value: unknown, meta?: Record<string, unknown>) {
    return {
        getValue: () => value,
        original: {
            id: "row1",
        },
        getAllCells: () => [
            {
                column: {
                    id: "column",
                    columnDef: {
                        meta,
                    },
                },
            },
        ],
    } as never
}

function matches(value: unknown, filter: string | undefined, meta?: Record<string, unknown>) {
    return includesStringOrBoolean(makeRow(value, meta), "column", filter, () => {})
}

describe("includesStringOrBoolean", () => {
    it("matches the raw true/false value", () => {
        expect(matches(true, "true")).toBe(true)
        expect(matches(true, "false")).toBe(false)
        expect(matches(false, "false")).toBe(true)
    })

    it("matches the Oui/Non formatted label", () => {
        expect(matches(true, "oui")).toBe(true)
        expect(matches(false, "non")).toBe(true)
        expect(matches(true, "non")).toBe(false)
    })

    it("uses custom boolean labels when provided", () => {
        expect(
            matches(true, "pointé", {
                booleanLabels: {
                    true: "Pointé",
                    false: "Non pointé",
                },
            }),
        ).toBe(true)
    })

    it("falls back to meta.filterText for other columns", () => {
        const meta = {
            filterText: () => "Achats de marchandises",
        }
        expect(matches("609", "marchandises", meta)).toBe(true)
        expect(matches("609", "zzz", meta)).toBe(false)
    })

    it("matches everything for an empty filter", () => {
        expect(matches(true, "")).toBe(true)
        expect(matches("anything", undefined)).toBe(true)
    })
})
