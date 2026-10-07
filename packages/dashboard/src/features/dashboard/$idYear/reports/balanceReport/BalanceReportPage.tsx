import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useParams } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import type * as v from "valibot"
import { Box } from "../../../../../components/layouts/Box.tsx"
import { Section } from "../../../../../components/layouts/section/section.tsx"
import type { YearDataKey } from "../../YearDataWrapper.tsx"
import { YearDataWrapper } from "../../YearDataWrapper.tsx"
import { ReportFilterPopover } from "../ReportFilterPopover.tsx"
import { BalanceReportTable } from "./BalanceReportTable.tsx"

const requiredKeys = [
    "accounts",
    "entries",
    "entryLines",
    "journals",
    "tags",
    "entryTags",
] as const satisfies readonly YearDataKey[]

type TagFilter = Array<{
    key: string
    label: string
}>

export function BalanceReportPage({ idYear: idYearProp }: { idYear?: string } = {}) {
    const params = useParams({
        strict: false,
    }) as {
        idYear?: string
    }
    const idYear = idYearProp ?? params.idYear ?? ""
    const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null)
    const [selectedTags, setSelectedTags] = useState<TagFilter>([])

    return (
        <YearDataWrapper
            idYear={idYear}
            requiredKeys={requiredKeys}
        >
            {(data) => (
                <BalanceReportContent
                    accounts={data.accounts}
                    entries={data.entries}
                    entryLines={data.entryLines}
                    journals={data.journals}
                    tags={data.tags}
                    entryTags={data.entryTags}
                    selectedJournalId={selectedJournalId}
                    onJournalChange={setSelectedJournalId}
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                />
            )}
        </YearDataWrapper>
    )
}

function BalanceReportContent({
    accounts,
    entries,
    entryLines,
    journals,
    tags,
    entryTags,
    selectedJournalId,
    onJournalChange,
    selectedTags,
    onTagsChange,
}: {
    accounts: Array<v.InferOutput<typeof returnedSchemas.account>>
    entries: Array<v.InferOutput<typeof returnedSchemas.entry>>
    entryLines: Array<v.InferOutput<typeof returnedSchemas.entryLine>>
    journals: Array<v.InferOutput<typeof returnedSchemas.journal>>
    tags: Array<v.InferOutput<typeof returnedSchemas.tag>>
    entryTags: Array<v.InferOutput<typeof returnedSchemas.entryTag>>
    selectedJournalId: string | null
    onJournalChange: (value: string | null) => void
    selectedTags: TagFilter
    onTagsChange: (values: TagFilter) => void
}) {
    const filteredEntryLines = useMemo(() => {
        let result = entryLines.filter((entryLine) => entryLine.isComputedForBalanceReport === true)

        if (selectedJournalId) {
            const matchingEntryIds = new Set<string>()
            for (const entry of entries) {
                if (entry.idJournal === selectedJournalId) {
                    matchingEntryIds.add(entry.id)
                }
            }
            result = result.filter((el) => matchingEntryIds.has(el.idEntry))
        }

        if (selectedTags.length > 0) {
            const selectedTagIds = new Set(selectedTags.map((t) => t.key))
            const matchingEntryIds = new Set<string>()
            for (const et of entryTags) {
                if (selectedTagIds.has(et.idTag)) {
                    matchingEntryIds.add(et.idEntry)
                }
            }
            result = result.filter((el) => matchingEntryIds.has(el.idEntry))
        }

        return result
    }, [
        entryLines,
        entries,
        entryTags,
        selectedJournalId,
        selectedTags,
    ])

    const journalOptions = useMemo(
        () =>
            journals.map((j) => ({
                key: j.id,
                label: `${j.code} ${j.label ?? ""}`.trim(),
            })),
        [
            journals,
        ],
    )

    const tagOptions = useMemo(
        () =>
            tags.map((t) => ({
                key: t.id,
                label: t.label,
            })),
        [
            tags,
        ],
    )

    return (
        <Section.Root>
            <Section.Item>
                <div
                    className={css({
                        width: "100%",
                        display: "flex",
                        justifyContent: "end",
                        alignItems: "center",
                        gap: "0.5rem",
                    })}
                >
                    <ReportFilterPopover
                        selectedJournalId={selectedJournalId}
                        onJournalChange={onJournalChange}
                        journalOptions={journalOptions}
                        selectedTags={selectedTags}
                        onTagsChange={onTagsChange}
                        tagOptions={tagOptions}
                    />
                </div>
                <Box>
                    <BalanceReportTable
                        entryLines={filteredEntryLines}
                        accounts={accounts}
                    />
                </Box>
            </Section.Item>
        </Section.Root>
    )
}
