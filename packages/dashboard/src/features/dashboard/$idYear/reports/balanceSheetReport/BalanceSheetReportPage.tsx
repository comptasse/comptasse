import { Button, ButtonGhostContent, InputSelect } from "@comptasse/ui"
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
import { BalanceSheetAssetsReportTable } from "./balanceSheetAsset/BalanceSheetAssetsReportTable.tsx"
import { BalanceSheetLiabilitiesReportTable } from "./balanceSheetLiability/BalanceSheetLiabilitiesReportTable.tsx"
import { DownloadBalanceSheetReport } from "./DownloadBalanceSheetReport.tsx"

const requiredKeys = [
    "accounts",
    "entries",
    "entryLines",
    "balanceSheets",
    "journals",
    "tags",
    "entryTags",
] as const satisfies readonly YearDataKey[]

export function BalanceSheetReportPage({
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
    const [side, setSide] = useState<"asset" | "liability">("asset")
    return (
        <YearDataWrapper
            idYear={idYear}
            requiredKeys={requiredKeys}
        >
            {({ accounts, entries, entryLines, balanceSheets, journals, tags, entryTags }) => {
                let filteredEntryLines = entryLines.filter(
                    (entryLine) => entryLine.isComputedForBalanceSheetReport === true,
                )
                const filteredAccounts = accounts.filter((account) => account.type === "balance-sheet")

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
                                    alignItems: "center",
                                    gap: "0.5rem",
                                })}
                            >
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
                                        <DownloadBalanceSheetReport
                                            idOrganization={idOrganization}
                                            idYear={idYear}
                                            balanceSheets={balanceSheets}
                                            entryLines={filteredEntryLines}
                                            accounts={filteredAccounts}
                                        />
                                        <Button
                                            onClick={() =>
                                                router.navigate({
                                                    to: "/organisation/$idOrganization/exercice/$idYear/bilan",
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
                            </div>
                            <UnconnectedAccountsWarning
                                kind="balance-sheet"
                                accounts={filteredAccounts}
                                entryLines={filteredEntryLines}
                            />
                            <div
                                className={css({
                                    width: "100%",
                                })}
                            >
                                {side === "asset" ? (
                                    <Box
                                        className={css({
                                            width: "100%",
                                        })}
                                    >
                                        <BalanceSheetAssetsReportTable
                                            balanceSheets={balanceSheets.filter((b) => b.side === "asset")}
                                            entryLines={filteredEntryLines}
                                            accounts={filteredAccounts}
                                        />
                                    </Box>
                                ) : (
                                    <Box
                                        className={css({
                                            width: "100%",
                                        })}
                                    >
                                        <BalanceSheetLiabilitiesReportTable
                                            balanceSheets={balanceSheets.filter((b) => b.side === "liability")}
                                            entryLines={filteredEntryLines}
                                            accounts={filteredAccounts}
                                        />
                                    </Box>
                                )}
                            </div>
                        </Section.Item>
                    </Section.Root>
                )
            }}
        </YearDataWrapper>
    )
}
