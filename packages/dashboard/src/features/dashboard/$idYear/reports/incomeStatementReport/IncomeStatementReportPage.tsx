import { Button, ButtonGhostContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconSettings } from "@tabler/icons-react"
import { useParams, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Box } from "../../../../../components/layouts/Box.tsx"
import { Section } from "../../../../../components/layouts/section/section.tsx"
import type { YearDataKey } from "../../YearDataWrapper.tsx"
import { YearDataWrapper } from "../../YearDataWrapper.tsx"
import { ReportFilterPopover } from "../ReportFilterPopover.tsx"
import { UnconnectedAccountsWarning } from "../UnconnectedAccountsWarning.tsx"
import { DownloadIncomeStatementReport } from "./DownloadIncomeStatementReport.tsx"
import { IncomeStatementsReportTable } from "./IncomeStatementsReportTable.tsx"

const requiredKeys = [
    "accounts",
    "entries",
    "entryLines",
    "incomeStatements",
    "computations",
    "computationIncomeStatements",
    "journals",
    "tags",
    "entryTags",
] as const satisfies readonly YearDataKey[]

export function IncomeStatementReportPage({
    idOrganization: idOrganizationProp,
    idYear: idYearProp,
}: {
    idOrganization?: string
    idYear?: string
} = {}) {
    const router = useRouter()
    const params = useParams({
        strict: false,
    }) as {
        idOrganization?: string
        idYear?: string
    }
    const idOrganization = idOrganizationProp ?? params.idOrganization ?? ""
    const idYear = idYearProp ?? params.idYear ?? ""
    const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null)
    const [selectedTags, setSelectedTags] = useState<
        Array<{
            key: string
            label: string
        }>
    >([])

    return (
        <YearDataWrapper
            idYear={idYear}
            requiredKeys={requiredKeys}
        >
            {({
                accounts,
                entries,
                entryLines,
                incomeStatements,
                computations,
                computationIncomeStatements,
                journals,
                tags,
                entryTags,
            }) => {
                let filteredEntryLines = entryLines.filter(
                    (entryLine) => entryLine.isComputedForIncomeStatementReport === true,
                )
                const filteredAccounts = accounts.filter((account) => account.type === "income-statement")

                const journalOptions = journals.map((j) => ({
                    key: j.id,
                    label: `${j.code} ${j.label ?? ""}`.trim(),
                }))

                const tagOptions = tags.map((t) => ({
                    key: t.id,
                    label: t.label,
                }))

                if (selectedJournalId) {
                    const matchingEntryIds = new Set<string>()
                    for (const entry of entries) {
                        if (entry.idJournal === selectedJournalId) {
                            matchingEntryIds.add(entry.id)
                        }
                    }
                    filteredEntryLines = filteredEntryLines.filter((el) => matchingEntryIds.has(el.idEntry))
                }

                if (selectedTags.length > 0) {
                    const selectedTagIds = new Set(selectedTags.map((t) => t.key))
                    const matchingEntryIds = new Set<string>()
                    for (const et of entryTags) {
                        if (selectedTagIds.has(et.idTag)) {
                            matchingEntryIds.add(et.idEntry)
                        }
                    }
                    filteredEntryLines = filteredEntryLines.filter((el) => matchingEntryIds.has(el.idEntry))
                }

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
                                        gap: "0.25rem",
                                    })}
                                >
                                    <ReportFilterPopover
                                        selectedJournalId={selectedJournalId}
                                        onJournalChange={setSelectedJournalId}
                                        journalOptions={journalOptions}
                                        selectedTags={selectedTags}
                                        onTagsChange={setSelectedTags}
                                        tagOptions={tagOptions}
                                    />
                                </div>
                                <div
                                    className={css({
                                        display: "flex",
                                        gap: "0.25rem",
                                    })}
                                >
                                    <DownloadIncomeStatementReport
                                        idOrganization={idOrganization}
                                        idYear={idYear}
                                        incomeStatements={incomeStatements}
                                        computations={computations}
                                        computationIncomeStatements={computationIncomeStatements}
                                        entryLines={filteredEntryLines}
                                        accounts={filteredAccounts}
                                    />
                                    <Button
                                        onClick={() =>
                                            router.navigate({
                                                to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat",
                                                params: {
                                                    idOrganization,
                                                    idYear,
                                                },
                                            })
                                        }
                                    >
                                        <ButtonGhostContent leftIcon={<IconSettings />} />
                                    </Button>
                                </div>
                            </div>
                            <UnconnectedAccountsWarning
                                kind="income-statement"
                                accounts={filteredAccounts}
                                entryLines={filteredEntryLines}
                            />
                            <div
                                className={css({
                                    width: "100%",
                                })}
                            >
                                <Box>
                                    <IncomeStatementsReportTable
                                        incomeStatements={incomeStatements}
                                        computations={computations}
                                        computationIncomeStatements={computationIncomeStatements}
                                        entryLines={filteredEntryLines}
                                        accounts={filteredAccounts}
                                    />
                                </Box>
                            </div>
                        </Section.Item>
                    </Section.Root>
                )
            }}
        </YearDataWrapper>
    )
}
