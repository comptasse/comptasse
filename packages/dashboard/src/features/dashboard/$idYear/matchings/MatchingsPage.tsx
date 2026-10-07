import {
    deleteOneMatchingRouteDefinition,
    readAllEntryLinesRouteDefinition,
    readAllMatchingsRouteDefinition,
    updateOneMatchingRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import {
    Button,
    ButtonOutlineContent,
    ButtonPlainContent,
    FormatDateTime,
    FormatNull,
    FormatPrice,
    FormatText,
    InputText,
    toast,
} from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconLink, IconPencil, IconTrash } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import type * as v from "valibot"
import { DataTable } from "../../../../components/layouts/dataTable/DataTable.js"
import { Page } from "../../../../components/layouts/page/page.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"
import { type YearDataKey, type YearDataMaps, YearDataWrapper } from "../YearDataWrapper.tsx"

type Matching = v.InferOutput<typeof returnedSchemas.matching>
type EntryLine = v.InferOutput<typeof returnedSchemas.entryLine>

type MatchingRow = Matching & {
    lines: Array<EntryLine>
    totalDebit: number
    totalCredit: number
}

/** Right-panel form to rename a matching's code. */
function EditMatchingForm(props: { idYear: string; matching: Matching }) {
    const { closePanel } = useRightPanel()
    // The panel is intentionally uncontrolled: it captures the code once and edits it. A different matching opens a fresh
    // panel (see the `key` at the call site), so the initial value never needs to re-sync.
    // react-doctor-disable-next-line react-doctor/no-derived-useState
    const [code, setCode] = useState(props.matching.code)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function save() {
        setIsSubmitting(true)
        try {
            const response = await getResponseBodyFromAPI({
                routeDefinition: updateOneMatchingRouteDefinition,
                body: {
                    idYear: props.idYear,
                    idMatching: props.matching.id,
                    code: code.trim(),
                },
            })
            if (response.ok === false) {
                toast({
                    title: "Impossible de modifier le lettrage",
                    variant: "error",
                })
                return
            }
            await invalidateData({
                routeDefinition: readAllMatchingsRouteDefinition,
                body: {
                    idYear: props.idYear,
                },
            })
            toast({
                title: "Lettrage modifié",
                variant: "success",
            })
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
            <InputText
                value={code}
                onChange={(value) => setCode(value ?? "")}
                placeholder="Code du lettrage"
            />
            <Button
                hasLoader={isSubmitting}
                onClick={save}
            >
                <ButtonPlainContent text="Enregistrer" />
            </Button>
        </div>
    )
}

function MatchingsTable(props: {
    idYear: string
    matchings: Array<Matching>
    linesByMatchingId: Map<string, Array<EntryLine>>
    accountById: YearDataMaps["accountById"]
    entryById: YearDataMaps["entryById"]
}) {
    const { openPanel } = useRightPanel()
    const [submittingId, setSubmittingId] = useState<string | null>(null)

    async function remove(idMatching: string) {
        setSubmittingId(idMatching)
        try {
            const response = await getResponseBodyFromAPI({
                routeDefinition: deleteOneMatchingRouteDefinition,
                body: {
                    idYear: props.idYear,
                    idMatching: idMatching,
                },
            })
            if (response.ok === false) {
                toast({
                    title: "Impossible de supprimer le lettrage",
                    variant: "error",
                })
                return
            }
            await Promise.all([
                invalidateData({
                    routeDefinition: readAllMatchingsRouteDefinition,
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
                title: "Lettrage supprimé",
                variant: "success",
            })
        } finally {
            setSubmittingId(null)
        }
    }

    const data = useMemo<Array<MatchingRow>>(
        () =>
            props.matchings
                .toSorted((a, b) => a.code.localeCompare(b.code))
                .map((matching) => {
                    const lines = props.linesByMatchingId.get(matching.id) ?? []
                    return {
                        ...matching,
                        lines: lines,
                        totalDebit: lines.reduce((sum, line) => sum + Number(line.debit), 0),
                        totalCredit: lines.reduce((sum, line) => sum + Number(line.credit), 0),
                    }
                }),
        [
            props.matchings,
            props.linesByMatchingId,
        ],
    )

    return (
        <DataTable
            data={data}
            isLoading={false}
            pageSize={100}
            showPageSizeControl={true}
            persistKey="matchings"
            getRowId={(row) => row.id}
            emptyStateProps={{
                icon: <IconLink />,
                title: "Aucun lettrage",
                subtitle: "Les lettrages de votre exercice apparaîtront ici.",
            }}
            columns={[
                {
                    accessorKey: "code",
                    header: "Lettre",
                    cell: ({ row }) => <FormatText>{row.original.code}</FormatText>,
                    filterFn: "includesString",
                },
                {
                    accessorKey: "idAccount",
                    header: "Compte",
                    cell: ({ row }) => {
                        const account = props.accountById.get(row.original.idAccount)
                        if (!account) return <FormatNull />
                        return <FormatText>{`${account.number} ${account.label}`}</FormatText>
                    },
                    filterFn: "includesString",
                },
                {
                    accessorKey: "lines",
                    header: "Mouvements",
                    cell: ({ row }) => <FormatText>{String(row.original.lines.length)}</FormatText>,
                    filterFn: "includesString",
                },
                {
                    accessorKey: "totalDebit",
                    header: "Débit",
                    cell: ({ row }) => <FormatPrice price={row.original.totalDebit} />,
                    filterFn: "includesString",
                },
                {
                    accessorKey: "totalCredit",
                    header: "Crédit",
                    cell: ({ row }) => <FormatPrice price={row.original.totalCredit} />,
                    filterFn: "includesString",
                },
                {
                    accessorKey: "createdAt",
                    header: "Créé le",
                    cell: ({ row }) => <FormatDateTime date={row.original.createdAt} />,
                    filterFn: "includesString",
                },
                {
                    accessorKey: "actions",
                    header: " ",
                    enableSorting: false,
                    cell: ({ row }) => (
                        <div
                            className={css({
                                display: "flex",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                gap: "0.25rem",
                            })}
                        >
                            <Button
                                onClick={() =>
                                    openPanel(
                                        <EditMatchingForm
                                            key={row.original.id}
                                            idYear={props.idYear}
                                            matching={row.original}
                                        />,
                                        "Modifier le lettrage",
                                    )
                                }
                            >
                                <ButtonOutlineContent
                                    leftIcon={<IconPencil />}
                                    text={undefined}
                                />
                            </Button>
                            <Button
                                hasLoader={submittingId === row.original.id}
                                onClick={() => remove(row.original.id)}
                            >
                                <ButtonOutlineContent
                                    color="danger"
                                    leftIcon={<IconTrash />}
                                    text={undefined}
                                />
                            </Button>
                        </div>
                    ),
                },
            ]}
            renderSubComponent={({ row }) => {
                const lines = row.original.lines
                if (lines.length === 0) {
                    return (
                        <FormatNull
                            text="Aucun mouvement"
                            className={{
                                padding: "1rem",
                            }}
                        />
                    )
                }
                return (
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                            padding: "0.5rem 1rem",
                        })}
                    >
                        {lines.map((line) => {
                            const account = props.accountById.get(line.idAccount)
                            const entry = props.entryById.get(line.idEntry)
                            return (
                                <div
                                    key={line.id}
                                    className={css({
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "1rem",
                                    })}
                                >
                                    <FormatText
                                        className={{
                                            width: "100%",
                                        }}
                                    >
                                        {account ? `${account.number} ${account.label}` : ""}
                                    </FormatText>
                                    <FormatText
                                        className={{
                                            color: "neutral/50",
                                            width: "100%",
                                        }}
                                    >
                                        {entry?.label ?? ""}
                                    </FormatText>
                                    <FormatPrice price={line.debit} />
                                    <FormatPrice price={line.credit} />
                                </div>
                            )
                        })}
                    </div>
                )
            }}
        />
    )
}

