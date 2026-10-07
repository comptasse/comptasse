import {
    addOneEntryTagRouteDefinition,
    readAllEntryTagsRouteDefinition,
    removeOneEntryTagRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonGhostContent, FormatNull, FormatText, InputCombobox, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconLinkOff } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { useState } from "react"
import type * as v from "valibot"
import { DataBlock } from "../../../../../components/layouts/dataBlock/dataBlock.tsx"
import { Section } from "../../../../../components/layouts/section/section.tsx"
import { getResponseBodyFromAPI } from "../../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../../utilities/invalidateData.js"
import type { YearDataKey } from "../../YearDataWrapper.tsx"
import { YearDataWrapper } from "../../YearDataWrapper.tsx"

const requiredKeys = [
    "entries",
    "entryTags",
    "tags",
] as const satisfies readonly YearDataKey[]

export function EntryCategoriesTab(props: { idYear?: string; idEntry?: string } = {}) {
    const params = useParams({
        strict: false,
    }) as {
        idYear?: string
        idEntry?: string
    }
    const idYear = props.idYear ?? params.idYear ?? ""
    const idEntry = props.idEntry ?? params.idEntry ?? ""

    return (
        <YearDataWrapper
            idYear={idYear}
            requiredKeys={requiredKeys}
        >
            {({ entries, entryTags, tags }) => {
                const entry = entries.find((r) => r.id === idEntry)
                if (entry === undefined) return null

                return (
                    <EntryCategoriesTabContent
                        entry={entry}
                        entryTags={entryTags}
                        tags={tags}
                        idYear={idYear}
                    />
                )
            }}
        </YearDataWrapper>
    )
}

function EntryCategoriesTabContent(props: {
    entry: v.InferOutput<typeof returnedSchemas.entry>
    entryTags: v.InferOutput<typeof returnedSchemas.entryTag>[]
    tags: v.InferOutput<typeof returnedSchemas.tag>[]
    idYear: string
}) {
    const [isAdding, setIsAdding] = useState(false)
    const [isRemoving, setIsRemoving] = useState<string | null>(null)

    const currentEntryTags = props.entryTags.filter((et) => et.idEntry === props.entry.id)
    const currentTagIds = new Set(currentEntryTags.map((et) => et.idTag))
    const resolvedTags = currentEntryTags
        .map((et) => {
            const tag = props.tags.find((t) => t.id === et.idTag)
            return tag
                ? {
                      entryTagId: et.id,
                      tagId: tag.id,
                      label: tag.label,
                  }
                : null
        })
        .filter((t): t is NonNullable<typeof t> => t !== null)

    const availableTags: Array<{
        key: string
        label: string
    }> = []
    for (const t of props.tags) {
        if (!currentTagIds.has(t.id)) {
            availableTags.push({
                key: t.id,
                label: t.label,
            })
        }
    }

    const handleAddTag = async (idTag: string | null | undefined) => {
        if (!idTag) return
        if (currentTagIds.has(idTag)) return
        setIsAdding(true)
        const response = await getResponseBodyFromAPI({
            routeDefinition: addOneEntryTagRouteDefinition,
            body: {
                idYear: props.idYear,
                idEntry: props.entry.id,
                idTag,
            },
        })
        if (response.ok === false) {
            toast({
                title: "Impossible d'ajouter la catégorie",
                variant: "error",
            })
        } else {
            toast({
                title: "Catégorie ajoutée",
                variant: "success",
            })
            await invalidateData({
                routeDefinition: readAllEntryTagsRouteDefinition,
                body: {
                    idYear: props.idYear,
                },
            })
        }
        setIsAdding(false)
    }

    const handleRemoveTag = async (entryTagId: string) => {
        setIsRemoving(entryTagId)
        const response = await getResponseBodyFromAPI({
            routeDefinition: removeOneEntryTagRouteDefinition,
            body: {
                idYear: props.idYear,
                idEntryTag: entryTagId,
            },
        })
        if (response.ok === false) {
            toast({
                title: "Impossible de retirer la catégorie",
                variant: "error",
            })
        } else {
            toast({
                title: "Catégorie retirée",
                variant: "success",
            })
            await invalidateData({
                routeDefinition: readAllEntryTagsRouteDefinition,
                body: {
                    idYear: props.idYear,
                },
            })
        }
        setIsRemoving(null)
    }

    return (
        <Section.Item
            className={css({
                flexDirection: "column",
                gap: "1rem",
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
                <InputCombobox
                    value={null}
                    onChange={handleAddTag}
                    placeholder="Ajouter une catégorie"
                    allowEmpty={true}
                    options={availableTags}
                    isLoading={false}
                    isDisabled={isAdding}
                    className={{
                        width: "100%",
                        maxWidth: "400px",
                    }}
                />
            </div>
            <DataBlock.Root>
                <DataBlock.Header title="Catégories" />
                <DataBlock.Content>
                    {resolvedTags.length === 0 ? (
                        <div
                            className={css({
                                padding: "1rem",
                            })}
                        >
                            <FormatNull text="Aucune catégorie associée" />
                        </div>
                    ) : (
                        resolvedTags.map((tag) => (
                            <div
                                key={tag.entryTagId}
                                className={css({
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.5rem",
                                    borderBottom: "1px solid",
                                    borderBottomColor: "neutral/5",
                                    _last: {
                                        borderBottom: "none",
                                    },
                                })}
                            >
                                <FormatText>{tag.label}</FormatText>
                                <Button
                                    onClick={() => handleRemoveTag(tag.entryTagId)}
                                    isDisabled={isRemoving === tag.entryTagId}
                                >
                                    <ButtonGhostContent
                                        leftIcon={<IconLinkOff />}
                                        color="danger"
                                    />
                                </Button>
                            </div>
                        ))
                    )}
                </DataBlock.Content>
            </DataBlock.Root>
        </Section.Item>
    )
}
