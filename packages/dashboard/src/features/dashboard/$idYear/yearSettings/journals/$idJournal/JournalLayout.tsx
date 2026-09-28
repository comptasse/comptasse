import { readOneJournalRouteDefinition } from "@comptasse/application-metadata/routes"
import { ButtonOutlineContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconChevronLeft, IconDatabase, IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react"
import { Outlet, useParams } from "@tanstack/react-router"
import { LinkButton } from "../../../../../../components/LinkButton.tsx"
import { DataWrapper } from "../../../../../../components/layouts/DataWrapper.tsx"
import { Section } from "../../../../../../components/layouts/section/section.tsx"
import { Tab } from "../../../../../../components/layouts/tab/tab.tsx"

import { DeleteOneJournal } from "./DeleteOneJournal.tsx"
import { UpdateOneJournal } from "./UpdateOneJournal.tsx"

export function JournalLayout() {
    const params = useParams({
        strict: false,
    }) as {
        idYear: string
        idJournal: string
        idOrganization: string
    }

    return (
        <Section.Root>
            <DataWrapper
                routeDefinition={readOneJournalRouteDefinition}
                body={{
                    idYear: params.idYear,
                    idJournal: params.idJournal,
                }}
            >
                {(journal) => {
                    return (
                        <>
                            <Section.Item
                                className={css({
                                    flexDirection: "row",
                                })}
                            >
                                <div
                                    className={css({
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    })}
                                >
                                    <LinkButton
                                        to="/organisation/$idOrganization/exercice/$idYear/journaux"
                                        params={{
                                            idOrganization: journal.idOrganization,
                                            idYear: journal.idYear,
                                        }}
                                    >
                                        <ButtonOutlineContent
                                            leftIcon={<IconChevronLeft />}
                                            text="Retour"
                                        />
                                    </LinkButton>
                                </div>
                                <div
                                    className={css({
                                        ml: "auto",
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    })}
                                >
                                    <UpdateOneJournal journal={journal}>
                                        <ButtonPlainContent
                                            leftIcon={<IconPencil />}
                                            text="Modifier"
                                        />
                                    </UpdateOneJournal>
                                    <DeleteOneJournal journal={journal}>
                                        <ButtonOutlineContent
                                            leftIcon={<IconTrash />}
                                            title="Supprimer"
                                            color="danger"
                                        />
                                    </DeleteOneJournal>
                                </div>
                            </Section.Item>
                            <Section.Item>
                                <Tab.Root
                                    tabs={[
                                        {
                                            label: "Informations",
                                            icon: <IconInfoCircle />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/journaux",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idJournal: params.idJournal,
                                            },
                                        },
                                        {
                                            label: "Métadonnées",
                                            icon: <IconDatabase />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/journaux",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idJournal: params.idJournal,
                                            },
                                        },
                                    ]}
                                />
                            </Section.Item>
                            <Outlet />
                        </>
                    )
                }}
            </DataWrapper>
        </Section.Root>
    )
}