const requiredKeys = [
    "matchings",
    "entryLines",
    "entries",
    "accounts",
] as const satisfies readonly YearDataKey[]

export function MatchingsPage({
    idOrganization: _idOrganizationProp,
    idYear: idYearProp,
}: {
    idOrganization?: string
    idYear?: string
}) {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization?: string
        idYear?: string
    }
    const idYear = idYearProp ?? params.idYear ?? ""

    return (
        <Page.Root>
            <Page.Content>
                <YearDataWrapper
                    idYear={idYear}
                    requiredKeys={requiredKeys}
                >
                    {({ matchings, entryLines, accountById, entryById }) => {
                        const linesByMatchingId = new Map<string, Array<EntryLine>>()
                        for (const entryLine of entryLines) {
                            if (entryLine.idMatching === null) continue
                            const lines = linesByMatchingId.get(entryLine.idMatching) ?? []
                            lines.push(entryLine)
                            linesByMatchingId.set(entryLine.idMatching, lines)
                        }

                        return (
                            <MatchingsTable
                                idYear={idYear}
                                matchings={matchings}
                                linesByMatchingId={linesByMatchingId}
                                accountById={accountById}
                                entryById={entryById}
                            />
                        )
                    }}
                </YearDataWrapper>
            </Page.Content>
        </Page.Root>
    )
}
