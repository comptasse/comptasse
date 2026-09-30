import type { readAllEntriesRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, FormatDate, FormatDateTime, FormatNull, FormatPrice, FormatText, LinkContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPencil } from "@tabler/icons-react"
import { useRouter } from "@tanstack/react-router"
import { useMemo } from "react"
import type * as v from "valibot"
import { DataTable } from "../../../../components/layouts/dataTable/DataTable.js"
import type { YearDataMaps } from "../YearDataWrapper.tsx"
import { EntriesTableSelectionActions } from "./EntriesTableSelectionActions.js"

export function EntriesTable(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
    entries: v.InferOutput<typeof readAllEntriesRouteDefinition.schemas.return>
    accountById: YearDataMaps["accountById"]
    entryLinesByEntryId: YearDataMaps["entryLinesByEntryId"]
    entryTagsByEntryId: YearDataMaps["entryTagsByEntryId"]
    journalById: YearDataMaps["journalById"]
    tagById: YearDataMaps["tagById"]
    fileById: YearDataMaps["fileById"]
}) {
    const router = useRouter()
    const entriesData = useMemo(
        () =>
            [
                ...props.entries,
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [
            props.entries,
        ],
    )

    const linesByEntry = props.entryLinesByEntryId
    const journalsMap = props.journalById
    const tagsMap = props.tagById
    const tagsByEntry = useMemo(() => {
        const m = new Map<string, string[]>()
        for (const [entryId, ets] of props.entryTagsByEntryId) {
            m.set(
                entryId,
                ets.map((et) => et.idTag),
            )
        }
        return m
    }, [
        props.entryTagsByEntryId,
    ])
    const filesMap = props.fileById
    const accountsMap = props.accountById

    return (
        <DataTable
            data={entriesData}
            isLoading={false}
            pageSize={100}
            showPageSizeControl={true}
            virtualize={true}
            estimateRowHeight={56}
            enableRowSelection={true}
            getRowId={(row) => row.id}
            selectionActions={(selectedRows) => (
                <EntriesTableSelectionActions
                    selectedRows={selectedRows}
                    idYear={props.idYear}
                />
            )}
            emptyStateProps={{
                icon: <IconPencil />,
                title: "Aucune écriture",
                subtitle: "Les écritures de votre exercice apparaîtront ici.",
            }}
            columns={[
                {
                    accessorKey: "label",
                    header: "Libellé",
                    cell: ({ row }) => (
                        <Button
                            onClick={() =>
                                router.navigate({
                                    to: "/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry",
                                    params: {
                                        idOrganization: row.original.idOrganization,
                                        idYear: row.original.idYear,
                                        idEntry: row.original.id,
                                    },
                                })
                            }
                        >
                            <LinkContent>{row.original.label}</LinkContent>
                        </Button>
                    ),
                    filterFn: "includesString",
                },
                {
                    accessorKey: "date",
                    header: "Date",
                    cell: ({ row }) => <FormatDate date={row.original.date} />,
                    filterFn: "includesString",
                },
                {
                    accessorKey: "idJournal",
                    header: "Journal",
                    cell: ({ row }) => {
                        if (row.original.idJournal === null) return <FormatNull />
                        const journal = journalsMap.get(row.original.idJournal)
                        if (!journal) return <FormatNull />
                        return <FormatText>{journal.code}</FormatText>
                    },
                    filterFn: "includesString",
                },
                {
                    accessorKey: "id",
                    id: "tags",
                    header: "Catégorie",
                    cell: ({ row }) => {
                        const tagIds = tagsByEntry.get(row.original.id)
                        if (!tagIds || tagIds.length === 0) return <FormatNull />
                        const tagLabels = tagIds
                            .map((id) => tagsMap.get(id))
                            .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
                            .map((tag) => tag.label)
                        if (tagLabels.length === 0) return <FormatNull />
                        return <FormatText>{tagLabels.join(", ")}</FormatText>
                    },
                    filterFn: "includesString",
                },
                {
                    accessorKey: "idFile",
                    header: "Pièce justificative",
                    cell: ({ row }) => {
                        if (row.original.idFile === null) return <FormatNull />
                        const file = filesMap.get(row.original.idFile)
                        if (!file) return <FormatNull />
                        return (
                            <Button
                                onClick={() =>
                                    router.navigate({
                                        to: "/organisation/$idOrganization/fichier/$idFile",
                                        params: {
                                            idOrganization: props.idOrganization,
                                            idFile: file.id,
                                        },
                                    })
                                }
                            >
                                <LinkContent>{file.name}</LinkContent>
                            </Button>
                        )
                    },
                    filterFn: "includesString",
                },
                {
                    accessorKey: "createdAt",
                    header: "Ajouté le",
                    cell: ({ row }) => <FormatDateTime date={row.original.createdAt} />,
                    filterFn: "includesString",
                },
                {
                    accessorKey: "lastUpdatedAt",
                    header: "Dernière mise à jour le",
                    cell: ({ row }) => <FormatDateTime date={row.original.lastUpdatedAt} />,
                    filterFn: "includesString",
                },
            ]}
            renderSubComponent={({ row }) => {
                const rows = linesByEntry.get(row.original.id)
                if (!rows || rows.length === 0) {
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
                    <table
                        className={css({
                            width: "100%",
                            borderCollapse: "collapse",
                        })}
                    >
                        <thead>
                            <tr>
                                <th
                                    className={css({
                                        padding: "0.5rem 1rem",
                                        fontSize: "xs",
                                        fontWeight: "semibold",
                                        color: "neutral/40",
                                        textAlign: "left",
                                    })}
                                >
                                    Compte
                                </th>
                                <th
                                    className={css({
                                        padding: "0.5rem 1rem",
                                        fontSize: "xs",
                                        fontWeight: "semibold",
                                        color: "neutral/40",
                                        textAlign: "left",
                                    })}
                                >
                                    Libellé
                                </th>
                                <th
                                    className={css({
                                        padding: "0.5rem 1rem",
                                        fontSize: "xs",
                                        fontWeight: "semibold",
                                        color: "neutral/40",
                                        textAlign: "right",
                                    })}
                                >
                                    Débit
                                </th>
                                <th
                                    className={css({
                                        padding: "0.5rem 1rem",
                                        fontSize: "xs",
                                        fontWeight: "semibold",
                                        color: "neutral/40",
                                        textAlign: "right",
                                    })}
                                >
                                    Crédit
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((entryLine) => {
                                const account = accountsMap.get(entryLine.idAccount)
                                return (
                                    <tr
                                        key={entryLine.id}
                                        className={css({
                                            borderTop: "1px solid",
                                            borderTopColor: "neutral/5",
                                        })}
                                    >
                                        <td
                                            className={css({
                                                padding: "0.5rem 1rem",
                                            })}
                                        >
                                            {account ? (
                                                <div
                                                    className={css({
                                                        display: "flex",
                                                        justifyContent: "flex-start",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                    })}
                                                >
                                                    <FormatText
                                                        className={{
                                                            overflow: "visible",
                                                        }}
                                                    >
                                                        {account.number}
                                                    </FormatText>
                                                    <FormatText
                                                        wrap={true}
                                                        className={{
                                                            color: "neutral/50",
                                                        }}
                                                    >
                                                        {account.label}
                                                    </FormatText>
                                                </div>
                                            ) : (
                                                <FormatNull />
                                            )}
                                        </td>
                                        <td
                                            className={css({
                                                padding: "0.5rem 1rem",
                                            })}
                                        >
                                            <FormatText>{entryLine.label}</FormatText>
                                        </td>
                                        <td
                                            className={css({
                                                padding: "0.5rem 1rem",
                                                textAlign: "right",
                                            })}
                                        >
                                            <FormatPrice price={entryLine.debit} />
                                        </td>
                                        <td
                                            className={css({
                                                padding: "0.5rem 1rem",
                                                textAlign: "right",
                                            })}
                                        >
                                            <FormatPrice price={entryLine.credit} />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )
            }}
        />
    )
}
