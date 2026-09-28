import { ButtonOutlineContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconChevronLeft, IconDatabase, IconEye, IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react"
import { Outlet, useParams } from "@tanstack/react-router"
import { LinkButton } from "../../../../../components/LinkButton.tsx"
import { Page } from "../../../../../components/layouts/page/page.tsx"
import { Section } from "../../../../../components/layouts/section/section.tsx"
import { Tab } from "../../../../../components/layouts/tab/tab.tsx"

import { DeleteOneFile } from "./DeleteOneFile.tsx"
import { FileData } from "./FileData.tsx"
import { UpdateOneFile } from "./UpdateOneFile.tsx"

export function FileLayout() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idFile: string
    }

    return (
        <Page.Root>
            <Page.Content>
                <FileData
                    idOrganization={params.idOrganization}
                    idFile={params.idFile}
                >
                    {(file) => {
                        return (
                            <Section.Root>
                                <Section.Item>
                                    <div
                                        className={css({
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                        })}
                                    >
                                        <LinkButton
                                            to="/organisation/$idOrganization/stockage"
                                            params={{
                                                idOrganization: file.idOrganization,
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
                                        <UpdateOneFile file={file}>
                                            <ButtonPlainContent
                                                leftIcon={<IconPencil />}
                                                text="Modifier"
                                            />
                                        </UpdateOneFile>
                                        <DeleteOneFile file={file}>
                                            <ButtonOutlineContent
                                                leftIcon={<IconTrash />}
                                                color="danger"
                                            />
                                        </DeleteOneFile>
                                    </div>
                                </Section.Item>
                                <Section.Item>
                                    <Tab.Root
                                        tabs={[
                                            {
                                                label: "Informations",
                                                icon: <IconInfoCircle />,
                                                to: "/organisation/$idOrganization/fichier/$idFile",
                                                params: {
                                                    idOrganization: params.idOrganization,
                                                    idFile: params.idFile,
                                                },
                                            },
                                            {
                                                label: "Métadonnées",
                                                icon: <IconDatabase />,
                                                to: "/organisation/$idOrganization/fichier/$idFile",
                                                params: {
                                                    idOrganization: params.idOrganization,
                                                    idFile: params.idFile,
                                                },
                                            },
                                            {
                                                label: "Visualisation",
                                                icon: <IconEye />,
                                                to: "/organisation/$idOrganization/fichier/$idFile",
                                                params: {
                                                    idOrganization: params.idOrganization,
                                                    idFile: params.idFile,
                                                },
                                            },
                                        ]}
                                    />
                                </Section.Item>
                                <Outlet />
                            </Section.Root>
                        )
                    }}
                </FileData>
            </Page.Content>
        </Page.Root>
    )
}
