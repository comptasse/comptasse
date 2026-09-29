import { debounce } from "@comptasse/ui/utilities/debounce.js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("debounce", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("calls the function after the default delay (300ms)", () => {
        const fn = vi.fn()
        debounce({
            function: fn,
        })
        expect(fn).not.toHaveBeenCalled()
        vi.advanceTimersByTime(300)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it("calls the function after a custom delay", () => {
        const fn = vi.fn()
        debounce({
            function: fn,
            delay: 500,
        })
        expect(fn).not.toHaveBeenCalled()
        vi.advanceTimersByTime(500)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it("does not call the function before the delay", () => {
        const fn = vi.fn()
        debounce({
            function: fn,
            delay: 200,
        })
        vi.advanceTimersByTime(100)
        expect(fn).not.toHaveBeenCalled()
    })

    it("handles async functions", () => {
        const fn = vi.fn(async () => {})
        debounce({
            function: fn,
            delay: 100,
        })
        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledTimes(1)
    })
})
