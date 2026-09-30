import type { readAllAccountsRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { ButtonGhostContent, FormatDateTime, FormatNull, FormatPrice, FormatText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconEye, IconLink, IconPencil, IconTrash } from "@tabler/icons-react"
import type * as v from "valibot"
import { DataTable } from "../../../../../components/layouts/dataTable/DataTable.tsx"
import type { YearDataMaps } from "../../YearDataWrapper.tsx"
import { DeleteOneEntryLine } from "./$idEntryLine/DeleteOneEntryLine.tsx"
import { EntryLineMatching } from "./$idEntryLine/EntryLineMatching.tsx"
import { UpdateOneEntryLine } from "./$idEntryLine/UpdateOneEntryLine.tsx"
import { ViewOneEntryLine } from "./$idEntryLine/ViewOneEntryLine.tsx"

export function EntryLinesTable(props: {
    entry: v.InferOutput<typeof returnedSchemas.entry>
    entryLines: Array<v.InferOutput<typeof returnedSchemas.entryLine>>
    accounts: Map<string, v.InferOutput<typeof readAllAccountsRouteDefinition.schemas.return>[number]>
    matchingById: YearDataMaps["matchingById"]
    isLoading?: boolean
}) {
    return (
        <DataTable
            data={props.entryLines}
            isLoading={false}
            persistKey="entry-lines"
            columns={[
                {
                    accessorKey: "actions",
                    header: " ",
                    cell: ({ row }) => (
                        <div
                            className={css({
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            })}
                        >
                            <UpdateOneEntryLine entryLine={row.original}>
                                <ButtonGhostContent
                                    leftIcon={<IconPencil />}
                                    text={undefined}
                                />
                            </UpdateOneEntryLine>
                            <ViewOneEntryLine entryLine={row.original}>
                                <ButtonGhostContent
                                    leftIcon={<IconEye />}
                                    text={undefined}
                                />
                            </ViewOneEntryLine>
                            <EntryLineMatching
                                entryLine={row.original}
                                matchings={Array.from(props.matchingById.values())}
                            >
                                <ButtonGhostContent
                                    leftIcon={<IconLink />}
                                    text={undefined}
                                />
                            </EntryLineMatching>
                            <DeleteOneEntryLine entryLine={row.original}>
                                <ButtonGhostContent
                                    leftIcon={<IconTrash />}
                                    text={undefined}
                                    color="danger"
                                />
                            </DeleteOneEntryLine>
                        </div>
                    ),
                    enableSorting: false,
                    enableGlobalFilter: false,
                },
                {
                    accessorKey: "idAccount",
                    header: "Compte",
                    cell: ({ row }) => {
                        const account = props.accounts.get(row.original.idAccount)
                        if (!account) return <FormatNull />
                        return (
                            <div
                                className={css({
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "flex-start",
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
                        )
                    },
                    filterFn: "includesString",
                },
                {
                    accessorKey: "debit",
                    header: "Débit",
                    cell: ({ row }) => <FormatPrice price={row.original.debit} />,
                    filterFn: "includesString",
                },
                {
                    accessorKey: "credit",
                    header: "Crédit",
                    cell: ({ row }) => <FormatPrice price={row.original.credit} />,
                    filterFn: "includesString",
                },
                {
                    accessorKey: "idMatching",
                    header: "Lettrage",
                    cell: ({ row }) => {
                        const matching = row.original.idMatching
                            ? props.matchingById.get(row.original.idMatching)
                            : undefined
                        if (!matching) return <FormatNull />
                        return <FormatText>{matching.code}</FormatText>
                    },
                    filterFn: "includesString",
                },
                {
                    accessorKey: "createdAt",
                    header: "Ajouté le",
                    cell: ({ row }) => <FormatDateTime date={row.original.createdAt} />,
                    filterFn: "includesString",
                },
            ]}
        />
    )
}
