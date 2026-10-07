import { ButtonPlainContent, InputDebounced, InputText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { useCallback, useState, useTransition } from "react"
import { Box } from "../../../../../components/layouts/Box.tsx"
import { Section } from "../../../../../components/layouts/section/section.tsx"
import { AccountsTable } from "./AccountsTable.tsx"
import { CreateOneAccount } from "./CreateOneAccount.tsx"

export function AccountsPage({
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
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: "0.5rem",
                    })}
                >
                    <CreateOneAccount
                        idOrganization={idOrganization}
                        idYear={idYear}
                    >
                        <ButtonPlainContent
                            leftIcon={<IconPlus />}
                            text="Ajouter un compte"
                        />
                    </CreateOneAccount>
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
                        maxH: "640px",
                    })}
                >
                    <AccountsTable
                        idOrganization={idOrganization}
                        idYear={idYear}
                        globalFilter={globalFilter}
                    />
                </Box>
            </Section.Item>
        </Section.Root>
    )
}
