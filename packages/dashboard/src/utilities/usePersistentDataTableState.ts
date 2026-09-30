import type { ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table"
import { useEffect, useState } from "react"

/** localStorage-backed state so a table's sorting/filters/columns survive a refresh. */
export function usePersistentState<T>(key: string | undefined, initial: T) {
    const [value, setValue] = useState<T>(() => {
        if (key === undefined || typeof window === "undefined") return initial
        try {
            const stored = window.localStorage.getItem(key)
            return stored === null ? initial : (JSON.parse(stored) as T)
        } catch {
            return initial
        }
    })

    useEffect(() => {
        if (key === undefined || typeof window === "undefined") return
        try {
            window.localStorage.setItem(key, JSON.stringify(value))
        } catch {
            // Ignore storage quota / disabled storage.
        }
    }, [
        key,
        value,
    ])

    return [
        value,
        setValue,
    ] as const
}

function key(persistKey: string | undefined, suffix: string): string | undefined {
    return persistKey === undefined ? undefined : `${persistKey}:${suffix}`
}

/**
 * Per-table persisted UI state: global search, sorting, column filters and
 * column visibility. Pass a stable `persistKey` to enable persistence.
 */
export function usePersistentDataTableState(persistKey: string | undefined, defaultColumnVisibility: VisibilityState) {
    const [globalFilter, setGlobalFilter] = usePersistentState(key(persistKey, "search"), "")
    const [sorting, setSorting] = usePersistentState<SortingState>(key(persistKey, "sorting"), [])
    const [columnFilters, setColumnFilters] = usePersistentState<ColumnFiltersState>(key(persistKey, "filters"), [])
    const [columnVisibility, setColumnVisibility] = usePersistentState<VisibilityState>(
        key(persistKey, "visibility"),
        defaultColumnVisibility,
    )

    return {
        globalFilter,
        setGlobalFilter,
        sorting,
        setSorting,
        columnFilters,
        setColumnFilters,
        columnVisibility,
        setColumnVisibility,
    }
}
