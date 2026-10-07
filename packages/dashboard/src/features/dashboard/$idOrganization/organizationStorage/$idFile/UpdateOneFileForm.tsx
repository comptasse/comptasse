import { blobSchema } from "@comptasse/application-metadata/components"
import {
    readAllFilesRouteDefinition,
    readOneFileRouteDefinition,
    updateOneFileRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { InputDate, InputFile, toast } from "@comptasse/ui"
import { IconPencil } from "@tabler/icons-react"
import { Fragment } from "react/jsx-runtime"
import * as v from "valibot"
import { FormControl } from "../../../../../components/forms/FormControl.js"
import { FormError } from "../../../../../components/forms/FormError.js"
import { FormField } from "../../../../../components/forms/FormField.js"
import { FormItem } from "../../../../../components/forms/FormItem.js"
import { FormLabel } from "../../../../../components/forms/FormLabel.js"
import { FormRoot } from "../../../../../components/forms/FormRoot.js"
import { FormTextField } from "../../../../../components/forms/FormTextField.js"
import { useRightPanel } from "../../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../../utilities/invalidateData.js"
import { resolveApiBaseUrl } from "../../../../../utilities/resolveApiBaseUrl.js"
import { resolveOrganizationId } from "../../../../../utilities/resolveOrganizationId.js"

export function UpdateOneFileForm(props: {
    file: v.InferOutput<typeof returnedSchemas.file>
    /** Which part of the file to edit. Defaults to everything. */
    mode?: "metadata" | "file"
}) {
    const { closePanel } = useRightPanel()
    const showFile = props.mode !== "metadata"
    const showMetadata = props.mode !== "file"
    return (
        <FormRoot
            schema={v.object({
                ...updateOneFileRouteDefinition.schemas.body.entries,
                file: v.optional(v.nullable(blobSchema)),
            })}
            defaultValues={{
                ...props.file,
                idFile: props.file.id,
            }}
            submitButtonProps={{
                leftIcon: <IconPencil />,
                text: "Modifier le fichier",
            }}
            onSubmit={async (data) => {
                const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
                const orgId = resolveOrganizationId() ?? props.file.idOrganization
                const url = `${apiBaseUrl}/organizations/${orgId}/years/:idYear/files/${props.file.id}`

                if (data.file instanceof File) {
                    const formData = new FormData()
                    formData.append("reference", data.reference ?? "")
                    formData.append("name", data.name ?? "")
                    formData.append("description", data.description ?? "")
                    formData.append("date", data.date ?? "")
                    if (data.idFolder) {
                        formData.append("idFolder", data.idFolder)
                    }
                    formData.append("file", data.file)

                    const response = await fetch(url, {
                        method: "PATCH",
                        body: formData,
                        credentials: "include",
                        headers: {
                            "X-Organization-Id": orgId,
                        },
                    })

                    if (!response.ok) {
                        toast({
                            title: "Impossible de modifier le fichier",
                            variant: "error",
                        })
                        return false
                    }
                } else {
                    const updateFileResponse = await getResponseBodyFromAPI({
                        routeDefinition: updateOneFileRouteDefinition,
                        body: {
                            idFile: props.file.id,
                            reference: data.reference,
                            name: data.name,
                            description: data.description,
                            date: data.date,
                            idFolder: data.idFolder,
                        },
                    })
                    if (updateFileResponse.ok === false) {
                        toast({
                            title: "Impossible de modifier le fichier",
                            variant: "error",
                        })
                        return false
                    }
                }

                toast({
                    title: "Fichier modifié avec succès",
                    variant: "success",
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                await Promise.all([
                    invalidateData({
                        routeDefinition: readAllFilesRouteDefinition,
                        body: {},
                    }),
                    invalidateData({
                        routeDefinition: readOneFileRouteDefinition,
                        body: {
                            idFile: props.file.id,
                        },
                    }),
                ])

                closePanel()
            }}
        >
            {(form) => (
                <Fragment>
                    {showFile && (
                        <FormField
                            control={form.control}
                            name="file"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel
                                        label="Fichier"
                                        isRequired={false}
                                    />
                                    <FormControl>
                                        <InputFile
                                            value={field.value instanceof File ? field.value : null}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormError />
                                </FormItem>
                            )}
                        />
                    )}
                    {showMetadata && (
                        <Fragment>
                            <FormTextField
                                control={form.control}
                                name="reference"
                                label="Référence"
                                autoFocus={true}
                            />
                            <FormTextField
                                control={form.control}
                                name="name"
                                label="Nom du fichier"
                            />
                            <FormTextField
                                control={form.control}
                                name="description"
                                label="Description"
                                multiline={true}
                            />
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel
                                            label="Date du document"
                                            isRequired={false}
                                            description={undefined}
                                            tooltip={undefined}
                                        />
                                        <FormControl>
                                            <InputDate
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormError />
                                    </FormItem>
                                )}
                            />
                        </Fragment>
                    )}
                </Fragment>
            )}
        </FormRoot>
    )
}
