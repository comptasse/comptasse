import { readOneComputationIncomeStatementRouteDefinition } from "@comptasse/application-metadata/routes"
import { ButtonOutlineContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconChevronLeft, IconDatabase, IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { Suspense } from "react"
import { LinkButton } from "../../../../../../../../../components/LinkButton.tsx"
import { DataWrapper } from "../../../../../../../../../components/layouts/DataWrapper.tsx"
import { Page } from "../../../../../../../../../components/layouts/page/page.tsx"
import { SubPageContent } from "../../../../../../../../../components/layouts/SubPageContent.tsx"
import { ComputationIncomeStatementMetadataTab } from "./ComputationIncomeStatementMetadataTab.tsx"
import { ComputationIncomeStatementPage } from "./ComputationIncomeStatementPage.tsx"
import { DeleteOneComputationIncomeStatement } from "./DeleteOneComputationIncomeStatement.tsx"
import { UpdateOneComputationIncomeStatement } from "./UpdateOneComputationIncomeStatement.tsx"

export function ComputationIncomeStatementLayout() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
        idComputation: string
        idComputationIncomeStatement: string
    }

    return (
        <Page.Root>
            <Page.Content>
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
                                <div
                                    className={css({
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    })}
                                >
                                    <LinkButton
                                        to="/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs/$idComputation"
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
                                    <div
                                        className={css({
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
                                                title="Supprimer"
                                                color="danger"
                                            />
                                        </DeleteOneComputationIncomeStatement>
                                    </div>
                                </div>
                                <SubPageContent
                                    defaultKey="informations"
                                    sections={{
                                        main: {
                                            items: [
                                                {
                                                    key: "informations",
                                                    label: "Informations",
                                                    icon: <IconInfoCircle />,
                                                    content: (
                                                        <Suspense fallback={null}>
                                                            <ComputationIncomeStatementPage />
                                                        </Suspense>
                                                    ),
                                                },
                                                {
                                                    key: "métadonnées",
                                                    label: "Métadonnées",
                                                    icon: <IconDatabase />,
                                                    content: (
                                                        <Suspense fallback={null}>
                                                            <ComputationIncomeStatementMetadataTab />
                                                        </Suspense>
                                                    ),
                                                },
                                            ],
                                        },
                                    }}
                                />
                            </>
                        )
                    }}
                </DataWrapper>
            </Page.Content>
        </Page.Root>
    )
}
