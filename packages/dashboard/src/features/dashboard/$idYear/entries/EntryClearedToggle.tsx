import { readAllEntriesRouteDefinition, updateOneEntryRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, toast } from "@comptasse/ui"
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react"
import { useState } from "react"
import type * as v from "valibot"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"

/** Action button toggling the “pointé” (cleared) flag of an entry. */
export function EntryClearedToggle(props: { entry: v.InferOutput<typeof returnedSchemas.entry> }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function toggle(isCleared: boolean) {
        setIsSubmitting(true)
        try {
            const response = await getResponseBodyFromAPI({
                routeDefinition: updateOneEntryRouteDefinition,
                body: {
                    idEntry: props.entry.id,
                    idYear: props.entry.idYear,
                    isCleared: isCleared,
                },
            })
            if (response.ok === false) {
                toast({
                    title: "Impossible de mettre à jour le pointage",
                    variant: "error",
                })
                return
            }
            await invalidateData({
                routeDefinition: readAllEntriesRouteDefinition,
                body: {
                    idYear: props.entry.idYear,
                },
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Button
            hasLoader={isSubmitting}
            onClick={() => toggle(!props.entry.isCleared)}
        >
            <ButtonOutlineContent
                leftIcon={props.entry.isCleared ? <IconCircleX /> : <IconCircleCheck />}
                text={props.entry.isCleared ? "Dépointer" : "Pointer"}
            />
        </Button>
    )
}
