import {
    readAllAccountsRouteDefinition,
    type readAllEntriesRouteDefinition,
    type readAllEntryLinesRouteDefinition,
    readAllJournalsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { formatDate, formatPrice, InputDate, toast } from "@comptasse/ui"
import { IconDownload } from "@tabler/icons-react"
import { useMemo } from "react"
import * as v from "valibot"
import { FormControl } from "../../../../components/forms/FormControl.js"
import { FormError } from "../../../../components/forms/FormError.js"
import { FormField } from "../../../../components/forms/FormField.js"
import { FormGroup } from "../../../../components/forms/FormGroup.js"
import { FormItem } from "../../../../components/forms/FormItem.js"
import { FormLabel } from "../../../../components/forms/FormLabel.js"
import { FormRoot } from "../../../../components/forms/FormRoot.js"
import { InputDataCombobox } from "../../../../components/InputDataCombobox.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"

function escapeCsvValue(value: string): string {
    if (value.includes(";") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

export function ExportEntryLines(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
    entries: v.InferOutput<typeof readAllEntriesRouteDefinition.schemas.return>
    entryLines: v.InferOutput<typeof readAllEntryLinesRouteDefinition.schemas.return>
}) {
    const { closePanel } = useRightPanel()
    const entriesMap = useMemo(() => {
        return new Map(
            props.entries.map((r) => [
                r.id,
                r,
            ]),
        )
    }, [
        props.entries,
    ])

    return (
        <FormRoot
            schema={v.object({
                idJournal: v.nullable(v.pipe(v.string())),
                idAccount: v.nullable(v.pipe(v.string())),
                dateFrom: v.nullable(v.pipe(v.string())),
                dateTo: v.nullable(v.pipe(v.string())),
            })}
            defaultValues={{
                idJournal: null,
                idAccount: null,
                dateFrom: null,
                dateTo: null,
            }}
            submitButtonProps={{
                leftIcon: <IconDownload />,
                text: "Exporter en CSV",
            }}
            onSubmit={async (data) => {
                const filteredRows = props.entryLines.filter((row) => {
                    const entry = entriesMap.get(row.idEntry)
                    if (!entry) return false

                    if (data.idJournal && entry.idJournal !== data.idJournal) return false
                    if (data.idAccount && row.idAccount !== data.idAccount) return false
                    if (data.dateFrom && entry.date < data.dateFrom) return false
                    if (data.dateTo && entry.date > data.dateTo) return false

                    return true
                })

                if (filteredRows.length === 0) {
                    toast({
                        title: "Aucun mouvement à exporter",
                        variant: "warning",
                    })
                    return false
                }

                const [accountsResponse, journalsResponse] = await Promise.all([
                    getResponseBodyFromAPI({
                        routeDefinition: readAllAccountsRouteDefinition,
                        body: {
                            idYear: props.idYear,
                        },
                    }),
                    getResponseBodyFromAPI({
                        routeDefinition: readAllJournalsRouteDefinition,
                        body: {
                            idYear: props.idYear,
                        },
                    }),
                ])

                if (!accountsResponse.ok || !journalsResponse.ok) {
                    toast({
                        title: "Impossible de charger les données",
                        variant: "error",
                    })
                    return false
                }

                const accountsMap = new Map(
                    accountsResponse.data.map((a) => [
                        a.id,
                        {
                            number: a.number,
                            label: a.label,
                        },
                    ]),
                )
                const journalsMap = new Map(
                    journalsResponse.data.map((j) => [
                        j.id,
                        {
                            code: j.code,
                            label: j.label,
                        },
                    ]),
                )

                const headers = [
                    "Date",
                    "Code journal",
                    "Libellé journal",
                    "Libellé écriture",
                    "N° compte",
                    "Libellé compte",
                    "Débit",
                    "Crédit",
                ]

                const rows = filteredRows
                    .map((row) => {
                        const entry = entriesMap.get(row.idEntry)
                        if (!entry) return null

                        const account = accountsMap.get(row.idAccount)
                        const journal = entry.idJournal ? journalsMap.get(entry.idJournal) : null

                        return [
                            formatDate(entry.date) ?? "",
                            journal?.code ?? "",
                            journal?.label ?? "",
                            entry.label,
                            account?.number ?? "",
                            account?.label ?? "",
                            formatPrice({
                                price: row.debit,
                            }),
                            formatPrice({
                                price: row.credit,
                            }),
                        ].map(escapeCsvValue)
                    })
                    .filter((row) => row !== null)

                const csvContent = [
                    headers.map(escapeCsvValue).join(";"),
                    ...rows.map((r) => r.join(";")),
                ].join("\n")

                const BOM = "\uFEFF"
                const blob = new Blob(
                    [
                        BOM + csvContent,
                    ],
                    {
                        type: "text/csv;charset=utf-8;",
                    },
                )
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = `ecritures-${new Date().toISOString().slice(0, 10)}.csv`
                link.click()
                URL.revokeObjectURL(url)

                toast({
                    title: `${filteredRows.length} mouvements exportés`,
                    variant: "success",
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                closePanel()
            }}
        >
            {(form) => (
                <FormGroup title="Filtres">
                    <FormField
                        control={form.control}
                        name="idJournal"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Journal"
                                    isRequired={false}
                                    description={undefined}
                                    tooltip={undefined}
                                />
                                <FormControl>
                                    <InputDataCombobox
                                        value={field.value}
                                        onChange={field.onChange}
                                        routeDefinition={readAllJournalsRouteDefinition}
                                        body={{
                                            idYear: props.idYear,
                                        }}
                                        placeholder="Tous les journaux"
                                        getOption={(journal) => ({
                                            key: journal.id,
                                            label: `(${journal.code}) ${journal.label ?? ""}`,
                                        })}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="idAccount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Compte"
                                    isRequired={false}
                                    description={undefined}
                                    tooltip={undefined}
                                />
                                <FormControl>
                                    <InputDataCombobox
                                        value={field.value}
                                        onChange={field.onChange}
                                        routeDefinition={readAllAccountsRouteDefinition}
                                        body={{
                                            idYear: props.idYear,
                                        }}
                                        placeholder="Tous les comptes"
                                        getOption={(account) => ({
                                            key: account.id,
                                            label: `${account.number} - ${account.label}`,
                                        })}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dateFrom"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Date de début"
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
                    <FormField
                        control={form.control}
                        name="dateTo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Date de fin"
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
                </FormGroup>
            )}
        </FormRoot>
    )
}
