import { readOneTagRouteDefinition } from "@comptasse/application-metadata/routes"
import { ButtonOutlineContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconChevronLeft, IconDatabase, IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react"
import { Outlet, useParams } from "@tanstack/react-router"
import { LinkButton } from "../../../../../../components/LinkButton.tsx"
import { DataWrapper } from "../../../../../../components/layouts/DataWrapper.tsx"
import { Section } from "../../../../../../components/layouts/section/section.tsx"
import { Tab } from "../../../../../../components/layouts/tab/tab.tsx"

import { DeleteOneTag } from "./DeleteOneTag.tsx"
import { UpdateOneTag } from "./UpdateOneTag.tsx"

export function TagLayout() {
    const params = useParams({
        strict: false,
    }) as {
        idYear: string
        idTag: string
        idOrganization: string
    }

    return (
        <Section.Root>
            <DataWrapper
                routeDefinition={readOneTagRouteDefinition}
                body={{
                    idYear: params.idYear,
                    idTag: params.idTag,
                }}
            >
                {(tag) => {
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
                                        to="/organisation/$idOrganization/exercice/$idYear/catégories"
                                        params={{
                                            idOrganization: tag.idOrganization,
                                            idYear: tag.idYear,
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
                                    <UpdateOneTag tag={tag}>
                                        <ButtonPlainContent
                                            leftIcon={<IconPencil />}
                                            text="Modifier"
                                        />
                                    </UpdateOneTag>
                                    <DeleteOneTag tag={tag}>
                                        <ButtonOutlineContent
                                            leftIcon={<IconTrash />}
                                            title="Supprimer"
                                            color="danger"
                                        />
                                    </DeleteOneTag>
                                </div>
                            </Section.Item>
                            <Section.Item>
                                <Tab.Root
                                    tabs={[
                                        {
                                            label: "Informations",
                                            icon: <IconInfoCircle />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/catégories",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idTag: params.idTag,
                                            },
                                        },
                                        {
                                            label: "Métadonnées",
                                            icon: <IconDatabase />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/catégories",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idTag: params.idTag,
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
