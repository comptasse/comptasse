import {
    connectEntryLinesToMatchingRouteDefinition,
    createOneMatchingRouteDefinition,
    deleteOneMatchingRouteDefinition,
    readAllEntriesRouteDefinition,
    readAllEntryLinesRouteDefinition,
    readAllMatchingsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, InputSelect, toast } from "@comptasse/ui"
import { IconLink, IconUnlink } from "@tabler/icons-react"
import type { JSX } from "react"
import { useState } from "react"
import type * as v from "valibot"
import { useRightPanel } from "../../../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../../../utilities/invalidateData.js"

type EntryLine = v.InferOutput<typeof returnedSchemas.entryLine>
type Matching = v.InferOutput<typeof returnedSchemas.matching>

async function refresh(idYear: string) {
    await Promise.all([
        invalidateData({
            routeDefinition: readAllEntryLinesRouteDefinition,
            body: {
                idYear: idYear,
            },
        }),
        invalidateData({
            routeDefinition: readAllMatchingsRouteDefinition,
            body: {
                idYear: idYear,
            },
        }),
        invalidateData({
            routeDefinition: readAllEntriesRouteDefinition,
            body: {
                idYear: idYear,
            },
        }),
    ])
}

function EntryLineMatchingForm(props: { entryLine: EntryLine; matchings: Array<Matching> }) {
    const { closePanel } = useRightPanel()
    const [selectedMatchingId, setSelectedMatchingId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const currentMatching = props.entryLine.idMatching
        ? (props.matchings.find((matching) => matching.id === props.entryLine.idMatching) ?? null)
        : null
    const availableMatchings = props.matchings.filter((matching) => matching.idAccount === props.entryLine.idAccount)

    async function generate() {
        setIsSubmitting(true)
        try {
            const response = await getResponseBodyFromAPI({
                routeDefinition: createOneMatchingRouteDefinition,
                body: {
                    idYear: props.entryLine.idYear,
                    idAccount: props.entryLine.idAccount,
                    entryLineIds: [
                        props.entryLine.id,
                    ],
                },
            })
            if (response.ok === false) {
                toast({
                    title: "Impossible de créer le lettrage",
                    variant: "error",
                })
                return
            }
            await refresh(props.entryLine.idYear)
            toast({
                title: "Lettrage créé",
                variant: "success",
            })
            closePanel()
        } finally {
            setIsSubmitting(false)
        }
    }

    async function connect() {
        if (!selectedMatchingId) {
            toast({
                title: "Sélectionnez un lettrage",
                variant: "error",
            })
            return
        }
        setIsSubmitting(true)
        try {
            const response = await getResponseBodyFromAPI({
                routeDefinition: connectEntryLinesToMatchingRouteDefinition,
                body: {
                    idYear: props.entryLine.idYear,
                    idMatching: selectedMatchingId,
                    entryLineIds: [
                        props.entryLine.id,
                    ],
                },
            })
            if (response.ok === false) {
                toast({
                    title: "Impossible de connecter le mouvement",
                    variant: "error",
                })
                return
            }
            await refresh(props.entryLine.idYear)
            toast({
                title: "Mouvement lettré",
                variant: "success",
            })
            closePanel()
        } finally {
            setIsSubmitting(false)
        }
    }

    async function remove() {
        if (!currentMatching) return
        setIsSubmitting(true)
        try {
            const response = await getResponseBodyFromAPI({
                routeDefinition: deleteOneMatchingRouteDefinition,
                body: {
                    idYear: props.entryLine.idYear,
                    idMatching: currentMatching.id,
                },
            })
            if (response.ok === false) {
                toast({
                    title: "Impossible de supprimer le lettrage",
                    variant: "error",
                })
                return
            }
            await refresh(props.entryLine.idYear)
            toast({
                title: "Lettrage supprimé",
                variant: "success",
            })
            closePanel()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                width: "100%",
            }}
        >
            {currentMatching ? (
                <>
                    <div>{`Ce mouvement est lettré : ${currentMatching.code}`}</div>
                    <Button
                        hasLoader={isSubmitting}
                        onClick={remove}
                    >
                        <ButtonPlainContent
                            color="danger"
                            leftIcon={<IconUnlink />}
                            text="Supprimer le lettrage"
                        />
                    </Button>
                </>
            ) : (
                <>
                    <Button
                        hasLoader={isSubmitting}
                        onClick={generate}
                    >
                        <ButtonPlainContent
                            leftIcon={<IconLink />}
                            text="Générer un lettrage"
                        />
                    </Button>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                        }}
                    >
                        <InputSelect
                            value={selectedMatchingId}
                            onChange={(value) => setSelectedMatchingId(value ?? null)}
                            options={availableMatchings.map((matching) => ({
                                key: matching.id,
                                label: matching.code,
                            }))}
                            placeholder="Connecter à un lettrage existant"
                            allowEmpty={true}
                        />
                        <Button
                            hasLoader={isSubmitting}
                            onClick={connect}
                        >
                            <ButtonOutlineContent
                                leftIcon={<IconLink />}
                                text="Connecter"
                            />
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}

/** Per-line action: generate a new matching or connect to an existing one. */
export function EntryLineMatching(props: { entryLine: EntryLine; matchings: Array<Matching>; children: JSX.Element }) {
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
                    <EntryLineMatchingForm
                        entryLine={props.entryLine}
                        matchings={props.matchings}
                    />,
                    "Lettrage",
                )
            }
        >
            {props.children}
        </Button>
    )
}
