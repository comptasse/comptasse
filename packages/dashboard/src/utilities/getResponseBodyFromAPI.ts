import type { routeDefinition } from "@comptasse/application-metadata/utilities"
import { toast } from "@comptasse/ui"
import type * as v from "valibot"
import { ClientError } from "./clientError.js"
import { resolveApiBaseUrl } from "./resolveApiBaseUrl.js"
import { resolveOrganizationId } from "./resolveOrganizationId.js"
import { validate } from "./validate.js"

/**
 * Interpolates URL path params (e.g. `:idOrganization`) with values from the
 * `params` map, falling back to matching fields from `body`. Any remaining
 * body fields (not consumed as path params) are sent as query string for GET
 * requests, or as the JSON body for POST/PATCH/DELETE.
 */
export function buildUrl(
    apiBaseUrl: string,
    rawPath: string,
    params: Record<string, string> | undefined,
    body: Record<string, unknown>,
    method: "GET" | "POST" | "PATCH" | "DELETE",
): {
    url: URL
    remainingBody: Record<string, unknown>
} {
    let path = rawPath
    const consumed = new Set<string>()

    // Only tokens actually present in the path are substituted, and each token is
    // matched with a boundary so a shorter key (e.g. `id`) can never corrupt a
    // longer one (e.g. `:idOrganization`).
    const pathParamNames = [
        ...new Set(
            [
                ...rawPath.matchAll(/:([A-Za-z0-9_]+)/g),
            ].map((match) => match[1]),
        ),
    ]

    for (const name of pathParamNames) {
        // Interpolate explicit params first, then fall back to body fields so
        // callers don't need to duplicate fields in both body and params.
        const value = params?.[name] ?? body[name]
        if (value === undefined || value === null) continue
        path = path.replace(new RegExp(`:${name}(?![A-Za-z0-9_])`, "g"), encodeURIComponent(String(value)))
        consumed.add(name)
    }

    const url = new URL(`${apiBaseUrl}${path}`)
    const remaining = Object.fromEntries(Object.entries(body).filter(([k]) => !consumed.has(k)))

    if (method === "GET") {
        for (const [key, value] of Object.entries(remaining)) {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value))
            }
        }
    }

    return {
        url,
        remainingBody: remaining,
    }
}

export async function getResponseBodyFromAPI<
    TSchemaBody extends v.ObjectSchema<v.ObjectEntries, undefined>,
    TSchemaReturn extends
        | v.ObjectSchema<v.ObjectEntries, undefined>
        | v.ArraySchema<v.ObjectSchema<v.ObjectEntries, undefined>, undefined>,
>(parameters: {
    routeDefinition: ReturnType<typeof routeDefinition<string, TSchemaBody, TSchemaReturn>>
    body: v.InferOutput<TSchemaBody>
    /** URL path params to interpolate (e.g. `{ idOrganization: "abc" }` for `:idOrganization`) */
    params?: Record<string, string>
    signal?: AbortSignal
    hasToastMessage?: boolean
}) {
    const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

    if (!apiBaseUrl) {
        console.error(
            "API_BASE_URL is not defined. The request will not be sent. " +
                "Make sure the API_BASE_URL environment variable is set at runtime " +
                "(or VITE_API_BASE_URL at build time in development).",
        )
        return <const>{
            ok: false,
            data: undefined,
            error: new ClientError({
                message: "VITE_API_BASE_URL is not defined",
            }),
        }
    }

    const method = parameters.routeDefinition.method
    const abortController = parameters.signal ? undefined : new AbortController()
    const signal = parameters.signal ?? abortController!.signal
    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        }

        const idOrganization = resolveOrganizationId()
        if (idOrganization) {
            headers["X-Organization-Id"] = idOrganization
        }

        // For routes mounted under /organizations/:idOrganization, fall back to the
        // active organization cookie when the caller did not pass it explicitly.
        // This keeps nested Hono apps on the API side happy without requiring every
        // DataWrapper/Provider to forward the organization id.
        const params = parameters.params
            ? {
                  ...parameters.params,
              }
            : {}
        const body = parameters.body as Record<string, unknown>
        if (
            parameters.routeDefinition.path.includes(":idOrganization") &&
            params.idOrganization === undefined &&
            body.idOrganization === undefined &&
            idOrganization
        ) {
            params.idOrganization = idOrganization
        }

        const { url, remainingBody } = buildUrl(apiBaseUrl, parameters.routeDefinition.path, params, body, method)

        const response = await fetch(url, {
            method,
            headers,
            credentials: "include",
            body: method === "GET" ? undefined : JSON.stringify(remainingBody),
            signal,
        })
        if (response.ok) {
            const jsonResponse = JSON.parse((await response.text()) || "{}")
            const parsedData = validate({
                schema: parameters.routeDefinition.schemas.return,
                data: jsonResponse,
            })

            if (parsedData.success === false) {
                throw new ClientError({
                    message: "Error with the POST request body data validation",
                    rawError: parsedData.error,
                })
            }

            return <const>{
                ok: true,
                data: parsedData.data,
                error: undefined,
            }
        } else {
            const jsonResponse = JSON.parse((await response.text()) || "{}")
            throw new ClientError({
                message: `Error with the ${method} request response`,
                cause: jsonResponse.cause ?? jsonResponse.message,
            })
        }
    } catch (error: unknown) {
        abortController?.abort()

        if (parameters.hasToastMessage) {
            const clientError =
                error instanceof ClientError
                    ? error
                    : new ClientError({
                          rawError: error,
                      })

            let validationMessages: string | undefined
            try {
                const parsed = JSON.parse(clientError.cause ?? "")
                if (parsed?.nested && typeof parsed.nested === "object") {
                    validationMessages = Object.entries(parsed.nested as Record<string, string[]>)
                        .map(([field, errors]) => `${field}: ${errors.join(", ")}`)
                        .join(" | ")
                }
            } catch {
                // cause is not a JSON validation error string, ignore
            }

            if (validationMessages) {
                toast({
                    title: "Requête invalide",
                    description: validationMessages,
                    variant: "error",
                })
            } else {
                toast({
                    title: clientError.cause ?? "Erreur avec l'API.",
                    variant: "error",
                })
            }
        }

        return <const>{
            ok: false,
            data: undefined,
            error:
                error instanceof ClientError
                    ? error
                    : new ClientError({
                          rawError: error,
                      }),
        }
    }
}
