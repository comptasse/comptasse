import type { readAllEntriesRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { FormatNull, FormatPrice, FormatText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPencil } from "@tabler/icons-react"
import { useMemo } from "react"
import type * as v from "valibot"
import { DataTable } from "../../../../components/layouts/dataTable/DataTable.js"
import type { YearDataMaps } from "../YearDataWrapper.tsx"
import { EntriesTableSelectionActions } from "./EntriesTableSelectionActions.js"
import { buildEntriesTableColumns } from "./entriesTableColumns.js"

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
    matchingById: YearDataMaps["matchingById"]
}) {
    const entriesData = useMemo(
        () => props.entries.toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [
            props.entries,
        ],
    )

    const linesByEntry = props.entryLinesByEntryId
    const accountsMap = props.accountById
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

    const columns = useMemo(
        () =>
            buildEntriesTableColumns({
                idOrganization: props.idOrganization,
                journalsMap: props.journalById,
                tagsMap: props.tagById,
                tagsByEntry,
                filesMap: props.fileById,
            }),
        [
            props.idOrganization,
            props.journalById,
            props.tagById,
            tagsByEntry,
            props.fileById,
        ],
    )

    return (
        <DataTable
            data={entriesData}
            isLoading={false}
            pageSize={100}
            showPageSizeControl={true}
            virtualize={true}
            estimateRowHeight={56}
            persistKey="entries"
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
            columns={columns}
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
                // Movements are always shown sorted by account number.
                const sortedRows = rows.toSorted((a, b) =>
                    (accountsMap.get(a.idAccount)?.number ?? "").localeCompare(
                        accountsMap.get(b.idAccount)?.number ?? "",
                        undefined,
                        {
                            numeric: true,
                        },
                    ),
                )
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
                                    Lettrage
                                </th>
                                <th
                                    className={css({
                                        padding: "0.5rem 0.75rem",
                                        width: "1%",
                                        whiteSpace: "nowrap",
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
                                        padding: "0.5rem 0.75rem",
                                        width: "1%",
                                        whiteSpace: "nowrap",
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
                            {sortedRows.map((entryLine) => {
                                const account = accountsMap.get(entryLine.idAccount)
                                const matching = entryLine.idMatching
                                    ? props.matchingById.get(entryLine.idMatching)
                                    : undefined
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
                                            {matching ? <FormatText>{matching.code}</FormatText> : <FormatNull />}
                                        </td>
                                        <td
                                            className={css({
                                                padding: "0.5rem 0.75rem",
                                                whiteSpace: "nowrap",
                                                textAlign: "right",
                                            })}
                                        >
                                            <FormatPrice
                                                price={entryLine.debit}
                                                className={{
                                                    fontSize: "xs",
                                                }}
                                            />
                                        </td>
                                        <td
                                            className={css({
                                                padding: "0.5rem 0.75rem",
                                                whiteSpace: "nowrap",
                                                textAlign: "right",
                                            })}
                                        >
                                            <FormatPrice
                                                price={entryLine.credit}
                                                className={{
                                                    fontSize: "xs",
                                                }}
                                            />
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
