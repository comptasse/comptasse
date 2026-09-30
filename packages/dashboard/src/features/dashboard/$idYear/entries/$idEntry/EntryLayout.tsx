import { Button, ButtonGhostContent, ButtonOutlineContent, FormatError, formatPrice } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import {
    IconArrowBackUp,
    IconChevronLeft,
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
import { Outlet, useParams } from "@tanstack/react-router"
import { useState } from "react"
import { LinkButton } from "../../../../../components/LinkButton.js"
import { Banner } from "../../../../../components/layouts/Banner.tsx"
import { Page } from "../../../../../components/layouts/page/page.tsx"
import { Tab } from "../../../../../components/layouts/tab/tab.tsx"
import { Popover } from "../../../../../components/overlays/popover/popover.js"

import { compareAmounts } from "../../../../../utilities/compareAmounts.ts"
import type { YearDataKey } from "../../YearDataWrapper.tsx"
import { YearDataWrapper } from "../../YearDataWrapper.tsx"
import { EntryClearedToggle } from "../EntryClearedToggle.tsx"
import { ReverseOneEntry } from "../ReverseOneEntry.tsx"
import { DeleteOneEntry } from "./DeleteOneEntry.tsx"
import { DuplicateOneEntry } from "./DuplicateOneEntry.tsx"

const requiredKeys = [
    "entries",
    "entryLines",
    "entryTags",
    "accounts",
    "journals",
    "tags",
    "files",
] as const satisfies readonly YearDataKey[]

export function EntryLayout() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
        idEntry: string
    }
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <YearDataWrapper
            idYear={params.idYear}
            requiredKeys={requiredKeys}
        >
            {({ entries, entryLines: allEntryLines }) => {
                const entry = entries.find((r) => r.id === params.idEntry)

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

                const entryLines = allEntryLines.filter((row) => row.idEntry === params.idEntry)

                let totalDebit = 0
                let totalCredit = 0

                for (const entryLine of entryLines) {
                    totalDebit += Number(entryLine.debit)
                    totalCredit += Number(entryLine.credit)
                }

                return (
                    <Page.Root>
                        <Page.Content>
                            <div
                                className={css({
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: "0.5rem",
                                })}
                            >
                                <LinkButton
                                    to="/organisation/$idOrganization/exercice/$idYear/écritures"
                                    params={{
                                        idOrganization: params.idOrganization,
                                        idYear: params.idYear,
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
                                            <ReverseOneEntry
                                                entry={entry}
                                                onClick={() => setMenuOpen(false)}
                                            >
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
                                            <DuplicateOneEntry
                                                entry={entry}
                                                onClick={() => setMenuOpen(false)}
                                            >
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
                                            <EntryClearedToggle
                                                entry={entry}
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                <div
                                                    className={css({
                                                        width: "100%",
                                                    })}
                                                >
                                                    <ButtonGhostContent
                                                        leftIcon={
                                                            entry.isCleared ? <IconCircleX /> : <IconCircleCheck />
                                                        }
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
                                        <ButtonOutlineContent
                                            leftIcon={<IconTrash />}
                                            title="Supprimer"
                                            color="danger"
                                        />
                                    </DeleteOneEntry>
                                </div>
                            </div>
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
                            <Tab.Root
                                tabs={[
                                    {
                                        label: "Informations",
                                        icon: <IconInfoCircle />,
                                        to: "/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry",
                                        params: {
                                            idOrganization: params.idOrganization,
                                            idYear: params.idYear,
                                            idEntry: params.idEntry,
                                        },
                                    },
                                    {
                                        label: "Mouvements",
                                        icon: <IconList />,
                                        to: "/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry",
                                        params: {
                                            idOrganization: params.idOrganization,
                                            idYear: params.idYear,
                                            idEntry: params.idEntry,
                                        },
                                    },
                                    {
                                        label: "Catégories",
                                        icon: <IconTag />,
                                        to: "/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry",
                                        params: {
                                            idOrganization: params.idOrganization,
                                            idYear: params.idYear,
                                            idEntry: params.idEntry,
                                        },
                                    },
                                    {
                                        label: "Métadonnées",
                                        icon: <IconDatabase />,
                                        to: "/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry",
                                        params: {
                                            idOrganization: params.idOrganization,
                                            idYear: params.idYear,
                                            idEntry: params.idEntry,
                                        },
                                    },
                                ]}
                            />
                            <Outlet />
                        </Page.Content>
                    </Page.Root>
                )
            }}
        </YearDataWrapper>
    )
}
