import {
    deleteOneMatchingRouteDefinition,
    readAllEntryLinesRouteDefinition,
    readAllMatchingsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import {
    Button,
    ButtonGhostContent,
    ButtonPlainContent,
    FormatDateTime,
    FormatNull,
    FormatText,
    toast,
} from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconLink, IconTrash } from "@tabler/icons-react"
import type { JSX } from "react"
import { useState } from "react"
import type * as v from "valibot"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"

type Matching = v.InferOutput<typeof returnedSchemas.matching>

function MatchingsList(props: { idYear: string; matchings: Array<Matching>; accountLabelById: Map<string, string> }) {
    const { closePanel } = useRightPanel()
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

    async function remove(idMatching: string) {
        setIsSubmitting(idMatching)
        try {
            const response = await getResponseBodyFromAPI({
                routeDefinition: deleteOneMatchingRouteDefinition,
                body: {
                    idYear: props.idYear,
                    idMatching: idMatching,
                },
            })
            if (response.ok === false) {
                toast({
                    title: "Impossible de supprimer le lettrage",
                    variant: "error",
                })
                return
            }
            await Promise.all([
                invalidateData({
                    routeDefinition: readAllMatchingsRouteDefinition,
                    body: {
                        idYear: props.idYear,
                    },
                }),
                invalidateData({
                    routeDefinition: readAllEntryLinesRouteDefinition,
                    body: {
                        idYear: props.idYear,
                    },
                }),
            ])
            toast({
                title: "Lettrage supprimé",
                variant: "success",
            })
        } finally {
            setIsSubmitting(null)
        }
    }

    if (props.matchings.length === 0) {
        return <FormatNull text="Aucun lettrage" />
    }

    const sortedMatchings = [
        ...props.matchings,
    ].sort((a, b) => a.code.localeCompare(b.code))

    return (
        <div
            className={css({
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                width: "100%",
            })}
        >
            {sortedMatchings.map((matching) => (
                <div
                    key={matching.id}
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
                        <FormatText>{matching.code}</FormatText>
                        <FormatText
                            className={{
                                color: "neutral/50",
                            }}
                        >
                            {props.accountLabelById.get(matching.idAccount) ?? ""}
                        </FormatText>
                        <span
                            className={css({
                                fontSize: "xs",
                                color: "neutral/50",
                            })}
                        >
                            <FormatDateTime date={matching.createdAt} />
                        </span>
                    </div>
                    <Button
                        hasLoader={isSubmitting === matching.id}
                        onClick={() => remove(matching.id)}
                    >
                        <ButtonPlainContent
                            color="danger"
                            leftIcon={<IconTrash />}
                            text={undefined}
                        />
                    </Button>
                </div>
            ))}
            <Button onClick={closePanel}>
                <ButtonGhostContent text="Fermer" />
            </Button>
        </div>
    )
}

/** “Lettrages” button listing the year's matchings. */
export function EntriesMatchings(props: {
    idYear: string
    matchings: Array<Matching>
    accountLabelById: Map<string, string>
    children?: JSX.Element
}) {
    const { openPanel } = useRightPanel()

    return (
        <Button
            className={{
                padding: "0",
                border: "none",
                backgroundColor: "transparent",
                width: "fit-content",
                height: "fit-content",
            }}
            onClick={() =>
                openPanel(
                    <MatchingsList
                        idYear={props.idYear}
                        matchings={props.matchings}
                        accountLabelById={props.accountLabelById}
                    />,
                    "Lettrages",
                )
            }
        >
            {props.children ?? (
                <ButtonGhostContent
                    leftIcon={<IconLink />}
                    text="Lettrages"
                />
            )}
        </Button>
    )
}
