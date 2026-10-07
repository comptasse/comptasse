import { deleteOneYearRouteDefinition, readAllYearsRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, Dialog, toast, useModalStore } from "@comptasse/ui"
import { useRouter } from "@tanstack/react-router"
import { type ComponentPropsWithRef, type ReactElement, useId } from "react"
import type * as v from "valibot"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"

export function DeleteOneYear(props: {
    year: v.InferOutput<typeof returnedSchemas.year>
    children: ReactElement<ComponentPropsWithRef<"div">>
}) {
    const router = useRouter()
    const modalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function onSubmit() {
        const deleteResponse = await getResponseBodyFromAPI({
            routeDefinition: deleteOneYearRouteDefinition,
            body: {
                idYear: props.year.id,
            },
        })

        if (deleteResponse.ok === false) {
            toast({
                title: "Erreur lors de la suppression de l'exercice",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readAllYearsRouteDefinition,
            body: {},
            params: {
                idOrganization: props.year.idOrganization,
            },
        })

        toast({
            title: "Exercice supprimé",
            variant: "success",
        })

        router.navigate({
            to: "/organisation/$idOrganization/exercices",
            params: {
                idOrganization: props.year.idOrganization,
            },
        })
    }

    return (
        <Button
            onClick={() =>
                openModal(
                    modalId,
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Voulez-vous supprimer cet exercice ?</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Dialog.Description>
                                Cette action supprimera l'exercice et toutes les données associées. Cette action est
                                irréversible.
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
                                    color="danger"
                                    text="Supprimer l'exercice"
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
