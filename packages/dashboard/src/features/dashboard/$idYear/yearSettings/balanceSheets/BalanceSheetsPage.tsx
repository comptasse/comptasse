import { ButtonPlainContent, InputDebounced, InputSelect, InputText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { useCallback, useState, useTransition } from "react"
import { Box } from "../../../../../components/layouts/Box.tsx"
import { Section } from "../../../../../components/layouts/section/section.tsx"
import { BalanceSheetTable } from "./BalanceSheetTable.tsx"
import { CreateOneBalanceSheet } from "./CreateOneBalanceSheet.tsx"

export function BalanceSheetsPage({
    idOrganization: idOrganizationProp,
    idYear: idYearProp,
}: {
    idOrganization?: string
    idYear?: string
} = {}) {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization?: string
        idYear?: string
    }
    const idOrganization = idOrganizationProp ?? params.idOrganization ?? ""
    const idYear = idYearProp ?? params.idYear ?? ""
    const [globalFilter, setGlobalFilter] = useState("")
    const [, startTransition] = useTransition()
    const [side, setSide] = useState<"asset" | "liability">("asset")

    const handleFilterChange = useCallback((value: string | undefined) => {
        startTransition(() => {
            setGlobalFilter(value ?? "")
        })
    }, [])

    return (
        <Section.Root>
            <Section.Item>
                <div
                    className={css({
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                    })}
                >
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "row",
                            gap: "0.25rem",
                            // flexWrap: "wrap",
                        })}
                    >
                        <InputSelect
                            value={side}
                            onChange={(v) => setSide((v ?? "asset") as "asset" | "liability")}
                            options={[
                                {
                                    key: "asset",
                                    label: "Actif",
                                },
                                {
                                    key: "liability",
                                    label: "Passif",
                                },
                            ]}
                        />
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
                    </div>
                    <div
                        className={css({
                            display: "flex",
                            gap: "0.25rem",
                        })}
                    >
                        <CreateOneBalanceSheet
                            idOrganization={idOrganization}
                            idYear={idYear}
                        >
                            <ButtonPlainContent
                                leftIcon={<IconPlus />}
                                text="Ajouter une ligne de bilan"
                            />
                        </CreateOneBalanceSheet>
                    </div>
                </div>
                <Box
                    className={css({
                        maxH: "[640px]",
                        overflowY: "auto",
                    })}
                >
                    <BalanceSheetTable
                        idOrganization={idOrganization}
                        idYear={idYear}
                        side={side}
                        globalFilter={globalFilter}
                    />
                </Box>
            </Section.Item>
        </Section.Root>
    )
}
