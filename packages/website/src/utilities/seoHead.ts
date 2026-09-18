type MetaAttribute = "name" | "property"

/**
 * Update an existing head meta tag, or create it if missing. Used on the
 * client to keep the server-rendered head in sync during SPA navigation
 * without ever appending a duplicate tag.
 */
export function upsertMetaTag(attribute: MetaAttribute, key: string, content: string): void {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
    if (!element) {
        element = document.createElement("meta")
        element.setAttribute(attribute, key)
        document.head.appendChild(element)
    }
    element.setAttribute("content", content)
}

export function removeMetaTag(attribute: MetaAttribute, key: string): void {
    document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove()
}

/**
 * Update the single canonical link in the document head, creating it only
 * when the served page did not provide one (e.g. the SPA shell fallback).
 */
export function upsertCanonical(href: string): void {
    let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!element) {
        element = document.createElement("link")
        element.setAttribute("rel", "canonical")
        document.head.appendChild(element)
    }
    element.setAttribute("href", href)
}
