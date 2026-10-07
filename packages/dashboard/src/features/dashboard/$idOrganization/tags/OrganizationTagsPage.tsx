import {
    readAllOrganizationTagsRouteDefinition,
    readAllYearsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import { ButtonGhostContent, ButtonPlainContent, FormatNull, FormatText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { DataWrapper } from "../../../../components/layouts/DataWrapper.js"
import { Page } from "../../../../components/layouts/page/page.js"
import { Section } from "../../../../components/layouts/section/section.tsx"
import { CreateOneOrganizationTag } from "./CreateOneOrganizationTag.js"
import { DeleteOneOrganizationTag } from "./DeleteOneOrganizationTag.js"
import { UpdateOneOrganizationTag } from "./UpdateOneOrganizationTag.js"

export function OrganizationTagsPage() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
    }
    const idOrganization = params.idOrganization

    return (
        <Page.Root>
            <Page.Content>
                <DataWrapper
                    routeDefinition={readAllOrganizationTagsRouteDefinition}
                    body={{}}
                >
                    {(tags) => (
                        <DataWrapper
                            routeDefinition={readAllYearsRouteDefinition}
                            body={{
                                idOrganization: idOrganization,
                            }}
                        >
                            {(years) => {
                                const yearLabelById = new Map(
                                    years.map((year) => [
                                        year.id,
                                        year.label ?? year.id,
                                    ]),
                                )

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
                                                <CreateOneOrganizationTag years={years}>
                                                    <ButtonPlainContent
                                                        leftIcon={<IconPlus />}
                                                        text="Ajouter une catégorie"
                                                    />
                                                </CreateOneOrganizationTag>
                                            </div>
                                            {tags.length === 0 ? (
                                                <FormatNull text="Aucune catégorie" />
                                            ) : (
                                                <div
                                                    className={css({
                                                        width: "100%",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "0.25rem",
                                                    })}
                                                >
                                                    {tags.map((tag) => (
                                                        <div
                                                            key={tag.id}
                                                            className={css({
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                                gap: "0.5rem",
                                                                padding: "0.5rem",
                                                                border: "1px solid",
                                                                borderColor: "neutral/10",
                                                                borderRadius: "md",
                                                            })}
                                                        >
                                                            <div
                                                                className={css({
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    gap: "0.125rem",
                                                                })}
                                                            >
                                                                <FormatText>{tag.label}</FormatText>
                                                                <FormatText
                                                                    className={{
                                                                        color: "neutral/50",
                                                                    }}
                                                                >
                                                                    {tag.idYearIds
                                                                        .map(
                                                                            (idYear) =>
                                                                                yearLabelById.get(idYear) ?? idYear,
                                                                        )
                                                                        .join(", ")}
                                                                </FormatText>
                                                            </div>
                                                            <div
                                                                className={css({
                                                                    display: "flex",
                                                                    justifyContent: "flex-end",
                                                                    alignItems: "center",
                                                                    gap: "0.25rem",
                                                                })}
                                                            >
                                                                <UpdateOneOrganizationTag
                                                                    tag={tag}
                                                                    years={years}
                                                                >
                                                                    <ButtonGhostContent
                                                                        leftIcon={<IconPencil />}
                                                                        text={undefined}
                                                                    />
                                                                </UpdateOneOrganizationTag>
                                                                <DeleteOneOrganizationTag tag={tag}>
                                                                    <ButtonGhostContent
                                                                        leftIcon={<IconTrash />}
                                                                        text={undefined}
                                                                    />
                                                                </DeleteOneOrganizationTag>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Section.Item>
                                    </Section.Root>
                                )
                            }}
                        </DataWrapper>
                    )}
                </DataWrapper>
            </Page.Content>
        </Page.Root>
    )
}
