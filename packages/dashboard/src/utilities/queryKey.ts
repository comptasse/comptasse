import { resolveOrganizationId } from "./resolveOrganizationId.js"

/**
 * Builds the canonical React Query key for an API route.
 *
 * The key is always `[path, body, params]`. The effective path params are
 * resolved the same way `getResponseBodyFromAPI` does: when the route path
 * contains `:idOrganization` and neither `params` nor `body` provides it, the
 * active organization is read from the cookie so every layer (useDataFromAPI,
 * YearDataWrapper, prefetchYearData, invalidateData) agrees on the same key and
 * reuses the same cache entry.
 */
export function buildQueryKey(
    routeDefinition: { path: string },
    body: Record<string, unknown>,
    params?: Record<string, string>,
) {
    const resolvedParams: Record<string, string> = params ? { ...params } : {}
    if (
        routeDefinition.path.includes(":idOrganization") &&
        resolvedParams.idOrganization === undefined &&
        body.idOrganization === undefined
    ) {
        const idOrganization = resolveOrganizationId()
        if (idOrganization) {
            resolvedParams.idOrganization = idOrganization
        }
    }

    return [
        routeDefinition.path,
        body,
        resolvedParams,
    ] as const
}