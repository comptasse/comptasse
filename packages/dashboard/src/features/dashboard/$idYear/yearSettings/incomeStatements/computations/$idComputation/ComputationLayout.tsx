import { readOneComputationRouteDefinition } from "@comptasse/application-metadata/routes"
import { ButtonOutlineContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconChevronLeft, IconDatabase, IconInfoCircle, IconList, IconPencil, IconTrash } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { Suspense } from "react"
import { LinkButton } from "../../../../../../../components/LinkButton.tsx"
import { DataWrapper } from "../../../../../../../components/layouts/DataWrapper.tsx"
import { Page } from "../../../../../../../components/layouts/page/page.tsx"
import { SubPageContent } from "../../../../../../../components/layouts/SubPageContent.tsx"
import { ComputationMetadataTab } from "./ComputationMetadataTab.tsx"
import { ComputationPage } from "./ComputationPage.tsx"
import { ComputationPostesTab } from "./ComputationPostesTab.tsx"
import { DeleteOneComputation } from "./DeleteOneComputation.tsx"
import { UpdateOneComputation } from "./UpdateOneComputation.tsx"

export function ComputationLayout() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
        idComputation: string
    }

    return (
        <Page.Root>
            <Page.Content>
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
                                <div
                                    className={css({
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
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
                                    <div
                                        className={css({
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
                                                title="Supprimer"
                                                color="danger"
                                            />
                                        </DeleteOneComputation>
                                    </div>
                                </div>
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
                                                            <ComputationPage />
                                                        </Suspense>
                                                    ),
                                                },
                                                {
                                                    key: "postes",
                                                    label: "Postes",
                                                    icon: <IconList />,
                                                    content: (
                                                        <Suspense fallback={null}>
                                                            <ComputationPostesTab />
                                                        </Suspense>
                                                    ),
                                                },
                                                {
                                                    key: "métadonnées",
                                                    label: "Métadonnées",
                                                    icon: <IconDatabase />,
                                                    content: (
                                                        <Suspense fallback={null}>
                                                            <ComputationMetadataTab />
                                                        </Suspense>
                                                    ),
                                                },
                                            ],
                                        },
                                    }}
                                />
                            </>
                        )
                    }}
                </DataWrapper>
            </Page.Content>
        </Page.Root>
    )
}
