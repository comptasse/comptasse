import type { readAllEntriesRouteDefinition } from "@comptasse/application-metadata/routes"
import {
    Button,
    ButtonGhostContent,
    FormatBoolean,
    FormatDate,
    FormatDateTime,
    FormatNull,
    FormatText,
    LinkButton,
    LinkContent,
} from "@comptasse/ui"
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"
import type * as v from "valibot"
import { includesStringOrBoolean } from "../../../../components/layouts/dataTable/filterFns.js"
import { applicationRouter } from "../../../../routes/applicationRouter.js"
import type { YearDataMaps } from "../YearDataWrapper.tsx"
import { EntryClearedToggle } from "./EntryClearedToggle.tsx"

type Entry = v.InferOutput<typeof readAllEntriesRouteDefinition.schemas.return>[number]

export function buildEntriesTableColumns(parameters: {
    idOrganization: string
    journalsMap: YearDataMaps["journalById"]
    tagsMap: YearDataMaps["tagById"]
    tagsByEntry: Map<string, string[]>
    filesMap: YearDataMaps["fileById"]
}): Array<ColumnDef<Entry>> {
    return [
        {
            accessorKey: "isCleared",
            header: "Pointé",
            cell: ({ row }) => <FormatBoolean boolean={row.original.isCleared} />,
            filterFn: includesStringOrBoolean,
            meta: {
                filterVariant: "boolean",
            },
        },
        {
            accessorKey: "label",
            header: "Libellé",
            cell: ({ row }) => (
                <LinkButton
                    to="/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry"
                    params={{
                        idOrganization: row.original.idOrganization,
                        idYear: row.original.idYear,
                        idEntry: row.original.id,
                    }}
                >
                    <LinkContent>{row.original.label}</LinkContent>
                </LinkButton>
            ),
            filterFn: "includesString",
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => <FormatDate date={row.original.date} />,
            filterFn: "includesString",
        },
        {
            accessorKey: "idJournal",
            header: "Journal",
            cell: ({ row }) => {
                if (row.original.idJournal === null) return <FormatNull />
                const journal = parameters.journalsMap.get(row.original.idJournal)
                if (!journal) return <FormatNull />
                return <FormatText>{journal.code}</FormatText>
            },
            filterFn: "includesString",
            meta: {
                filterVariant: "combobox",
                filterOptions: [
                    ...parameters.journalsMap.values(),
                ].map((journal) => ({
                    key: journal.id,
                    label: `(${journal.code}) ${journal.label}`,
                })),
            },
        },
        {
            accessorKey: "id",
            id: "tags",
            header: "Catégorie",
            cell: ({ row }) => {
                const tagIds = parameters.tagsByEntry.get(row.original.id)
                if (!tagIds || tagIds.length === 0) return <FormatNull />
                const tagLabels = tagIds
                    .map((id) => parameters.tagsMap.get(id))
                    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
                    .map((tag) => tag.label)
                if (tagLabels.length === 0) return <FormatNull />
                return <FormatText>{tagLabels.join(", ")}</FormatText>
            },
            filterFn: (row, _columnId, filterValue) => {
                const tagIds = parameters.tagsByEntry.get(row.original.id) ?? []
                return tagIds.includes(String(filterValue))
            },
            meta: {
                filterVariant: "combobox",
                filterOptions: [
                    ...parameters.tagsMap.values(),
                ].map((tag) => ({
                    key: tag.id,
                    label: tag.label,
                })),
            },
        },
        {
            accessorKey: "idFile",
            header: "Pièce justificative",
            cell: ({ row }) => {
                if (row.original.idFile === null) return <FormatNull />
                const file = parameters.filesMap.get(row.original.idFile)
                if (!file) return <FormatNull />
                return (
                    <Button
                        onClick={() =>
                            applicationRouter.navigate({
                                to: "/organisation/$idOrganization/fichier/$idFile",
                                params: {
                                    idOrganization: parameters.idOrganization,
                                    idFile: file.id,
                                },
                            })
                        }
                    >
                        <LinkContent>{file.name}</LinkContent>
                    </Button>
                )
            },
            filterFn: "includesString",
        },
        {
            accessorKey: "createdAt",
            header: "Ajouté le",
            cell: ({ row }) => <FormatDateTime date={row.original.createdAt} />,
            filterFn: "includesString",
        },
        {
            accessorKey: "lastUpdatedAt",
            header: "Dernière mise à jour le",
            cell: ({ row }) => <FormatDateTime date={row.original.lastUpdatedAt} />,
            filterFn: "includesString",
        },
        {
            accessorKey: "actions",
            header: " ",
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <EntryClearedToggle entry={row.original}>
                    <Button>
                        <ButtonGhostContent
                            leftIcon={row.original.isCleared ? <IconCircleX /> : <IconCircleCheck />}
                            text={undefined}
                            title={row.original.isCleared ? "Dépointer" : "Pointer"}
                        />
                    </Button>
                </EntryClearedToggle>
            ),
        },
    ]
}
