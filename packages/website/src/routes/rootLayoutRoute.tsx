import type { readUserSessionRouteDefinition } from "@comptasse/application-metadata/routes"
import { CircularLoader } from "@comptasse/ui"
import { createRootRouteWithContext, useRouterState } from "@tanstack/react-router"
import { useEffect } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { SidebarContextProvider } from "../contexts/sidebar/SidebarContextProvider.tsx"
import { RootLayout } from "../features/RootLayout.js"
import { removeMetaTag, upsertCanonical, upsertMetaTag } from "../utilities/seoHead.js"

const DEFAULT_DESCRIPTION =
    "Logiciel de comptabilité open source pour les entreprises et associations françaises. Gérez vos écritures, comptes et documents comptables simplement."
const SITE_NAME = "Comptasse"
const BASE_URL = "https://comptasse.com"

function escapeJsonLd(value: unknown): string {
    return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
}

const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
}

function buildBreadcrumbJsonLd(pathname: string, title: string) {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return null

    const breadcrumbLabels: Record<string, string> = {
        documentation: "Documentation",
        comptabilité: "Comptabilité",
        comptes: "Comptes",
        classes: "Classes",
        liste: "Plan comptable",
        documents: "Documents",
        glossaire: "Glossaire",
        introduction: "Introduction",
        "partie-double": "La partie double",
        écritures: "Écritures",
        journal: "Journal",
        "grand-livre": "Grand livre",
        balance: "Balance",
        bilan: "Bilan",
        "compte-de-résultat": "Compte de résultat",
        annexe: "Annexe",
        dashboard: "Dashboard",
        devlog: "Devlog",
        démarrage: "Démarrage",
        organisations: "Organisations",
        exercices: "Exercices",
        stockage: "Stockage",
        api: "API",
        authentification: "Authentification",
        organisation: "Organisation",
        exercice: "Exercice",
        tarifs: "Tarifs",
        fonctionnalités: "Fonctionnalités",
        philosophie: "Philosophie",
        support: "Support",
        "mentions-légales": "Mentions légales",
        cgu: "CGU",
        confidentialité: "Confidentialité",
    }

    const items = segments.map((segment, index) => {
        const isLast = index === segments.length - 1
        // "/documentation" is a redirect: point the breadcrumb at the docs landing.
        const path =
            segment === "documentation" && !isLast
                ? "/documentation/fonctionnalités"
                : `/${segments.slice(0, index + 1).join("/")}`
        return {
            "@type": "ListItem",
            position: index + 1,
            name: isLast ? title : breadcrumbLabels[segment] || decodeURIComponent(segment),
            item: `${BASE_URL}${path}`,
        }
    })

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items,
    }
}

export const rootLayoutRoute = createRootRouteWithContext<{
    title: string | undefined
    section: string | undefined
    description: string | undefined
    robots: string | undefined
}>()({
    errorComponent: ({ error }) => (
        <div
            style={{
                padding: "2rem",
                fontFamily: "monospace",
            }}
        >
            <h2>Erreur</h2>
            <pre>{error?.message ?? String(error)}</pre>
        </div>
    ),
    pendingComponent: () => <CircularLoader />,
    beforeLoad: (_ctx) => {},
    component: function RootLayoutRouteComponent() {
        const matches = useRouterState({
            select: (s) => s.matches,
        })
        const pathname = useRouterState({
            select: (s) => s.location.pathname,
        })

        const reversedMatches = [
            ...matches,
        ].reverse()

        const matchWithTitle = reversedMatches.find((d) => d.context.title)
        const matchWithSection = reversedMatches.find((d) => d.context.section)
        const matchWithDescription = reversedMatches.find((d) => d.context.description)
        const matchWithRobots = reversedMatches.find((d) => d.context.robots)

        const rawTitle = matchWithTitle?.context.title || SITE_NAME
        const section = matchWithSection?.context.section
        const title =
            rawTitle === SITE_NAME
                ? SITE_NAME
                : section
                  ? `${rawTitle} - ${section} - ${SITE_NAME}`
                  : `${rawTitle} - ${SITE_NAME}`
        const description = matchWithDescription?.context.description || DEFAULT_DESCRIPTION
        const robots = matchWithRobots?.context.robots
        // Canonicals must match the sitemap exactly: sitemap/prerendered URLs
        // carry no trailing slash.  Without this normalization, a visit to
        // /page/ makes React rewrite the canonical to /page/ and Google
        // reports "Google chose a different canonical than the user".
        const canonicalPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "")
        const canonicalUrl = encodeURI(`${BASE_URL}${canonicalPath}`)
        const isHomePage = pathname === "/"
        const isDocPage = pathname.startsWith("/documentation")

        // JSON-LD: WebSite (homepage only)
        const websiteJsonLd = isHomePage
            ? {
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  name: SITE_NAME,
                  url: BASE_URL,
                  description: DEFAULT_DESCRIPTION,
                  inLanguage: "fr-FR",
              }
            : null

        // JSON-LD: SoftwareApplication (homepage only)
        const softwareJsonLd = isHomePage
            ? {
                  "@context": "https://schema.org",
                  "@type": "SoftwareApplication",
                  name: SITE_NAME,
                  url: BASE_URL,
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  description: DEFAULT_DESCRIPTION,
              }
            : null

        // JSON-LD: BreadcrumbList (documentation pages)
        const breadcrumbJsonLd = isDocPage ? buildBreadcrumbJsonLd(pathname, rawTitle) : null

        // The prerendered HTML already carries the head tags; here we only
        // update the existing elements on client-side navigation so React never
        // appends a second <title>/<link rel="canonical">.
        useEffect(() => {
            document.title = title
            upsertMetaTag("name", "description", description)
            upsertCanonical(canonicalUrl)
            upsertMetaTag("property", "og:title", title)
            upsertMetaTag("property", "og:description", description)
            upsertMetaTag("property", "og:url", canonicalUrl)
            upsertMetaTag("name", "twitter:title", title)
            upsertMetaTag("name", "twitter:description", description)
            if (robots) {
                upsertMetaTag("name", "robots", robots)
            } else {
                removeMetaTag("name", "robots")
            }
        }, [
            title,
            description,
            canonicalUrl,
            robots,
        ])

        return (
            <Fragment>
                {/* JSON-LD Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: escapeJsonLd(organizationJsonLd),
                    }}
                />
                {websiteJsonLd && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: escapeJsonLd(websiteJsonLd),
                        }}
                    />
                )}
                {softwareJsonLd && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: escapeJsonLd(softwareJsonLd),
                        }}
                    />
                )}
                {breadcrumbJsonLd && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: escapeJsonLd(breadcrumbJsonLd),
                        }}
                    />
                )}

                <SidebarContextProvider>
                    <RootLayout />
                </SidebarContextProvider>
            </Fragment>
        )
    },
})
