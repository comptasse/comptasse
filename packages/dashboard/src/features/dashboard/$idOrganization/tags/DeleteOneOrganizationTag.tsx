import {
    deleteOneTagRouteDefinition,
    readAllOrganizationTagsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, Dialog, toast, useModalStore } from "@comptasse/ui"
import { type ComponentPropsWithRef, type ReactElement, useId } from "react"
import type * as v from "valibot"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"

export function DeleteOneOrganizationTag(props: {
    tag: v.InferOutput<typeof returnedSchemas.tag>
    children: ReactElement<ComponentPropsWithRef<"div">>
}) {
    const modalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function onSubmit() {
        const response = await getResponseBodyFromAPI({
            routeDefinition: deleteOneTagRouteDefinition,
            body: {
                idTag: props.tag.id,
            },
        })
        if (response.ok === false) {
            toast({
                title: "Impossible de supprimer la catégorie",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readAllOrganizationTagsRouteDefinition,
            body: {},
        })

        toast({
            title: "Catégorie supprimée",
            variant: "success",
        })
        closeModal(modalId)
    }

    return (
        <Button
            onClick={() =>
                openModal(
                    modalId,
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Voulez-vous supprimer cette catégorie ?</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Dialog.Description>
                                La catégorie sera retirée de tous les exercices et des écritures associées.
                            </Dialog.Description>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button onClick={() => closeModal(modalId)}>
                                <ButtonOutlineContent text="Annuler" />
                            </Button>
                            <Button onClick={() => onSubmit()}>
                                <ButtonPlainContent text="Supprimer la catégorie" />
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
