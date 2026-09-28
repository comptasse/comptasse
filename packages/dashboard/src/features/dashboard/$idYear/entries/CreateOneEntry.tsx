import {
    addOneEntryTagRouteDefinition,
    createOneEntryFromTemplateRouteDefinition,
    readAllEntriesRouteDefinition,
    readAllEntryTagsRouteDefinition,
    readAllFilesRouteDefinition,
    readAllJournalsRouteDefinition,
    readAllTagsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, InputComboboxMultiple, InputDate, InputSelect, InputText, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import { type JSX, useState } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { FormControl } from "../../../../components/forms/FormControl.js"
import { FormError } from "../../../../components/forms/FormError.js"
import { FormField } from "../../../../components/forms/FormField.js"
import { FormGroup } from "../../../../components/forms/FormGroup.js"
import { FormItem } from "../../../../components/forms/FormItem.js"
import { FormLabel } from "../../../../components/forms/FormLabel.js"
import { FormRoot } from "../../../../components/forms/FormRoot.js"
import { InputDataCombobox } from "../../../../components/InputDataCombobox.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { applicationRouter } from "../../../../routes/applicationRouter.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"
import { useDataFromAPI } from "../../../../utilities/useHTTPData.js"
import { type EntryTemplateKey, entryTemplates } from "./entryTemplates/entryTemplates.js"

function CreateOneEntryPanel(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
}) {
    const { closePanel } = useRightPanel()
    const [selectedTemplate, setSelectedTemplate] = useState<EntryTemplateKey | "empty">("empty")
    const [isTemplateReady, setIsTemplateReady] = useState(false)
    const [selectedTags, setSelectedTags] = useState<
        Array<{
            key: string
            label: string
        }>
    >([])

    const tagsResponse = useDataFromAPI({
        routeDefinition: readAllTagsRouteDefinition,
        body: {
            idYear: props.idYear,
        },
    })

    const activeTemplate = entryTemplates.find((t) => t.key === selectedTemplate)
    const isSubmitDisabled = activeTemplate?.hasActionButton === true && isTemplateReady === false

    return (
        <FormRoot
            schema={createOneEntryFromTemplateRouteDefinition.schemas.body}
            defaultValues={{
                idYear: props.idYear,
                date: new Date().toISOString(),
                idFile: null,
                idJournal: null,
                entryLines: [],
            }}
            submitButtonProps={{
                leftIcon: <IconPlus />,
                text: "Ajouter l'écriture",
                isDisabled: isSubmitDisabled,
            }}
            onSubmit={async (data) => {
                const createEntryResponse = await getResponseBodyFromAPI({
                    routeDefinition: createOneEntryFromTemplateRouteDefinition,
                    body: data,
                })
                if (createEntryResponse.ok === false) {
                    toast({
                        title: "Impossible d'ajouter l'écriture",
                        variant: "error",
                    })
                    return false
                }

                if (selectedTags.length > 0) {
                    await Promise.all(
                        selectedTags.map((tag) =>
                            getResponseBodyFromAPI({
                                routeDefinition: addOneEntryTagRouteDefinition,
                                body: {
                                    idYear: props.idYear,
                                    idEntry: createEntryResponse.data.id,
                                    idTag: tag.key,
                                },
                            }),
                        ),
                    )
                }

                toast({
                    title: "Écriture ajoutée avec succès",
                    variant: "success",
                })
                applicationRouter.navigate({
                    to: "/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry",
                    params: {
                        idOrganization: props.idOrganization,
                        idYear: props.idYear,
                        idEntry: createEntryResponse.data.id,
                    },
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                await Promise.all([
                    invalidateData({
                        routeDefinition: readAllEntriesRouteDefinition,
                        body: {
                            idYear: props.idYear,
                        },
                    }),
                    invalidateData({
                        routeDefinition: readAllEntryTagsRouteDefinition,
                        body: {
                            idYear: props.idYear,
                        },
                    }),
                ])

                closePanel()
            }}
        >
            {(form) => (
                <Fragment>
                    <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Libellé"
                                    isRequired={true}
                                />
                                <FormControl>
                                    <InputText
                                        value={field.value}
                                        onChange={field.onChange}
                                        autoFocus={true}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Date"
                                    isRequired={true}
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
                    <FormField
                        control={form.control}
                        name="idJournal"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Journal"
                                    isRequired={false}
                                />
                                <FormControl>
                                    <InputDataCombobox
                                        value={field.value}
                                        onChange={field.onChange}
                                        routeDefinition={readAllJournalsRouteDefinition}
                                        body={{
                                            idYear: props.idYear,
                                        }}
                                        placeholder="Sélectionner un journal"
                                        getOption={(journal) => ({
                                            key: journal.id,
                                            label: `(${journal.code}) ${journal.label}`,
                                        })}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="idFile"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Pièce justificative"
                                    isRequired={false}
                                />
                                <FormControl>
                                    <InputDataCombobox
                                        value={field.value}
                                        onChange={field.onChange}
                                        routeDefinition={readAllFilesRouteDefinition}
                                        body={{
                                            idYear: props.idYear,
                                        }}
                                        placeholder="Sélectionner une pièce justificative"
                                        getOption={(file) => ({
                                            key: file.id,
                                            label: file.reference ? `${file.name} (${file.reference})` : file.name,
                                        })}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormItem>
                        <FormLabel
                            label="Catégories"
                            isRequired={false}
                        />
                        <InputComboboxMultiple
                            placeholder="Ajouter une catégorie"
                            emptyLabel="Aucune catégorie sélectionnée"
                            options={
                                tagsResponse.data === undefined
                                    ? []
                                    : tagsResponse.data.map((tag) => ({
                                          key: tag.id,
                                          label: tag.label,
                                      }))
                            }
                            selectedOptions={selectedTags}
                            onChange={setSelectedTags}
                            loading={tagsResponse.isPending}
                        />
                    </FormItem>
                    <FormGroup title="Modèle d'écriture">
                        <FormItem>
                            <span
                                className={css({
                                    fontSize: "xs",
                                    color: "neutral/50",
                                })}
                            >
                                Choisir un modèle
                            </span>
                            <InputSelect
                                value={selectedTemplate}
                                onChange={(value) => {
                                    const newValue = value ?? "empty"
                                    setSelectedTemplate(newValue)
                                    setIsTemplateReady(false)
                                    form.setValue("entryLines", [])
                                }}
                                options={entryTemplates.map((template) => ({
                                    key: template.key,
                                    label: template.label,
                                }))}
                                placeholder="Sélectionner un modèle"
                            />
                        </FormItem>
                        {activeTemplate === undefined || activeTemplate.key === "empty" ? null : (
                            <div
                                className={css({
                                    paddingLeft: "2rem",
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                })}
                            >
                                {activeTemplate?.formComponent({
                                    form,
                                    idOrganization: props.idOrganization,
                                    idYear: props.idYear,
                                    onTemplateReadyChange: setIsTemplateReady,
                                })}
                            </div>
                        )}
                    </FormGroup>
                </Fragment>
            )}
        </FormRoot>
    )
}

export function CreateOneEntry(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
    children: JSX.Element
}) {
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
            onClick={() =>
                openPanel(
                    <CreateOneEntryPanel idOrganization={props.idOrganization} idYear={props.idYear} />,
                    "Ajouter une écriture",
                )
            }
        >
            {props.children}
        </Button>
    )
}
