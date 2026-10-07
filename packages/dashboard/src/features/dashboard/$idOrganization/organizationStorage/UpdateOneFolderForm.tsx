import { readAllFoldersRouteDefinition, updateOneFolderRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { InputText, toast } from "@comptasse/ui"
import { IconPencil } from "@tabler/icons-react"
import type * as v from "valibot"
import { FormControl } from "../../../../components/forms/FormControl.js"
import { FormError } from "../../../../components/forms/FormError.js"
import { FormField } from "../../../../components/forms/FormField.js"
import { FormItem } from "../../../../components/forms/FormItem.js"
import { FormLabel } from "../../../../components/forms/FormLabel.js"
import { FormRoot } from "../../../../components/forms/FormRoot.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"

export function UpdateOneFolderForm(props: { folder: v.InferOutput<typeof returnedSchemas.folder> }) {
    const { closePanel } = useRightPanel()
    return (
        <FormRoot
            schema={updateOneFolderRouteDefinition.schemas.body}
            defaultValues={{
                idFolder: props.folder.id,
                name: props.folder.name,
            }}
            submitButtonProps={{
                leftIcon: <IconPencil />,
                text: "Modifier le dossier",
            }}
            onSubmit={async (data) => {
                const updateResponse = await getResponseBodyFromAPI({
                    routeDefinition: updateOneFolderRouteDefinition,
                    body: {
                        idFolder: props.folder.id,
                        name: data.name,
                    },
                })
                if (updateResponse.ok === false) {
                    toast({
                        title: "Impossible de modifier le dossier",
                        variant: "error",
                    })
                    return false
                }
                toast({
                    title: "Dossier modifié avec succès",
                    variant: "success",
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                await invalidateData({
                    routeDefinition: readAllFoldersRouteDefinition,
                    body: {},
                })
                closePanel()
            }}
        >
            {(form) => (
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel
                                label="Nom du dossier"
                                isRequired
                            />
                            <FormControl>
                                <InputText
                                    value={field.value}
                                    onChange={field.onChange}
                                    autoFocus
                                />
                            </FormControl>
                            <FormError />
                        </FormItem>
                    )}
                />
            )}
        </FormRoot>
    )
}
