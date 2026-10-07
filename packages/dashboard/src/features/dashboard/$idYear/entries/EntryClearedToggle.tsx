import { readAllEntriesRouteDefinition, updateOneEntryRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { type Button, toast } from "@comptasse/ui"
import { type ComponentProps, cloneElement, type ReactElement, useState } from "react"
import type * as v from "valibot"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"

/** Clones its child button to toggle the “pointé” (cleared) flag of an entry. */
export function EntryClearedToggle(props: {
    entry: v.InferOutput<typeof returnedSchemas.entry>
    /** Called before toggling (e.g. to close a popover). */
    onClick?: () => void
    /** The button to clone; the caller styles it (table icon, menu item, …). */
    children: ReactElement<ComponentProps<typeof Button>>
}) {
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

    return cloneElement(props.children, {
        hasLoader: isSubmitting,
        onClick: () => {
            props.onClick?.()
            toggle(!props.entry.isCleared)
        },
    })
}
