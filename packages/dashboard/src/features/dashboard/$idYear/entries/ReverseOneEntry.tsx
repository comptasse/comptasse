import { reverseOneEntryRouteDefinition } from "@comptasse/application-metadata"
import {
    readAllEntriesRouteDefinition,
    readAllEntryLinesRouteDefinition,
    readAllEntryTagsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, Dialog, toast, useModalStore } from "@comptasse/ui"
import { type ComponentProps, cloneElement, type ReactElement, useId } from "react"
import type * as v from "valibot"
import { applicationRouter } from "../../../../routes/applicationRouter.tsx"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"

export function ReverseOneEntry(props: {
    entry: v.InferOutput<typeof returnedSchemas.entry>
    children: ReactElement<ComponentProps<typeof Button>>
    onClick?: () => void
}) {
    const modalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function onSubmit() {
        const reverseResponse = await getResponseBodyFromAPI({
            routeDefinition: reverseOneEntryRouteDefinition,
            body: {
                idEntry: props.entry.id,
                idYear: props.entry.idYear,
            },
        })

        if (reverseResponse.ok === false) {
            toast({
                title: "Erreur lors de l'extourne de l'écriture",
                variant: "error",
            })
            return
        }

        await Promise.all([
            invalidateData({
                routeDefinition: readAllEntriesRouteDefinition,
                body: {
                    idYear: props.entry.idYear,
                },
            }),
            invalidateData({
                routeDefinition: readAllEntryLinesRouteDefinition,
                body: {
                    idYear: props.entry.idYear,
                },
            }),
            invalidateData({
                routeDefinition: readAllEntryTagsRouteDefinition,
                body: {
                    idYear: props.entry.idYear,
                },
            }),
        ])

        toast({
            title: "Écriture extournée",
            variant: "success",
        })

        applicationRouter.navigate({
            to: "/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry",
            params: {
                idOrganization: props.entry.idOrganization,
                idYear: props.entry.idYear,
                idEntry: reverseResponse.data.id,
            },
        })
    }

    return cloneElement(props.children, {
        onClick: () => {
            props.onClick?.()
            openModal(
                modalId,
                <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title>Voulez-vous extourner cette écriture ?</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <Dialog.Description>
                            Cette action créera une écriture d'extourne avec les mêmes mouvements inversés. L'écriture
                            originale ne sera pas modifiée.
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
                            <ButtonPlainContent text="Extourner l'écriture" />
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>,
            )
        },
    })
}
