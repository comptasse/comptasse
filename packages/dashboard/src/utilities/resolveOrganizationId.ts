import { getCookie } from "./cookies/getCookie.js"
import { cookiePrefix } from "./variables.js"

/**
 * Resolves the active organization id on the client.
 *
 * The current route (`/organisation/$idOrganization/...`) is authoritative for
 * route-scoped requests, so it is preferred. It falls back to the
 * `comptasse_id_organization` cookie, which may be absent (fresh browser or
 * profile, cleared storage, opening an organization directly by URL, ...).
 *
 * Without this fallback, mutation requests that do not pass `idOrganization`
 * explicitly (folder/file create-update-delete, ...) leave the literal
 * `:idOrganization` in the URL and send no `X-Organization-Id` header, which
 * the API rejects with "No organization context found in the request".
 */
export function resolveOrganizationId(): string | undefined {
    if (typeof window !== "undefined") {
        const match = window.location.pathname.match(/\/organisation\/([^/?#]+)/)
        if (match?.[1]) {
            try {
                return decodeURIComponent(match[1])
            } catch {
                return match[1]
            }
        }
    }

    return getCookie(`${cookiePrefix}_id_organization`)
}
