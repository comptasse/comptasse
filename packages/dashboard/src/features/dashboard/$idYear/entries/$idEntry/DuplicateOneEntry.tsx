import {
    duplicateOneEntryRouteDefinition,
    readAllEntriesRouteDefinition,
    readAllEntryTagsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonGhostContent, ButtonPlainContent, Dialog, toast, useModalStore } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconCopyCheck } from "@tabler/icons-react"
import { type ComponentProps, cloneElement, type ReactElement, useId } from "react"
import type * as v from "valibot"
import { applicationRouter } from "../../../../../routes/applicationRouter.tsx"
import { getResponseBodyFromAPI } from "../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../utilities/invalidateData.ts"

export function DuplicateOneEntry(props: {
    entry: v.InferOutput<typeof returnedSchemas.entry>
    children: ReactElement<ComponentProps<typeof Button>>
    onClick?: () => void
}) {
    const modalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function onSubmit() {
        const duplicateResponse = await getResponseBodyFromAPI({
            routeDefinition: duplicateOneEntryRouteDefinition,
            body: {
                idEntry: props.entry.id,
                idYear: props.entry.idYear,
            },
        })

        if (duplicateResponse.ok === false) {
            toast({
                title: "Erreur lors de la duplication de l'écriture",
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
                routeDefinition: readAllEntryTagsRouteDefinition,
                body: {
                    idYear: props.entry.idYear,
                },
            }),
        ])

        toast({
            title: "Écriture dupliquée",
            variant: "success",
        })

        applicationRouter.navigate({
            to: "/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry",
            params: {
                idOrganization: props.entry.idOrganization,
                idYear: props.entry.idYear,
                idEntry: duplicateResponse.data.id,
            },
        })

        closeModal(modalId)
    }

    return cloneElement(props.children, {
        onClick: () => {
            props.onClick?.()
            openModal(
                modalId,
                <Dialog.Content>
                    <Dialog.Header />
                    <div
                        className={css({
                            padding: "4",
                            paddingTop: "0",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            gap: "1",
                        })}
                    >
                        <Dialog.Title>Voulez-vous dupliquer cette écriture ?</Dialog.Title>
                        <Dialog.Description>
                            Cette action dupliquera l'écriture et toutes les données associées.
                        </Dialog.Description>
                    </div>
                    <Dialog.Footer>
                        <Button onClick={() => closeModal(modalId)}>
                            <ButtonGhostContent text="Annuler" />
                        </Button>
                        <Button
                            onClick={() => onSubmit()}
                            hasLoader
                        >
                            <ButtonPlainContent
                                leftIcon={<IconCopyCheck />}
                                text="Dupliquer l'écriture"
                            />
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>,
            )
        },
    })
}
