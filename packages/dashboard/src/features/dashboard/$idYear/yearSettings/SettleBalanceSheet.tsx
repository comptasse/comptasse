import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button } from "@comptasse/ui"
import type { JSX } from "react"
import type * as v from "valibot"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { SettleBalanceSheetForm } from "./SettleBalanceSheetForm.tsx"

export function SettleBalanceSheet(props: { year: v.InferOutput<typeof returnedSchemas.year>; children: JSX.Element }) {
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
            onClick={() => openPanel(<SettleBalanceSheetForm year={props.year} />, "Solder les comptes de bilan")}
        >
            {props.children}
        </Button>
    )
}
