import { ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconCalculator, IconPlus, IconReportMoney } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { Box } from "../../../../../../components/layouts/Box.tsx"
import { Section } from "../../../../../../components/layouts/section/section.tsx"
import { Tab } from "../../../../../../components/layouts/tab/tab.tsx"

import { ComputationsTable } from "./ComputationsTable.tsx"
import { CreateOneComputation } from "./CreateOneComputation.tsx"

export function ComputationsPage() {
    const params = useParams({
        strict: false,
    }) as {
        idYear: string
        idOrganization: string
    }

    return (
        <Section.Root>
            <Section.Item>
                <Tab.Root
                    tabs={[
                        {
                            label: "Postes",
                            icon: <IconReportMoney />,
                            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat",
                            params: {
                                idOrganization: params.idOrganization,
                                idYear: params.idYear,
                            },
                        },
                        {
                            label: "Calculs",
                            icon: <IconCalculator />,
                            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs",
                            params: {
                                idOrganization: params.idOrganization,
                                idYear: params.idYear,
                            },
                        },
                    ]}
                />
            </Section.Item>
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
    )
}
