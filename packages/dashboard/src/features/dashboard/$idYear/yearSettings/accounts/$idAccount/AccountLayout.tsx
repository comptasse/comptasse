import { readOneAccountRouteDefinition } from "@comptasse/application-metadata/routes"
import { ButtonOutlineContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconChevronLeft, IconDatabase, IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { Suspense } from "react"
import { LinkButton } from "../../../../../../components/LinkButton.tsx"
import { DataWrapper } from "../../../../../../components/layouts/DataWrapper.tsx"
import { Page } from "../../../../../../components/layouts/page/page.tsx"
import { SubPageContent } from "../../../../../../components/layouts/SubPageContent.tsx"
import { AccountMetadataTab } from "./AccountMetadataTab.tsx"
import { AccountPage } from "./AccountPage.tsx"
import { DeleteOneAccount } from "./DeleteOneAccount.tsx"
import { UpdateOneAccount } from "./UpdateOneAccount.tsx"

export function AccountLayout() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
        idAccount: string
    }

    return (
        <Page.Root>
            <Page.Content>
                <DataWrapper
                    routeDefinition={readOneAccountRouteDefinition}
                    body={{
                        idYear: params.idYear,
                        idAccount: params.idAccount,
                    }}
                >
                    {(account) => {
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
                                        to="/organisation/$idOrganization/exercice/$idYear/comptes"
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
                                        <UpdateOneAccount account={account}>
                                            <ButtonPlainContent
                                                leftIcon={<IconPencil />}
                                                text="Modifier"
                                            />
                                        </UpdateOneAccount>
                                        <DeleteOneAccount account={account}>
                                            <ButtonOutlineContent
                                                leftIcon={<IconTrash />}
                                                title="Supprimer"
                                                color="danger"
                                            />
                                        </DeleteOneAccount>
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
                                                            <AccountPage />
                                                        </Suspense>
                                                    ),
                                                },
                                                {
                                                    key: "métadonnées",
                                                    label: "Métadonnées",
                                                    icon: <IconDatabase />,
                                                    content: (
                                                        <Suspense fallback={null}>
                                                            <AccountMetadataTab />
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
