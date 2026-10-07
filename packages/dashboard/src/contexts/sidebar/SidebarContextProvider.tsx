import type { ReactNode } from "react"
import { useCallback, useEffect, useState } from "react"
import { SidebarSetWidthContext, SidebarWidthContext } from "./SidebarContext.js"

const SIDEBAR_WIDTH_KEY = "comptasse:sidebar-width"
const DEFAULT_WIDTH = 280
const MIN_WIDTH = 200

function readStorage(key: string, fallback: string): string {
    try {
        return localStorage.getItem(key) ?? fallback
    } catch {
        return fallback
    }
}

function writeStorage(key: string, value: string): void {
    try {
        localStorage.setItem(key, value)
    } catch {}
}

export function SidebarContextProvider({ children }: { children: ReactNode }) {
    const [width, setWidthValue] = useState(() => {
        const raw = readStorage(SIDEBAR_WIDTH_KEY, String(DEFAULT_WIDTH))
        const parsed = Number.parseInt(raw, 10)
        return Number.isNaN(parsed) ? DEFAULT_WIDTH : Math.max(MIN_WIDTH, parsed)
    })

    useEffect(() => {
        writeStorage(SIDEBAR_WIDTH_KEY, String(width))
    }, [
        width,
    ])

    const setWidth = useCallback((newWidth: number) => {
        setWidthValue(Math.max(MIN_WIDTH, newWidth))
    }, [])

    return (
        <SidebarWidthContext.Provider value={width}>
            <SidebarSetWidthContext.Provider value={setWidth}>{children}</SidebarSetWidthContext.Provider>
        </SidebarWidthContext.Provider>
    )
}
