import {
    readAllComputationIncomeStatementsRouteDefinition,
    readOneIncomeStatementRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { ButtonGhostContent, Chip, FormatDateTime, FormatText } from "@comptasse/ui"
import { IconEye } from "@tabler/icons-react"
import type * as v from "valibot"
import { LinkButton } from "../../../../../../../../components/LinkButton.tsx"
import { DataWrapper } from "../../../../../../../../components/layouts/DataWrapper.tsx"
import { DataTable } from "../../../../../../../../components/layouts/dataTable/DataTable.tsx"

export function ComputationIncomeStatementsTable(props: {
    computation: v.InferOutput<typeof returnedSchemas.computation>
}) {
    return (
        <DataWrapper
            routeDefinition={readAllComputationIncomeStatementsRouteDefinition}
            body={{
                idComputation: props.computation.id,
                idYear: props.computation.idYear,
            }}
        >
            {(computationIncomeStatements) => {
                return (
                    <DataTable
                        data={computationIncomeStatements}
                        isLoading={false}
                        columns={[
                            {
                                accessorKey: "actions",
                                header: " ",
                                cell: ({ row }) => (
                                    <LinkButton
                                        to="/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs"
                                        params={{
                                            idOrganization: row.original.idOrganization,
                                            idYear: row.original.idYear,
                                        }}
                                    >
                                        <ButtonGhostContent
                                            leftIcon={<IconEye />}
                                            text={undefined}
                                        />
                                    </LinkButton>
                                ),
                                enableSorting: false,
                                enableGlobalFilter: false,
                            },
                            {
                                accessorKey: "idStatement",
                                header: "Poste du compte de résultat",
                                cell: ({ row }) => (
                                    <DataWrapper
                                        routeDefinition={readOneIncomeStatementRouteDefinition}
                                        body={{
                                            idYear: row.original.idYear,
                                            idIncomeStatement: row.original.idIncomeStatement,
                                        }}
                                    >
                                        {(incomeStatement) => (
                                            <FormatText>
                                                {`${incomeStatement.number} - ${incomeStatement.label}`}
                                            </FormatText>
                                        )}
                                    </DataWrapper>
                                ),
                                filterFn: "includesString",
                            },
                            {
                                accessorKey: "operation",
                                header: "Opération",
                                cell: ({ row }) => (
                                    <Chip text={row.original.operation === "plus" ? "Addition" : "Soustraction"} />
                                ),
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
            }}
        </DataWrapper>
    )
}
