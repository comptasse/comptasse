import { FormatDateTime, FormatFileSize, FormatNull, FormatText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useParams } from "@tanstack/react-router"
import { DataBlock } from "../../../../../components/layouts/dataBlock/dataBlock.tsx"
import { Section } from "../../../../../components/layouts/section/section.tsx"
import { FileData } from "./FileData.tsx"

export function FilePage(props: { idOrganization?: string; idFile?: string } = {}) {
    const params = useParams({
        strict: false,
    })
    const idOrganization = props.idOrganization ?? params.idOrganization ?? ""
    const idFile = props.idFile ?? params.idFile ?? ""

    return (
        <FileData
            idOrganization={idOrganization}
            idFile={idFile}
        >
            {(file) => (
                <Section.Item
                    className={css({
                        flexDirection: "column",
                    })}
                >
                    <DataBlock.Root>
                        <DataBlock.Header title="Informations" />
                        <DataBlock.Content>
                            <DataBlock.Item label="Référence">
                                <FormatText>{file.reference}</FormatText>
                            </DataBlock.Item>
                            <DataBlock.Item label="Nom">
                                <FormatText>{file.name}</FormatText>
                            </DataBlock.Item>
                            <DataBlock.Item label="Description">
                                {file.description === null || file.description === "" ? (
                                    <FormatNull />
                                ) : (
                                    <FormatText wrap={true}>{file.description}</FormatText>
                                )}
                            </DataBlock.Item>
                            <DataBlock.Item label="Date">
                                {file.date !== null && file.date !== undefined ? (
                                    <FormatDateTime date={file.date} />
                                ) : (
                                    <FormatNull />
                                )}
                            </DataBlock.Item>
                            <DataBlock.Item label="Type">
                                <FormatText>{file.type?.split("/").at(1)}</FormatText>
                            </DataBlock.Item>
                            <DataBlock.Item label="Taille">
                                <FormatFileSize size={file.size} />
                            </DataBlock.Item>
                        </DataBlock.Content>
                    </DataBlock.Root>
                </Section.Item>
            )}
        </FileData>
    )
}
