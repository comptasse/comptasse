import { ButtonPlainContent, InputDebounced, InputText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import { createRoute, useParams } from "@tanstack/react-router"
import { useCallback, useState, useTransition } from "react"
import { Box } from "../components/layouts/Box.tsx"
import { Page } from "../components/layouts/page/page.js"
import { Section } from "../components/layouts/section/section.tsx"
import { CreateOneIncomeStatement } from "../features/dashboard/$idYear/yearSettings/incomeStatements/CreateOneIncomeStatement.tsx"
import { IncomeStatementsTable } from "../features/dashboard/$idYear/yearSettings/incomeStatements/IncomeStatementsTable.tsx"
import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function IncomeStatementsPostesPage() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
    }
    const [globalFilter, setGlobalFilter] = useState("")
    const [, startTransition] = useTransition()

    const handleFilterChange = useCallback((value: string | undefined) => {
        startTransition(() => {
            setGlobalFilter(value ?? "")
        })
    }, [])

    return (
        <Page.Root>
            <Page.Content>
                <Section.Root>
                    <Section.Item>
                        <div
                            className={css({
                                minWidth: "100%",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: "0.5rem",
                                flexWrap: "wrap",
                            })}
                        >
                            <CreateOneIncomeStatement
                                idOrganization={params.idOrganization}
                                idYear={params.idYear}
                            >
                                <ButtonPlainContent
                                    leftIcon={<IconPlus />}
                                    text="Ajouter une ligne de compte de résultat"
                                />
                            </CreateOneIncomeStatement>
                        </div>
                        <InputDebounced
                            value={globalFilter ?? ""}
                            onChange={handleFilterChange}
                        >
                            <InputText
                                placeholder="Recherche"
                                className={{
                                    maxWidth: "[320px]",
                                }}
                            />
                        </InputDebounced>
                        <Box
                            className={css({
                                maxH: "[640px]",
                                overflowY: "auto",
                            })}
                        >
                            <IncomeStatementsTable
                                idOrganization={params.idOrganization}
                                idYear={params.idYear}
                                globalFilter={globalFilter}
                            />
                        </Box>
                    </Section.Item>
                </Section.Root>
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceCompteDeResultatRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat",
    component: IncomeStatementsPostesPage,
})
