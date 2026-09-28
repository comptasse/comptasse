import { readOneIncomeStatementRouteDefinition } from "@comptasse/application-metadata/routes"
import { ButtonOutlineContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconChevronLeft, IconDatabase, IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react"
import { Outlet, useParams } from "@tanstack/react-router"
import { LinkButton } from "../../../../../../components/LinkButton.tsx"
import { DataWrapper } from "../../../../../../components/layouts/DataWrapper.tsx"
import { Section } from "../../../../../../components/layouts/section/section.tsx"
import { Tab } from "../../../../../../components/layouts/tab/tab.tsx"

import { DeleteOneIncomeStatement } from "./DeleteOneIncomeStatement.tsx"
import { UpdateOneIncomeStatement } from "./UpdateOneIncomeStatement.tsx"

export function IncomeStatementLayout() {
    const params = useParams({
        strict: false,
    }) as {
        idYear: string
        idIncomeStatement: string
        idOrganization: string
    }

    return (
        <Section.Root>
            <DataWrapper
                routeDefinition={readOneIncomeStatementRouteDefinition}
                body={{
                    idYear: params.idYear,
                    idIncomeStatement: params.idIncomeStatement,
                }}
            >
                {(incomeStatement) => {
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
                                        to="/organisation/$idOrganization/exercice/$idYear/compte-de-résultat"
                                        params={{
                                            idOrganization: incomeStatement.idOrganization,
                                            idYear: incomeStatement.idYear,
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
                                    <UpdateOneIncomeStatement incomeStatement={incomeStatement}>
                                        <ButtonPlainContent
                                            leftIcon={<IconPencil />}
                                            text="Modifier"
                                        />
                                    </UpdateOneIncomeStatement>
                                    <DeleteOneIncomeStatement incomeStatement={incomeStatement}>
                                        <ButtonOutlineContent
                                            leftIcon={<IconTrash />}
                                            color="danger"
                                        />
                                    </DeleteOneIncomeStatement>
                                </div>
                            </Section.Item>
                            <Section.Item>
                                <Tab.Root
                                    tabs={[
                                        {
                                            label: "Informations",
                                            icon: <IconInfoCircle />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idIncomeStatement: params.idIncomeStatement,
                                            },
                                        },
                                        {
                                            label: "Métadonnées",
                                            icon: <IconDatabase />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idIncomeStatement: params.idIncomeStatement,
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
