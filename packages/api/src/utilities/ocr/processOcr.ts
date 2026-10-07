import { createHash } from "node:crypto"
import { generateId, models } from "@comptasse/application-metadata"
import { and, eq, or, sql } from "drizzle-orm"
import { Exception } from "../exception.js"
import type { getClients } from "../getClients.js"
import type { getEnv } from "../getEnv.js"
import { insertOne } from "../sql/insertOne.js"
import { updateOne } from "../sql/updateOne.js"
import { getObject } from "../storage/getObject.js"
import { putObject } from "../storage/putObject.js"

function fixCommonMojibake(text: string) {
    if (!/[Ãâ€]/.test(text)) {
        return text
    }
    const repaired = Buffer.from(text, "latin1").toString("utf-8")
    return repaired.includes("�") ? text : repaired
}

interface ProcessOcrParams {
    var: {
        env: ReturnType<typeof getEnv>
        clients: Awaited<ReturnType<typeof getClients>>
    }
    idOrganization: string
    idUser: string
    sourceFile: {
        id: string
        idFolder: string | null
        reference: string | null
        name: string | null
        storageKey: string | null
        type: string | null
    }
}

interface ProcessOcrResult {
    ocrFile: typeof models.file.$inferSelect
    markdownContent: string
}

export async function processOcr(params: ProcessOcrParams): Promise<ProcessOcrResult> {
    const { idOrganization, idUser, sourceFile } = params

    console.log(
        `[processOcr] Starting OCR for file "${sourceFile.name}" (id=${sourceFile.id}, type=${sourceFile.type}, storageKey=${sourceFile.storageKey})`,
    )

    if (!sourceFile.storageKey) {
        throw new Exception({
            internalMessage: "File has no storage key",
            statusCode: 400,
            externalMessage: "Le fichier source n'a pas de contenu associé",
        })
    }

    const ocrApiKey = params.var.env.OCR_API_KEY
    if (!ocrApiKey) {
        throw new Exception({
            internalMessage: "OCR API key is not configured",
            statusCode: 400,
            externalMessage: "L'OCR n'est pas configurée (clé API manquante)",
        })
    }

    const ocrEndpoint = params.var.env.OCR_ENDPOINT
    const ocrModel = params.var.env.OCR_MODEL

    const mimeType = sourceFile.type ?? "application/octet-stream"
    const isImage = mimeType.startsWith("image/")
    const isPdf = mimeType === "application/pdf"

    if (!isImage && !isPdf) {
        throw new Exception({
            internalMessage: `Unsupported OCR file type: ${mimeType}`,
            statusCode: 400,
            externalMessage: "Le format du fichier n'est pas compatible avec l'OCR (image ou PDF uniquement)",
        })
    }

    console.log(`[processOcr] Downloading file from S3 (storageKey=${sourceFile.storageKey})`)
    const storageResponse = await getObject({
        var: params.var,
        storageKey: sourceFile.storageKey,
    })

    const fileBytes = await storageResponse.Body?.transformToByteArray()
    console.log(`[processOcr] Downloaded ${fileBytes?.length ?? 0} bytes from S3`)
    if (!fileBytes) {
        throw new Exception({
            internalMessage: "Failed to read file from storage",
            statusCode: 500,
            externalMessage: "Impossible de lire le fichier source",
        })
    }

    const base64Content = Buffer.from(fileBytes).toString("base64")
    const dataUri = `data:${mimeType};base64,${base64Content}`

    const document = isImage
        ? {
              type: "image_url" as const,
              image_url: dataUri,
          }
        : {
              type: "document_url" as const,
              document_url: dataUri,
          }

    console.log(`[processOcr] Sending to OCR API (document type: ${document.type}, endpoint: ${ocrEndpoint})`)
    const ocrResponse = await fetch(ocrEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ocrApiKey}`,
        },
        body: JSON.stringify({
            model: ocrModel,
            document,
        }),
    })

    if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text().catch(() => "")
        throw new Exception({
            internalMessage: `OCR error: ${ocrResponse.status} ${errorText}`,
            statusCode: 500,
            externalMessage: "Erreur lors de l'extraction de texte",
        })
    }

    const ocrResult = (await ocrResponse.json()) as {
        pages?: Array<{
            markdown: string
        }>
    }

    const extractedPagesCount = ocrResult.pages?.length ?? 0
    console.log(`[processOcr] OCR returned ${extractedPagesCount} pages`)
    if (extractedPagesCount <= 0) {
        throw new Exception({
            internalMessage: "OCR returned no pages",
            statusCode: 500,
            externalMessage: "L'extraction OCR n'a retourné aucune page",
        })
    }

    const markdownContent = ocrResult.pages?.map((p) => p.markdown).join("\n\n---\n\n")
    if (!markdownContent) {
        throw new Exception({
            internalMessage: "OCR returned no content",
            statusCode: 500,
            externalMessage: "L'extraction de texte n'a retourné aucun résultat",
        })
    }

    const normalizedMarkdownContent = fixCommonMojibake(markdownContent)
    const markdownBuffer = Buffer.from(normalizedMarkdownContent, "utf-8")
    const ocrHash = createHash("sha256").update(markdownBuffer).digest("hex")

    // Reuse an already generated OCR file for this source, or adopt an existing
    // one with the same content (e.g. generated before the parent link existed).
    const existingOcrFiles = await params.var.clients.sql
        .select()
        .from(models.file)
        .where(
            and(
                eq(models.file.idOrganization, idOrganization),
                or(eq(models.file.idFileParent, sourceFile.id), eq(models.file.hash, ocrHash)),
            ),
        )
        .limit(1)

    if (existingOcrFiles.length > 0 && existingOcrFiles[0]) {
        const existing = existingOcrFiles[0]
        if (existing.idFileParent === null) {
            await updateOne({
                database: params.var.clients.sql,
                table: models.file,
                data: {
                    idFileParent: sourceFile.id,
                },
                where: (table) => eq(table.id, existing.id),
            })
        }
        console.log(`[processOcr] OCR file already exists (id=${existing.id}), reusing it`)

        return {
            ocrFile: {
                ...existing,
                idFileParent: sourceFile.id,
            },
            markdownContent: normalizedMarkdownContent,
        }
    }

    const newFileId = generateId()
    const originalName = sourceFile.name ?? sourceFile.reference ?? "document"
    const baseName = originalName.replace(/\.[^.]+$/, "")
    const markdownName = `${baseName}.md`
    const storageKey = `organizations/${idOrganization}/storage/${newFileId}`

    const ocrFile = await insertOne({
        database: params.var.clients.sql,
        table: models.file,
        data: {
            id: newFileId,
            idOrganization: idOrganization,
            idFolder: sourceFile.idFolder,
            idFileParent: sourceFile.id,
            reference: null,
            name: markdownName,
            storageKey: storageKey,
            type: "text/markdown",
            size: markdownBuffer.length,
            hash: ocrHash,
            createdAt: new Date().toISOString(),
            createdBy: idUser,
        },
    })

    await putObject({
        var: params.var,
        storageKey: storageKey,
        contentLength: markdownBuffer.length,
        contentType: "text/markdown; charset=utf-8",
        metadata: {
            idOrganization: idOrganization,
            idUser: idUser,
        },
        body: markdownBuffer,
    })

    await updateOne({
        database: params.var.clients.sql,
        table: models.organization,
        data: {
            storageCurrentUsage: sql`${models.organization.storageCurrentUsage} + ${markdownBuffer.length}`,
        },
        where: (table) => eq(table.id, idOrganization),
    })

    console.log(
        `[processOcr] OCR complete for "${sourceFile.name}" → ocrFile.id=${ocrFile.id}, storageKey=${storageKey}, markdownLen=${normalizedMarkdownContent.length}`,
    )
    return {
        ocrFile,
        markdownContent: normalizedMarkdownContent,
    }
}
