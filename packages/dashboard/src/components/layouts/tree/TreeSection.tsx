import { css } from "@comptasse/ui/utilities/cn.js"
import type { ReactNode } from "react"

export function TreeSection({ children }: { children: ReactNode }) {
    return (
        <div
            className={css({
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
            })}
        >
            {children}
        </div>
    )
}
