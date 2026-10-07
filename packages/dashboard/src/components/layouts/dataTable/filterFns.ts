import type { FilterFn } from "@tanstack/react-table"

/**
 * Filter function matching the raw cell value but also, for booleans, the
 * formatted label ("Oui" / "Non", customisable via `meta.booleanLabels`) and any
 * `meta.filterText`. Used as the global filter and on boolean columns so that
 * "true"/"false" and "oui"/"non" both work.
 */
export const includesStringOrBoolean: FilterFn<any> = (row, columnId, filterValue) => {
    const search = filterValue?.toString().toLowerCase()
    if (search === undefined || search === "") return true

    const value = row.getValue(columnId)
    const meta = row.getAllCells().find((cell) => cell.column.id === columnId)?.column.columnDef.meta as
        | {
              booleanLabels?: {
                  true?: string
                  false?: string
              }
              filterText?: (value: unknown, row: unknown) => string
          }
        | undefined

    const candidates = [
        String(value ?? ""),
    ]
    if (typeof value === "boolean") {
        candidates.push(value ? (meta?.booleanLabels?.true ?? "Oui") : (meta?.booleanLabels?.false ?? "Non"))
        candidates.push(value ? "true" : "false")
    } else if (meta?.filterText !== undefined) {
        candidates.push(meta.filterText(value, row.original))
    }

    return candidates.some((candidate) => candidate.toLowerCase().includes(search))
}
