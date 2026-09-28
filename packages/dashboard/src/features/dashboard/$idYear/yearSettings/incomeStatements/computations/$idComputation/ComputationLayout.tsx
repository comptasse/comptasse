import { readOneComputationRouteDefinition } from "@comptasse/application-metadata/routes"
import { ButtonOutlineContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconChevronLeft, IconDatabase, IconInfoCircle, IconList, IconPencil, IconTrash } from "@tabler/icons-react"
import { Outlet, useParams } from "@tanstack/react-router"
import { LinkButton } from "../../../../../../../components/LinkButton.tsx"
import { DataWrapper } from "../../../../../../../components/layouts/DataWrapper.tsx"
import { Section } from "../../../../../../../components/layouts/section/section.tsx"
import { Tab } from "../../../../../../../components/layouts/tab/tab.tsx"

import { DeleteOneComputation } from "./DeleteOneComputation.tsx"
import { UpdateOneComputation } from "./UpdateOneComputation.tsx"

export function ComputationLayout() {
    const params = useParams({
        strict: false,
    }) as {
        idYear: string
        idComputation: string
        idOrganization: string
    }

    return (
        <Section.Root>
            <DataWrapper
                routeDefinition={readOneComputationRouteDefinition}
                body={{
                    idYear: params.idYear,
                    idComputation: params.idComputation,
                }}
            >
                {(computation) => {
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
                                        to="/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs"
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
                                    <UpdateOneComputation computation={computation}>
                                        <ButtonPlainContent
                                            leftIcon={<IconPencil />}
                                            text="Modifier"
                                        />
                                    </UpdateOneComputation>
                                    <DeleteOneComputation computation={computation}>
                                        <ButtonOutlineContent
                                            leftIcon={<IconTrash />}
                                            color="danger"
                                        />
                                    </DeleteOneComputation>
                                </div>
                            </Section.Item>
                            <Section.Item>
                                <Tab.Root
                                    tabs={[
                                        {
                                            label: "Informations",
                                            icon: <IconInfoCircle />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idComputation: params.idComputation,
                                            },
                                        },
                                        {
                                            label: "Postes",
                                            icon: <IconList />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idComputation: params.idComputation,
                                            },
                                        },
                                        {
                                            label: "Métadonnées",
                                            icon: <IconDatabase />,
                                            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs",
                                            params: {
                                                idOrganization: params.idOrganization,
                                                idYear: params.idYear,
                                                idComputation: params.idComputation,
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
