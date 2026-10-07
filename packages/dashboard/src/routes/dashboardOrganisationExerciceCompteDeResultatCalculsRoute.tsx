import { ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import { createRoute, useParams } from "@tanstack/react-router"
import { Box } from "../components/layouts/Box.tsx"
import { Page } from "../components/layouts/page/page.js"
import { Section } from "../components/layouts/section/section.tsx"
import { ComputationsTable } from "../features/dashboard/$idYear/yearSettings/incomeStatements/computations/ComputationsTable.tsx"
import { CreateOneComputation } from "../features/dashboard/$idYear/yearSettings/incomeStatements/computations/CreateOneComputation.tsx"
import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function IncomeStatementsCalculsPage() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
    }

    return (
        <Page.Root>
            <Page.Content>
                <Section.Root>
                    <Section.Item>
                        <div
                            className={css({
                                width: "100%",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                gap: "0.5rem",
                            })}
                        >
                            <CreateOneComputation
                                idOrganization={params.idOrganization}
                                idYear={params.idYear}
                            >
                                <ButtonPlainContent
                                    leftIcon={<IconPlus />}
                                    text="Ajouter une ligne de calcul"
                                />
                            </CreateOneComputation>
                        </div>
                        <Box
                            className={css({
                                maxH: "[640px]",
                                overflowY: "auto",
                            })}
                        >
                            <ComputationsTable
                                idOrganization={params.idOrganization}
                                idYear={params.idYear}
                            />
                        </Box>
                    </Section.Item>
                </Section.Root>
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceCompteDeResultatCalculsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs",
    component: IncomeStatementsCalculsPage,
})
