import { readOneComputationIncomeStatementRouteDefinition } from "@comptasse/application-metadata/routes"
import { ButtonOutlineContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconChevronLeft, IconDatabase, IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react"
import { Outlet, useParams } from "@tanstack/react-router"
import { LinkButton } from "../../../../../../../../../components/LinkButton.tsx"
import { DataWrapper } from "../../../../../../../../../components/layouts/DataWrapper.tsx"
import { Section } from "../../../../../../../../../components/layouts/section/section.tsx"
import { Tab } from "../../../../../../../../../components/layouts/tab/tab.tsx"

import { DeleteOneComputationIncomeStatement } from "./DeleteOneComputationIncomeStatement.tsx"
import { UpdateOneComputationIncomeStatement } from "./UpdateOneComputationIncomeStatement.tsx"

export function ComputationIncomeStatementLayout() {
    const params = useParams({
        strict: false,
    }) as {
        idYear: string
        idComputationIncomeStatement: string
        idOrganization: string
        idComputation: string
    }

    return (
        <Section.Root>
            <DataWrapper
                routeDefinition={readOneComputationIncomeStatementRouteDefinition}
                body={{
                    idYear: params.idYear,
                    idComputationIncomeStatement: params.idComputationIncomeStatement,
                }}
            >
                {(computationIncomeStatement) => {
                    return (
                        <>
                            <Section.Item
                                className={css({
                                    flexDirection: "row",
                                })}
                            >
                                <div
                                    className={css({
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    })}
                                >
                                    <LinkButton
                                        to="/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs"
                                        params={{
                                            idOrganization: params.idOrganization,
                                            idYear: params.idYear,
                                            idComputation: params.idComputation,
                                        }}
                                    >
                                        <ButtonOutlineContent
                                            leftIcon={<IconChevronLeft />}
                                            text="Retour"
                                        />
                                    </LinkButton>
                                </div>
                                <div
                                    className={css({
                                        ml: "auto",
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    })}
                                >
                                    <UpdateOneComputationIncomeStatement
                                        computationIncomeStatement={computationIncomeStatement}
                                    >
                                        <ButtonPlainContent
                                            leftIcon={<IconPencil />}
                                            text="Modifier"
                                        />
                                    </UpdateOneComputationIncomeStatement>
                                    <DeleteOneComputationIncomeStatement
                                        computationIncomeStatement={computationIncomeStatement}
                                    >
                                        <ButtonOutlineContent
                                            leftIcon={<IconTrash />}
                                            color="danger"
                                        />
                                    </DeleteOneComputationIncomeStatement>
                                </div>
                            </Section.Item>
                            <Section.Item>
                                <Tab.Root
                                    tabs={[
                                        {
                                            label: "Informations",
                                            icon: <IconInfoCircle />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idComputation: params.idComputation,
                                                idComputationIncomeStatement: params.idComputationIncomeStatement,
                                            },
                                        },
                                        {
                                            label: "Métadonnées",
                                            icon: <IconDatabase />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idComputation: params.idComputation,
                                                idComputationIncomeStatement: params.idComputationIncomeStatement,
                                            },
                                        },
                                    ]}
                                />
                            </Section.Item>
                            <Outlet />
                        </>
                    )
                }}
            </DataWrapper>
        </Section.Root>
    )
}
