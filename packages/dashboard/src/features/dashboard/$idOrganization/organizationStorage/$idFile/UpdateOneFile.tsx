import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button } from "@comptasse/ui"
import type { JSX } from "react"
import type * as v from "valibot"
import { useRightPanel } from "../../../../../contexts/rightPanel/RightPanelContext.js"
import { UpdateOneFileForm } from "./UpdateOneFileForm.js"

export function UpdateOneFile(props: { file: v.InferOutput<typeof returnedSchemas.file>; children: JSX.Element }) {
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
            onClick={() => openPanel(<UpdateOneFileForm file={props.file} />, "Modifier le fichier")}
        >
            {props.children}
        </Button>
    )
}
