import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { CircularLoader, FormatError } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type * as v from "valibot"
import { resolveApiBaseUrl } from "../../../../../utilities/resolveApiBaseUrl.js"
import { resolveOrganizationId } from "../../../../../utilities/resolveOrganizationId.js"

function MarkdownFileContent(props: { downloadUrl: string; orgId: string; fileId: string }) {
    const query = useQuery({
        queryKey: [
            "file-content",
            props.fileId,
        ],
        queryFn: async ({ signal }) => {
            const response = await fetch(props.downloadUrl, {
                signal,
                credentials: "include",
                headers: {
                    "X-Organization-Id": props.orgId,
                },
            })
            if (!response.ok) {
                throw new Error("Impossible de récupérer le fichier")
            }
            const bytes = await response.arrayBuffer()
            return new TextDecoder("utf-8").decode(bytes)
        },
        staleTime: Infinity,
    })

    if (query.isPending) {
        return <CircularLoader text="Affichage du markdown..." />
    }
    if (query.isError) {
        return <FormatError text="Impossible d'afficher le contenu markdown." />
    }

    return (
        <pre
            className={css({
                width: "100%",
                minH: "fit",
                height: "768px",
                maxH: "768px",
                border: "1px solid",
                borderColor: "neutral/20",
                borderRadius: "md",
                padding: "4",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                lineHeight: "1.5",
                color: "neutral",
            })}
        >
            {query.data ?? ""}
        </pre>
    )
}

function BinaryFileContent(props: {
    downloadUrl: string
    orgId: string
    file: v.InferOutput<typeof returnedSchemas.file>
}) {
    // `X-Organization-Id` cannot be sent by an <embed>, so fetch the file as a blob.
    const query = useQuery({
        queryKey: [
            "file-blob",
            props.file.id,
            props.file.type,
        ],
        queryFn: async ({ signal }) => {
            const response = await fetch(props.downloadUrl, {
                signal,
                credentials: "include",
                headers: {
                    "X-Organization-Id": props.orgId,
                },
            })
            if (!response.ok) {
                throw new Error("Impossible de récupérer le fichier")
            }
            const buffer = await response.arrayBuffer()
            return new Blob([
                buffer,
            ], {
                type: props.file.type ?? "application/octet-stream",
            })
        },
        staleTime: Infinity,
    })

    const [objectUrl, setObjectUrl] = useState<string | null>(null)
    useEffect(() => {
        if (!query.data) {
            setObjectUrl(null)
            return
        }
        const url = URL.createObjectURL(query.data)
        setObjectUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [
        query.data,
    ])

    if (query.isError) {
        return <FormatError text="Impossible d'afficher le fichier." />
    }
    if (query.isPending || objectUrl === null) {
        return <CircularLoader text="Chargement du fichier..." />
    }

    return (
        <embed
            title={props.file.reference ?? undefined}
            className={css({
                width: "100%",
                minH: "fit",
                height: "768px",
                maxH: "768px",
                border: "1px solid",
                borderColor: "neutral/20",
                borderRadius: "md",
                padding: "4",
            })}
            src={objectUrl}
            type={props.file.type ?? undefined}
        />
    )
}

export function FileFile(props: { file: v.InferOutput<typeof returnedSchemas.file> }) {
    const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
    const orgId = resolveOrganizationId() ?? props.file.idOrganization

    if (props.file.storageKey === null) {
        return <FormatError text="Ce fichier n'a pas de contenu associé." />
    }
    if (apiBaseUrl === undefined) {
        return <FormatError text="L'API n'est pas configurée." />
    }

    const downloadUrl = `${apiBaseUrl}/organizations/${orgId}/years/:idYear/files/${props.file.id}/content`

    if (props.file.type?.startsWith("text/markdown")) {
        return (
            <MarkdownFileContent
                downloadUrl={downloadUrl}
                orgId={orgId}
                fileId={props.file.id}
            />
        )
    }

    return (
        <BinaryFileContent
            downloadUrl={downloadUrl}
            orgId={orgId}
            file={props.file}
        />
    )
}
