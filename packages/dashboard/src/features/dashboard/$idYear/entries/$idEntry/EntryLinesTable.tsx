import type { readAllAccountsRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { ButtonGhostContent, FormatDateTime, FormatNull, FormatPrice, FormatText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconEye, IconPencil } from "@tabler/icons-react"
import type * as v from "valibot"
import { LinkButton } from "../../../../../components/LinkButton.tsx"
import { DataTable } from "../../../../../components/layouts/DataTable.tsx"
import { UpdateOneEntryLine } from "./$idEntryLine/UpdateOneEntryLine.tsx"

export function EntryLinesTable(props: {
    entry: v.InferOutput<typeof returnedSchemas.entry>
    entryLines: Array<v.InferOutput<typeof returnedSchemas.entryLine>>
    accounts: Map<string, v.InferOutput<typeof readAllAccountsRouteDefinition.schemas.return>[number]>
    isLoading?: boolean
}) {
    return (
        <DataTable
            data={props.entryLines}
            isLoading={false}
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
                            <LinkButton
                                to="/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry"
                                params={{
                                    idOrganization: props.entry.idOrganization,
                                    idYear: props.entry.idYear,
                                    idEntry: row.original.idEntry,
                                }}
                            >
                                <ButtonGhostContent
                                    leftIcon={<IconEye />}
                                    text={undefined}
                                />
                            </LinkButton>
                        </div>
                    ),
                    enableSorting: false,
                    enableGlobalFilter: false,
                },
                {
                    accessorKey: "label",
                    header: "Libellé",
                    cell: ({ row }) => <FormatText>{row.original.label}</FormatText>,
                    filterFn: "includesString",
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
                    accessorKey: "createdAt",
                    header: "Ajouté le",
                    cell: ({ row }) => <FormatDateTime date={row.original.createdAt} />,
                    filterFn: "includesString",
                },
            ]}
        />
    )
}
