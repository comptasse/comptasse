import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button } from "@comptasse/ui"
import type { JSX } from "react"
import type * as v from "valibot"
import { useRightPanel } from "../../../../../../contexts/rightPanel/RightPanelContext.js"
import { EntryLinePage } from "./EntryLinePage.tsx"

/** Opens a read-only detail panel for a single entry line. */
export function ViewOneEntryLine(props: {
    entryLine: v.InferOutput<typeof returnedSchemas.entryLine>
    children: JSX.Element
}) {
    const { openPanel } = useRightPanel()

    return (
        <Button
            className={{
                padding: "0",
                border: "none",
                backgroundColor: "transparent",
                width: "fit-content",
                height: "fit-content",
            }}
            onClick={() =>
                openPanel(
                    <EntryLinePage
                        idYear={props.entryLine.idYear}
                        idEntryLine={props.entryLine.id}
                    />,
                    "Mouvement",
                )
            }
        >
            {props.children}
        </Button>
    )
}
