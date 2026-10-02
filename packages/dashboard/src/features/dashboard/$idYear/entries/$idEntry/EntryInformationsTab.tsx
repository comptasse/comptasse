import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import {
    ButtonPlainContent,
    FormatBoolean,
    FormatDate,
    FormatNull,
    FormatPrice,
    FormatText,
    LinkButton,
    LinkContent,
} from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPencil } from "@tabler/icons-react"
import type * as v from "valibot"
import { DataBlock } from "../../../../../components/layouts/dataBlock/dataBlock.tsx"
import { Section } from "../../../../../components/layouts/section/section.tsx"
import { UpdateOneEntry } from "./UpdateOneEntry.tsx"

export function EntryInformationsTab(props: {
    entry: v.InferOutput<typeof returnedSchemas.entry>
    journal: v.InferOutput<typeof returnedSchemas.journal> | null
    entryTagLabels: string[]
    file: v.InferOutput<typeof returnedSchemas.file> | null
    totalDebit: number
    totalCredit: number
}) {
    return (
        <Section.Item
            className={css({
                flexDirection: "column",
            })}
        >
            <div
                className={css({
                    width: "100%",
                    display: "flex",
                    justifyContent: "start",
                    alignItems: "center",
                    gap: "0.5rem",
                })}
            >
                <UpdateOneEntry entry={props.entry}>
                    <ButtonPlainContent
                        leftIcon={<IconPencil />}
                        text="Modifier"
                    />
                </UpdateOneEntry>
            </div>
            <DataBlock.Root>
                <DataBlock.Header title="Informations" />
                <DataBlock.Content>
                    <DataBlock.Item label="Libellé">
                        <FormatText>{props.entry.label}</FormatText>
                    </DataBlock.Item>
                    <DataBlock.Item label="Description">
                        {props.entry.description === null || props.entry.description === "" ? (
                            <FormatNull />
                        ) : (
                            <FormatText wrap={true}>{props.entry.description}</FormatText>
                        )}
                    </DataBlock.Item>
                    <DataBlock.Item label="Date">
                        <FormatDate date={props.entry.date} />
                    </DataBlock.Item>
                    <DataBlock.Item label="Journal">
                        {props.entry.idJournal === null ? (
                            <FormatNull />
                        ) : props.journal !== null ? (
                            <FormatText>{`(${props.journal.code}) ${props.journal.label}`}</FormatText>
                        ) : (
                            <FormatNull />
                        )}
                    </DataBlock.Item>
                    <DataBlock.Item label="Pointé">
                        <FormatBoolean boolean={props.entry.isCleared} />
                    </DataBlock.Item>
                    <DataBlock.Item label="Pièce justificative">
                        {props.entry.idFile === null || props.file === null ? (
                            <FormatNull />
                        ) : (
                            <LinkButton
                                to="/organisation/$idOrganization/fichier/$idFile"
                                params={{
                                    idOrganization: props.entry.idOrganization,
                                    idFile: props.file.id,
                                }}
                            >
                                <LinkContent>{props.file.name}</LinkContent>
                            </LinkButton>
                        )}
                    </DataBlock.Item>
                </DataBlock.Content>
            </DataBlock.Root>
            <DataBlock.Root>
                <DataBlock.Header title="Détail" />
                <DataBlock.Content>
                    <DataBlock.Item label="Total débit">
                        <FormatPrice price={props.totalDebit} />
                    </DataBlock.Item>
                    <DataBlock.Item label="Total crédit">
                        <FormatPrice price={props.totalCredit} />
                    </DataBlock.Item>
                </DataBlock.Content>
            </DataBlock.Root>
        </Section.Item>
    )
}
