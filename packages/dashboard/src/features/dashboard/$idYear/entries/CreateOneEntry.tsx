import {
    addOneEntryTagRouteDefinition,
    createOneEntryFromTemplateRouteDefinition,
    readAllEntriesRouteDefinition,
    readAllEntryTagsRouteDefinition,
    readAllFilesRouteDefinition,
    readAllJournalsRouteDefinition,
    readAllScenariosRouteDefinition,
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
import { FormItem } from "../../../../components/forms/FormItem.js"
import { FormLabel } from "../../../../components/forms/FormLabel.js"
import { FormRoot } from "../../../../components/forms/FormRoot.js"
import { InputDataCombobox } from "../../../../components/InputDataCombobox.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { applicationRouter } from "../../../../routes/applicationRouter.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"
import { useDataFromAPI } from "../../../../utilities/useHTTPData.js"
import { ScenarioEntryForm } from "./entryTemplates/ScenarioEntryForm.js"

/** Manual entry: free label, journal/file/tags, no pre-filled lines. */
function ManualEntryForm(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
}) {
    const { closePanel } = useRightPanel()
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
                </Fragment>
            )}
        </FormRoot>
    )
}

function CreateOneEntryPanel(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
}) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>("empty")

    // The template catalog is the documented scenario list (same source as the
    // website documentation), so every documented template is selectable.
    const scenariosResponse = useDataFromAPI({
        routeDefinition: readAllScenariosRouteDefinition,
        body: {
            idYear: props.idYear,
        },
    })

    return (
        <div
            className={css({
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
            })}
        >
            <div
                className={css({
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                })}
            >
                <span
                    className={css({
                        fontSize: "sm",
                        fontWeight: "semibold",
                    })}
                >
                    Modèle d'écriture
                </span>
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
                    onChange={(value) => setSelectedTemplate(value ?? "empty")}
                    options={[
                        {
                            key: "empty",
                            label: "Écriture vide",
                        },
                        ...(scenariosResponse.data ?? []).map((scenario) => ({
                            key: scenario.scenario,
                            label: scenario.title,
                        })),
                    ]}
                    placeholder="Sélectionner un modèle"
                    isLoading={scenariosResponse.isPending}
                />
            </div>
            {selectedTemplate === "empty" ? (
                <ManualEntryForm
                    idOrganization={props.idOrganization}
                    idYear={props.idYear}
                />
            ) : (
                <ScenarioEntryForm
                    key={selectedTemplate}
                    scenario={selectedTemplate}
                    idOrganization={props.idOrganization}
                    idYear={props.idYear}
                />
            )}
        </div>
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
                    <CreateOneEntryPanel
                        idOrganization={props.idOrganization}
                        idYear={props.idYear}
                    />,
                    "Ajouter une écriture",
                )
            }
        >
            {props.children}
        </Button>
    )
}
