import { Button, ButtonGhostContent, ButtonOutlineContent, FormatError, formatPrice } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import {
    IconArrowBackUp,
    IconCircleCheck,
    IconCircleX,
    IconCopyCheck,
    IconDatabase,
    IconDotsVertical,
    IconInfoCircle,
    IconList,
    IconTag,
    IconTrash,
} from "@tabler/icons-react"
import { Suspense, useState } from "react"
import { Banner } from "../../../../../components/layouts/Banner.tsx"
import { Page } from "../../../../../components/layouts/page/page.tsx"
import { SubPageContent } from "../../../../../components/layouts/SubPageContent.tsx"
import { Popover } from "../../../../../components/overlays/popover/popover.js"
import { compareAmounts } from "../../../../../utilities/compareAmounts.ts"
import type { YearDataKey } from "../../YearDataWrapper.tsx"
import { YearDataWrapper } from "../../YearDataWrapper.tsx"
import { EntryClearedToggle } from "../EntryClearedToggle.tsx"
import { ReverseOneEntry } from "../ReverseOneEntry.tsx"
import { DeleteOneEntry } from "./DeleteOneEntry.tsx"
import { DuplicateOneEntry } from "./DuplicateOneEntry.tsx"
import { EntryCategoriesTab } from "./EntryCategoriesTab.tsx"
import { EntryInformationsTab } from "./EntryInformationsTab.tsx"
import { EntryLinesTab } from "./EntryLinesTab.tsx"
import { EntryMetadataTab } from "./EntryMetadataTab.tsx"

const requiredKeys = [
    "entries",
    "entryLines",
    "entryTags",
    "journals",
    "tags",
    "files",
] as const satisfies readonly YearDataKey[]

export function EntryTabContent(props: { idOrganization: string; idYear: string; idEntry: string }) {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <YearDataWrapper
            idYear={props.idYear}
            requiredKeys={requiredKeys}
        >
            {({ entries, entryLinesByEntryId, entryTagsByEntryId, journalById, tagById, fileById }) => {
                const entry = entries.find((r) => r.id === props.idEntry)

                if (entry === undefined) {
                    return (
                        <FormatError
                            text="Écriture introuvable."
                            className={{
                                padding: "1rem",
                            }}
                        />
                    )
                }

                const entryLines = entryLinesByEntryId.get(props.idEntry) ?? []

                let totalDebit = 0
                let totalCredit = 0

                for (const entryLine of entryLines) {
                    totalDebit += Number(entryLine.debit)
                    totalCredit += Number(entryLine.credit)
                }

                const journal = entry.idJournal !== null ? (journalById.get(entry.idJournal) ?? null) : null
                const entryTagLabels = (entryTagsByEntryId.get(entry.id) ?? [])
                    .map((et) => tagById.get(et.idTag))
                    .filter((t): t is NonNullable<typeof t> => t !== undefined)
                    .map((t) => t.label)
                const file = entry.idFile !== null ? (fileById.get(entry.idFile) ?? null) : null

                return (
                    <Page.Root>
                        <Page.Banners>
                            {entry.idFile !== null ? null : (
                                <Banner variant="error">Il manque une pièce justificative.</Banner>
                            )}
                            {compareAmounts({
                                a: totalDebit,
                                b: totalCredit,
                            }) ? null : (
                                <Banner variant="error">
                                    Les montants au débit et au crédit sont différents, veuillez corriger pour pouvoir
                                    valider. (
                                    {formatPrice({
                                        price: totalDebit - totalCredit,
                                    })}
                                    )
                                </Banner>
                            )}
                        </Page.Banners>
                        <Page.Content>
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
                                                        <EntryInformationsTab
                                                            entry={entry}
                                                            journal={journal}
                                                            entryTagLabels={entryTagLabels}
                                                            file={file}
                                                            totalDebit={totalDebit}
                                                            totalCredit={totalCredit}
                                                        />
                                                    </Suspense>
                                                ),
                                            },
                                            {
                                                key: "mouvements",
                                                label: "Mouvements",
                                                icon: <IconList />,
                                                content: (
                                                    <Suspense fallback={null}>
                                                        <EntryLinesTab
                                                            idYear={props.idYear}
                                                            idEntry={props.idEntry}
                                                        />
                                                    </Suspense>
                                                ),
                                            },
                                            {
                                                key: "catégories",
                                                label: "Catégories",
                                                icon: <IconTag />,
                                                content: (
                                                    <Suspense fallback={null}>
                                                        <EntryCategoriesTab
                                                            idYear={props.idYear}
                                                            idEntry={props.idEntry}
                                                        />
                                                    </Suspense>
                                                ),
                                            },
                                            {
                                                key: "métadonnées",
                                                label: "Métadonnées",
                                                icon: <IconDatabase />,
                                                content: (
                                                    <Suspense fallback={null}>
                                                        <EntryMetadataTab
                                                            idYear={props.idYear}
                                                            idEntry={props.idEntry}
                                                        />
                                                    </Suspense>
                                                ),
                                            },
                                        ],
                                    },
                                }}
                            >
                                <Popover.Root
                                    open={menuOpen}
                                    onOpenChange={setMenuOpen}
                                >
                                    <Popover.Trigger asChild>
                                        <Button>
                                            <ButtonGhostContent leftIcon={<IconDotsVertical />} />
                                        </Button>
                                    </Popover.Trigger>
                                    <Popover.Content
                                        align="end"
                                        className={{
                                            padding: "0.5rem",
                                            gap: "0.25rem",
                                        }}
                                    >
                                        <ReverseOneEntry entry={entry} onClick={() => setMenuOpen(false)}>
                                            <div
                                                className={css({
                                                    width: "100%",
                                                })}
                                            >
                                                <ButtonGhostContent
                                                    leftIcon={<IconArrowBackUp />}
                                                    text="Extourner"
                                                    className={{
                                                        width: "100%",
                                                        justifyContent: "start",
                                                    }}
                                                />
                                            </div>
                                        </ReverseOneEntry>
                                        <DuplicateOneEntry entry={entry} onClick={() => setMenuOpen(false)}>
                                            <div
                                                className={css({
                                                    width: "100%",
                                                })}
                                            >
                                                <ButtonGhostContent
                                                    leftIcon={<IconCopyCheck />}
                                                    text="Dupliquer"
                                                    className={{
                                                        width: "100%",
                                                        justifyContent: "start",
                                                    }}
                                                />
                                            </div>
                                        </DuplicateOneEntry>
                                        <EntryClearedToggle entry={entry} onClick={() => setMenuOpen(false)}>
                                            <div
                                                className={css({
                                                    width: "100%",
                                                })}
                                            >
                                                <ButtonGhostContent
                                                    leftIcon={entry.isCleared ? <IconCircleX /> : <IconCircleCheck />}
                                                    text={entry.isCleared ? "Dépointer" : "Pointer"}
                                                    className={{
                                                        width: "100%",
                                                        justifyContent: "start",
                                                    }}
                                                />
                                            </div>
                                        </EntryClearedToggle>
                                    </Popover.Content>
                                </Popover.Root>
                                <DeleteOneEntry entry={entry}>
                                    <div>
                                        <ButtonOutlineContent
                                            leftIcon={<IconTrash />}
                                            title="Supprimer"
                                            color="danger"
                                        />
                                    </div>
                                </DeleteOneEntry>
                            </SubPageContent>
                        </Page.Content>
                    </Page.Root>
                )
            }}
        </YearDataWrapper>
    )
}
