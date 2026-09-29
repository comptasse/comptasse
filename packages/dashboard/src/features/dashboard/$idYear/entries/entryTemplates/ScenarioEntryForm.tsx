import {
    executeScenarioRouteDefinition,
    readAllEntriesRouteDefinition,
    readAllEntryLinesRouteDefinition,
    readOneScenarioRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import {
    Button,
    ButtonPlainContent,
    CircularLoader,
    FormatError,
    InputDate,
    InputSelect,
    InputSwitch,
    InputText,
    toast,
} from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import { type ReactNode, useState } from "react"
import type * as v from "valibot"
import { useRightPanel } from "../../../../../contexts/rightPanel/RightPanelContext.js"
import { applicationRouter } from "../../../../../routes/applicationRouter.js"
import { getResponseBodyFromAPI } from "../../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../../utilities/invalidateData.js"
import { useDataFromAPI } from "../../../../../utilities/useHTTPData.js"
import { JournalSelect } from "../../yearSettings/journals/JournalSelect.tsx"
import { scenarioChoiceLabel, scenarioParamLabel } from "./scenarioParamLabels.js"

type Scenario = v.InferOutput<typeof readOneScenarioRouteDefinition.schemas.return>
type ScenarioParam = Scenario["params"][number]

function Field(props: { label: string; required?: boolean; children: ReactNode }) {
    return (
        <div
            className={css({
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
            })}
        >
            <span
                className={css({
                    fontSize: "sm",
                    fontWeight: "semibold",
                })}
            >
                {props.label}
                {props.required === true ? " *" : ""}
            </span>
            {props.children}
        </div>
    )
}

function ScenarioParamInput(props: { param: ScenarioParam; value: unknown; onChange: (value: unknown) => void }) {
    if (props.param.type === "choice") {
        return (
            <InputSelect
                value={props.value === undefined || props.value === null ? null : String(props.value)}
                onChange={(value) => props.onChange(value ?? "")}
                options={(props.param.choices ?? []).map((choice) => ({
                    key: choice,
                    label: scenarioChoiceLabel(choice),
                }))}
                placeholder="Sélectionner"
            />
        )
    }

    if (props.param.type === "boolean") {
        return (
            <InputSwitch
                value={props.value === true}
                onChange={(value) => props.onChange(value)}
            />
        )
    }

    return (
        <InputText
            value={props.value === undefined || props.value === null ? "" : String(props.value)}
            onChange={(value) => props.onChange(value)}
        />
    )
}

function initialParams(scenario: Scenario): Record<string, unknown> {
    const initial: Record<string, unknown> = {}
    for (const param of scenario.params) {
        const fromSample = scenario.sample.params[param.name]
        initial[param.name] = fromSample ?? param.default ?? (param.type === "boolean" ? false : "")
    }
    return initial
}

/** Form body, mounted once the scenario description is loaded. */
function ScenarioEntryFormFields(props: {
    scenario: Scenario
    scenarioSlug: string
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
}) {
    const { closePanel } = useRightPanel()
    const [idJournal, setIdJournal] = useState<string | null>(null)
    const [date, setDate] = useState<string>(() => new Date().toISOString())
    const [params, setParams] = useState<Record<string, unknown>>(() => initialParams(props.scenario))
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function onSubmit() {
        if (!idJournal) {
            toast({
                title: "Sélectionnez un journal",
                variant: "error",
            })
            return
        }

        const builtParams: Record<string, unknown> = {}
        for (const param of props.scenario.params) {
            const value = params[param.name]
            const isEmpty = value === undefined || value === null || value === ""
            if (isEmpty) {
                if (param.required) {
                    toast({
                        title: `Le paramètre « ${scenarioParamLabel(param.name)} » est requis`,
                        variant: "error",
                    })
                    return
                }
                // Optional: omit so the server-side schema default applies.
                continue
            }
            if (param.type === "number") {
                builtParams[param.name] = Number(value)
            } else if (param.type === "boolean") {
                builtParams[param.name] = Boolean(value)
            } else {
                builtParams[param.name] = String(value)
            }
        }

        setIsSubmitting(true)
        try {
            const response = await getResponseBodyFromAPI({
                routeDefinition: executeScenarioRouteDefinition,
                body: {
                    idYear: props.idYear,
                    idJournal,
                    date,
                    params: builtParams,
                    isIdempotent: true,
                },
                params: {
                    idOrganization: props.idOrganization,
                    idYear: props.idYear,
                    scenario: props.scenarioSlug,
                },
            })
            if (response.ok === false) {
                toast({
                    title: "Impossible de créer l'écriture",
                    variant: "error",
                })
                return
            }

            await Promise.all([
                invalidateData({
                    routeDefinition: readAllEntriesRouteDefinition,
                    body: {
                        idYear: props.idYear,
                    },
                }),
                invalidateData({
                    routeDefinition: readAllEntryLinesRouteDefinition,
                    body: {
                        idYear: props.idYear,
                    },
                }),
            ])

            toast({
                title: "Écriture créée avec succès",
                variant: "success",
            })

            const created = response.data.entries
            if (created.length === 1) {
                applicationRouter.navigate({
                    to: "/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry",
                    params: {
                        idOrganization: props.idOrganization,
                        idYear: props.idYear,
                        idEntry: created[0].entry.id,
                    },
                })
            }
            closePanel()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className={css({
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
            })}
        >
            <span
                className={css({
                    fontSize: "xs",
                    color: "neutral/50",
                })}
            >
                {props.scenario.description}
            </span>
            <Field label="Journal">
                <JournalSelect
                    idOrganization={props.idOrganization}
                    idYear={props.idYear}
                    value={idJournal}
                    onChange={(value) => setIdJournal(value ?? null)}
                />
            </Field>
            <Field label="Date">
                <InputDate
                    value={date}
                    onChange={(value) => setDate(value ?? "")}
                />
            </Field>
            {props.scenario.params.map((param) => (
                <Field
                    key={param.name}
                    label={scenarioParamLabel(param.name)}
                    required={param.required}
                >
                    <ScenarioParamInput
                        param={param}
                        value={params[param.name]}
                        onChange={(value) =>
                            setParams((previous) => ({
                                ...previous,
                                [param.name]: value,
                            }))
                        }
                    />
                </Field>
            ))}
            <div
                className={css({
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                })}
            >
                <Button
                    type="button"
                    hasLoader={isSubmitting}
                    isDisabled={isSubmitting}
                    onClick={onSubmit}
                >
                    <ButtonPlainContent
                        leftIcon={<IconPlus />}
                        text="Ajouter l'écriture"
                    />
                </Button>
            </div>
        </div>
    )
}

/**
 * Generic form for a documented accounting scenario. The parameters and their
 * defaults come from the API (`read-one-scenario`), which is the same source the
 * website documentation renders, so every documented template is supported.
 */
export function ScenarioEntryForm(props: {
    scenario: string
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
}) {
    const scenarioResponse = useDataFromAPI({
        routeDefinition: readOneScenarioRouteDefinition,
        body: {},
        params: {
            idOrganization: props.idOrganization,
            idYear: props.idYear,
            scenario: props.scenario,
        },
    })

    if (scenarioResponse.isPending) {
        return (
            <CircularLoader
                text="Chargement du modèle..."
                className={{
                    padding: "1rem",
                }}
            />
        )
    }

    if (scenarioResponse.isError || scenarioResponse.data === undefined) {
        return (
            <FormatError
                text="Erreur lors du chargement du modèle."
                className={{
                    padding: "1rem",
                }}
            />
        )
    }

    return (
        <ScenarioEntryFormFields
            scenario={scenarioResponse.data}
            scenarioSlug={props.scenario}
            idOrganization={props.idOrganization}
            idYear={props.idYear}
        />
    )
}
