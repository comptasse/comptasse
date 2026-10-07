import { ButtonOutlineContent, ButtonPlainContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconDatabase, IconEye, IconFileText, IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react"
import { Suspense } from "react"
import { LinkButton } from "../../../../../components/LinkButton.tsx"
import { Page } from "../../../../../components/layouts/page/page.tsx"
import { SubPageContent } from "../../../../../components/layouts/SubPageContent.tsx"
import { DeleteOneFile } from "./DeleteOneFile.tsx"
import { FileData } from "./FileData.tsx"
import { FileMetadataTab } from "./FileMetadataTab.tsx"
import { FileOcrTab } from "./FileOcrTab.tsx"
import { FilePage } from "./FilePage.tsx"
import { FileVisualisationTab } from "./FileVisualisationTab.tsx"
import { UpdateOneFile } from "./UpdateOneFile.tsx"

export function FileTabContent(props: { idOrganization: string; idFile: string }) {
    return (
        <Page.Root>
            <Page.Content>
                <FileData
                    idOrganization={props.idOrganization}
                    idFile={props.idFile}
                >
                    {(file) => (
                        <>
                            <div
                                className={css({
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                })}
                            >
                                {file.idFileParent !== null && (
                                    <LinkButton
                                        to="/organisation/$idOrganization/fichier/$idFile"
                                        params={{
                                            idOrganization: file.idOrganization,
                                            idFile: file.idFileParent,
                                        }}
                                    >
                                        <ButtonOutlineContent
                                            leftIcon={<IconFileText />}
                                            text="Fichier d'origine"
                                        />
                                    </LinkButton>
                                )}
                                <UpdateOneFile file={file}>
                                    <div>
                                        <ButtonPlainContent
                                            leftIcon={<IconPencil />}
                                            text="Modifier"
                                        />
                                    </div>
                                </UpdateOneFile>
                                <DeleteOneFile file={file}>
                                    <div>
                                        <ButtonOutlineContent
                                            leftIcon={<IconTrash />}
                                            title="Supprimer"
                                            color="danger"
                                        />
                                    </div>
                                </DeleteOneFile>
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
                                                        <FilePage
                                                            idOrganization={props.idOrganization}
                                                            idFile={props.idFile}
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
                                                        <FileMetadataTab
                                                            idOrganization={props.idOrganization}
                                                            idFile={props.idFile}
                                                        />
                                                    </Suspense>
                                                ),
                                            },
                                            {
                                                key: "visualisation",
                                                label: "Visualisation",
                                                icon: <IconEye />,
                                                content: (
                                                    <Suspense fallback={null}>
                                                        <FileVisualisationTab
                                                            idOrganization={props.idOrganization}
                                                            idFile={props.idFile}
                                                        />
                                                    </Suspense>
                                                ),
                                            },
                                            {
                                                key: "ocr",
                                                label: "Texte OCR",
                                                icon: <IconFileText />,
                                                content: (
                                                    <Suspense fallback={null}>
                                                        <FileOcrTab
                                                            idOrganization={props.idOrganization}
                                                            idFile={props.idFile}
                                                        />
                                                    </Suspense>
                                                ),
                                            },
                                        ],
                                    },
                                }}
                            />
                        </>
                    )}
                </FileData>
            </Page.Content>
        </Page.Root>
    )
}
