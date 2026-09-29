import { closeYearRouteDefinition, readOneYearRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, Dialog, toast, useModalStore } from "@comptasse/ui"
import { type ComponentPropsWithRef, type ReactElement, useId } from "react"
import type * as v from "valibot"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"

/**
 * Toggles the year closed/open (closeYearRouteDefinition flips `isClosed`).
 * Idempotent in the sense that the operation always converges to the toggled
 * state and only touches the year record.
 */
export function CloseYear(props: {
    year: v.InferOutput<typeof returnedSchemas.year>
    children: ReactElement<ComponentPropsWithRef<"div">>
}) {
    const modalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()
    const isClosed = props.year.isClosed

    async function onSubmit() {
        const response = await getResponseBodyFromAPI({
            routeDefinition: closeYearRouteDefinition,
            body: {
                idYear: props.year.id,
            },
            params: {
                idOrganization: props.year.idOrganization,
            },
        })

        if (response.ok === false) {
            toast({
                title: "Impossible de modifier l'état de l'exercice",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readOneYearRouteDefinition,
            body: {
                idYear: props.year.id,
            },
            params: {
                idOrganization: props.year.idOrganization,
            },
        })

        toast({
            title: isClosed ? "Exercice rouvert" : "Exercice clôturé",
            variant: "success",
        })
    }

    return (
        <Button
            onClick={() =>
                openModal(
                    modalId,
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>
                                {isClosed
                                    ? "Voulez-vous rouvrir cet exercice ?"
                                    : "Voulez-vous clôturer cet exercice ?"}
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Dialog.Description>
                                {isClosed
                                    ? "L'exercice sera de nouveau modifiable (écritures, paramètres)."
                                    : "Les écritures de l'exercice ne seront plus modifiables. Vous pourrez le rouvrir à tout moment."}
                            </Dialog.Description>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button onClick={() => closeModal(modalId)}>
                                <ButtonOutlineContent text="Annuler" />
                            </Button>
                            <Button
                                hasLoader
                                onClick={async () => {
                                    await onSubmit()
                                    closeModal(modalId)
                                }}
                            >
                                <ButtonPlainContent
                                    color={isClosed ? "default" : "danger"}
                                    text={isClosed ? "Rouvrir l'exercice" : "Clôturer l'exercice"}
                                />
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>,
                )
            }
        >
            {props.children}
        </Button>
    )
}
