import { computeSHA256 } from "@comptasse/application-metadata"
import { readAllFilesRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, toast } from "@comptasse/ui"
import type { JSX } from "react"
import { useRef } from "react"
import type * as v from "valibot"
import { invalidateData } from "../../../../utilities/invalidateData.js"
import { resolveApiBaseUrl } from "../../../../utilities/resolveApiBaseUrl.js"
import { resolveOrganizationId } from "../../../../utilities/resolveOrganizationId.js"

const MAX_FILE_SIZE = 1024 * 1024 * 50

function referenceFromFileName(name: string): string {
    const dotIndex = name.lastIndexOf(".")
    return dotIndex > 0 ? name.slice(0, dotIndex) : name
}

async function uploadOneFile(params: {
    idOrganization: string
    idFolder?: string | null
    file: File
}): Promise<"added" | "error"> {
    const { file, idOrganization, idFolder } = params

    if (file.size > MAX_FILE_SIZE) {
        toast({
            title: `"${file.name}" dépasse la taille maximale de 50 Mo`,
            variant: "error",
        })
        return "error"
    }

    const hash = await computeSHA256(file)

    const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
    if (!apiBaseUrl) {
        toast({
            title: "Impossible d'envoyer le fichier",
            variant: "error",
        })
        return "error"
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("name", referenceFromFileName(file.name))
    formData.append("reference", referenceFromFileName(file.name))
    formData.append("hash", hash)
    if (idFolder) {
        formData.append("idFolder", idFolder)
    }

    const orgId = resolveOrganizationId() ?? idOrganization

    const response = await fetch(`${apiBaseUrl}/organizations/${orgId}/years/:idYear/files`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
            "X-Organization-Id": orgId,
        },
    })

    if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        toast({
            title: `Impossible de créer "${file.name}"`,
            description: errorText,
            variant: "error",
        })
        return "error"
    }

    return "added"
}

export function CreateOneFile(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idFolder?: string | null
    children: JSX.Element
}) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    async function handleFiles(files: FileList) {
        const fileArray = Array.from(files)
        if (fileArray.length === 0) return

        const results = await Promise.all(
            fileArray.map((file) =>
                uploadOneFile({
                    idOrganization: props.idOrganization,
                    idFolder: props.idFolder,
                    file,
                }),
            ),
        )

        const added = results.filter((r) => r === "added").length
        const failed = results.filter((r) => r === "error").length

        if (added > 0) {
            await invalidateData({
                routeDefinition: readAllFilesRouteDefinition,
                body: {},
            })
        }

        if (failed > 0) {
            toast({
                title: `${added} fichier(s) ajouté(s), ${failed} en erreur`,
                variant: "error",
            })
        } else {
            toast({
                title: added === 1 ? "Fichier ajouté avec succès" : `${added} fichiers ajoutés avec succès`,
                variant: "success",
            })
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                multiple
                style={{
                    display: "none",
                }}
                onChange={(event) => {
                    if (event.target.files && event.target.files.length > 0) {
                        handleFiles(event.target.files)
                    }
                    event.target.value = ""
                }}
            />
            <Button onClick={() => inputRef.current?.click()}>{props.children}</Button>
        </>
    )
}
