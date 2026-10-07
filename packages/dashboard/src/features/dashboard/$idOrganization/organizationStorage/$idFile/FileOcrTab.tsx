import { readAllFilesRouteDefinition } from "@comptasse/application-metadata/routes"
import { CircularLoader, FormatError, FormatNull } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useQuery } from "@tanstack/react-query"
import { resolveApiBaseUrl } from "../../../../../utilities/resolveApiBaseUrl.js"
import { resolveOrganizationId } from "../../../../../utilities/resolveOrganizationId.js"
import { useDataFromAPI } from "../../../../../utilities/useHTTPData.js"

/** Read-only view of the OCR markdown generated from this file. */
export function FileOcrTab(props: { idOrganization: string; idFile: string }) {
    const filesResponse = useDataFromAPI({
        routeDefinition: readAllFilesRouteDefinition,
        body: {},
    })
    const ocrFile = filesResponse.data?.find((file) => file.idFileParent === props.idFile) ?? null

    const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
    const orgId = resolveOrganizationId() ?? props.idOrganization
    const downloadUrl =
        ocrFile !== null && apiBaseUrl !== undefined
            ? `${apiBaseUrl}/organizations/${orgId}/years/:idYear/files/${ocrFile.id}/content`
            : undefined

    const contentQuery = useQuery({
        queryKey: [
            "file-ocr-content",
            ocrFile?.id,
        ],
        enabled: ocrFile !== null && downloadUrl !== undefined,
        queryFn: async ({ signal }) => {
            const response = await fetch(downloadUrl!, {
                signal,
                credentials: "include",
                headers: {
                    "X-Organization-Id": orgId,
                },
            })
            if (!response.ok) {
                throw new Error("Impossible de récupérer le texte OCR")
            }
            const bytes = await response.arrayBuffer()
            return new TextDecoder("utf-8").decode(bytes)
        },
        staleTime: Infinity,
    })

    if (filesResponse.isPending) {
        return <CircularLoader text="Chargement..." />
    }
    if (filesResponse.data === undefined) {
        return <FormatError text="Impossible de charger les fichiers." />
    }
    if (ocrFile === null) {
        return <FormatNull text="Aucun texte OCR n'a été extrait pour ce fichier." />
    }
    if (contentQuery.isPending) {
        return <CircularLoader text="Chargement du texte OCR..." />
    }
    if (contentQuery.isError) {
        return <FormatError text="Impossible d'afficher le texte OCR." />
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
            {contentQuery.data ?? ""}
        </pre>
    )
}
