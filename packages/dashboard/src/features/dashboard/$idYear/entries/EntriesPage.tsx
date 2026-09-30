import { Button, ButtonGhostContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconDotsVertical, IconDownload, IconFileExport, IconFileImport, IconLink, IconPlus } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { Fragment } from "react"
import { LinkButton } from "../../../../components/LinkButton.js"
import { Page } from "../../../../components/layouts/page/page.js"
import { Popover } from "../../../../components/overlays/popover/popover.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { YearDataWrapper } from "../YearDataWrapper.tsx"
import { CreateOneEntry } from "./CreateOneEntry.js"
import { EntriesTable } from "./EntriesTable.js"
import { ExportEntryLines } from "./ExportEntryLines.js"
import { ExportFecFile } from "./ExportFecFile.js"
import { ImportFecFile } from "./ImportFecFile.js"

export function EntriesPage({
    idOrganization: idOrganizationProp,
    idYear: idYearProp,
}: {
    idOrganization?: string
    idYear?: string
}) {
    const { openPanel } = useRightPanel()
    const params = useParams({
        strict: false,
    }) as {
        idOrganization?: string
        idYear?: string
    }
    const idOrganization = idOrganizationProp ?? params.idOrganization ?? ""
    const idYear = idYearProp ?? params.idYear ?? ""

    return (
        <Page.Root>
            <Page.Content>
                <YearDataWrapper
                    idYear={idYear}
                    requiredKeys={[
                        "entries",
                        "entryLines",
                        "entryTags",
                        "journals",
                        "tags",
                        "files",
                        "accounts",
                    ]}
                >
                    {(data) => (
                        <Fragment>
                            <div
                                className={css({
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "start",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                })}
                            >
                                <Popover.Root>
                                    <Popover.Trigger asChild>
                                        <Button>
                                            <ButtonGhostContent
                                                leftIcon={<IconDotsVertical />}
                                                text={undefined}
                                            />
                                        </Button>
                                    </Popover.Trigger>
                                    <Popover.Content
                                        align="start"
                                        className={{
                                            padding: "0.5rem",
                                            gap: "0.25rem",
                                        }}
                                    >
                                        <Popover.Close asChild>
                                            <Button
                                                className={{
                                                    width: "100%",
                                                }}
                                                onClick={() => {
                                                    openPanel(
                                                        <ExportEntryLines
                                                            idOrganization={idOrganization}
                                                            idYear={idYear}
                                                            entries={data.entries}
                                                            entryLines={data.entryLines}
                                                        />,
                                                        "Exporter en CSV",
                                                    )
                                                }}
                                            >
                                                <ButtonGhostContent
                                                    leftIcon={<IconDownload />}
                                                    text="Exporter en CSV"
                                                    className={{
                                                        width: "100%",
                                                        justifyContent: "start",
                                                    }}
                                                />
                                            </Button>
                                        </Popover.Close>
                                        <Popover.Close asChild>
                                            <Button
                                                className={{
                                                    width: "100%",
                                                }}
                                                onClick={() => {
                                                    openPanel(
                                                        <ExportFecFile
                                                            idOrganization={idOrganization}
                                                            idYear={idYear}
                                                            entries={data.entries}
                                                            entryLines={data.entryLines}
                                                        />,
                                                        "Exporter le FEC",
                                                    )
                                                }}
                                            >
                                                <ButtonGhostContent
                                                    leftIcon={<IconFileExport />}
                                                    text="Exporter le FEC"
                                                    className={{
                                                        width: "100%",
                                                        justifyContent: "start",
                                                    }}
                                                />
                                            </Button>
                                        </Popover.Close>
                                        <Popover.Close asChild>
                                            <Button
                                                className={{
                                                    width: "100%",
                                                }}
                                                onClick={() => {
                                                    openPanel(
                                                        <ImportFecFile
                                                            idYear={idYear}
                                                            journals={data.journals}
                                                            accounts={data.accounts}
                                                        />,
                                                        "Importer un FEC",
                                                    )
                                                }}
                                            >
                                                <ButtonGhostContent
                                                    leftIcon={<IconFileImport />}
                                                    text="Importer un FEC"
                                                    className={{
                                                        width: "100%",
                                                        justifyContent: "start",
                                                    }}
                                                />
                                            </Button>
                                        </Popover.Close>
                                    </Popover.Content>
                                </Popover.Root>
                                <CreateOneEntry
                                    idOrganization={idOrganization}
                                    idYear={idYear}
                                >
                                    <Button>
                                        <ButtonPlainContent
                                            leftIcon={<IconPlus />}
                                            text="Ajouter une écriture"
                                        />
                                    </Button>
                                </CreateOneEntry>
                            </div>
                            <EntriesTable
                                idOrganization={idOrganization}
                                idYear={idYear}
                                entries={data.entries}
                                entryLinesByEntryId={data.entryLinesByEntryId}
                                entryTagsByEntryId={data.entryTagsByEntryId}
                                journalById={data.journalById}
                                tagById={data.tagById}
                                fileById={data.fileById}
                                accountById={data.accountById}
                            />
                        </Fragment>
                    )}
                </YearDataWrapper>
            </Page.Content>
        </Page.Root>
    )
}
