import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { loadEnv, type Plugin, build as viteBuild } from "vite"
import { DOC_PAGE_MANIFEST } from "./DOC_PAGE_MANIFEST"
import {
    generateAccountMarkdown,
    generateGlossaryMarkdown,
    generateNavigationMarkdown,
    generateScenarioMarkdown,
    generateStaticDocPageMarkdown,
    listAccountSlugs,
    listGlossarySlugs,
    listScenarioIds,
} from "./docsMdDynamicContent"
import { docsSearchIndexPlugin } from "./docsSearchIndexPlugin"
import { mdGeneratePlugin } from "./mdGeneratePlugin"
import type { RenderedPage } from "./render"

export function prerenderPlugin(): Plugin {
    return {
        name: "prerender",
        async closeBundle() {
            if (process.env.BUILD_PRERENDER) return
            process.env.BUILD_PRERENDER = "1"

            try {
                const pkgRoot = resolve(__dirname, "..")
                const buildDir = resolve(pkgRoot, "build")
                const renderBuildDir = resolve(pkgRoot, "build-render")
                const env = loadEnv("production", pkgRoot, "VITE_")
                const baseUrl = env.VITE_WEBSITE_BASE_URL ?? "https://comptasse.com"
                const siteName = "Comptasse"

                const spaShell = readFileSync(resolve(buildDir, "index.html"), "utf-8")

                // Build a Node.js bundle of render.tsx so we can call renderToString() for each route
                await viteBuild({
                    root: resolve(pkgRoot, "src"),
                    base: "/",
                    envDir: pkgRoot,
                    plugins: [
                        react({
                            include: [
                                "**/*.tsx",
                            ],
                        }),
                        docsSearchIndexPlugin(),
                        mdGeneratePlugin(),
                    ],
                    build: {
                        ssr: "../plugins/render.tsx",
                        outDir: renderBuildDir,
                        emptyOutDir: true,
                        rollupOptions: {
                            output: {
                                entryFileNames: "render.js",
                                format: "es",
                            },
                        },
                    },
                    logLevel: "warn",
                })

                // Load the render bundle and generate static HTML for each route
                const renderBundleUrl = `file://${resolve(renderBuildDir, "render.js")}`
                const { render } = (await import(renderBundleUrl)) as {
                    render: (url: string) => Promise<RenderedPage>
                }

                // Redirect-only routes (they throw redirect() in beforeLoad) and
                // auth screens must not be prerendered: nginx serves them via
                // redirects / the SPA shell instead.
                const routes: string[] = [
                    "/",
                    ...DOC_PAGE_MANIFEST.map((e) => e.path).filter((p) => p !== "/documentation"),
                ]

                // Dynamic account slugs
                for (const slug of listAccountSlugs(pkgRoot)) {
                    routes.push(`/documentation/comptabilité/ressources/comptes/${slug}`)
                }

                // Dynamic glossary slugs
                for (const slug of listGlossarySlugs(pkgRoot)) {
                    routes.push(`/documentation/comptabilité/ressources/glossaire/${slug}`)
                }

                // Dynamic scenario ids (the route lives under /ressources/scénarios)
                for (const id of listScenarioIds(pkgRoot)) {
                    routes.push(`/documentation/comptabilité/ressources/scénarios/${id}`)
                }

                const results = await Promise.all(
                    routes.map(async (route) => {
                        try {
                            const { html: appHtml, title, description } = await render(route)
                            const escapeAttr = (value: string) =>
                                value
                                    .replace(/&/g, "&amp;")
                                    .replace(/</g, "&lt;")
                                    .replace(/>/g, "&gt;")
                                    .replace(/"/g, "&quot;")
                            const canonicalUrl = encodeURI(`${baseUrl}${route}`)
                            // Replace the whole per-page SEO region in one shot so a
                            // prerendered file can never contain two canonical links.
                            const seoBlock = [
                                `<title>${escapeAttr(title)}</title>`,
                                `<meta name="description" content="${escapeAttr(description)}" />`,
                                `<link rel="canonical" href="${canonicalUrl}" />`,
                                `<meta property="og:title" content="${escapeAttr(title)}" />`,
                                `<meta property="og:description" content="${escapeAttr(description)}" />`,
                                `<meta property="og:type" content="website" />`,
                                `<meta property="og:url" content="${canonicalUrl}" />`,
                                `<meta property="og:locale" content="fr_FR" />`,
                                `<meta property="og:site_name" content="${siteName}" />`,
                                `<meta name="twitter:card" content="summary_large_image" />`,
                                `<meta name="twitter:site" content="@comptasse" />`,
                                `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
                                `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
                            ].join("\n        ")
                            let html = spaShell.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, seoBlock)
                            html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

                            const outFile =
                                route === "/"
                                    ? resolve(buildDir, "index.html")
                                    : resolve(buildDir, route.slice(1), "index.html")
                            mkdirSync(dirname(outFile), {
                                recursive: true,
                            })
                            writeFileSync(outFile, html, "utf-8")
                            return 1
                        } catch (err) {
                            console.warn(`[prerender] Failed to render ${route}:`, err)
                            return 0
                        }
                    }),
                )
                const count = results.reduce((sum: number, n) => sum + n, 0)

                // Generate .md files for static doc pages
                for (const entry of DOC_PAGE_MANIFEST) {
                    const content = generateStaticDocPageMarkdown(pkgRoot, entry.path, baseUrl)
                    if (!content) continue
                    const mdOutPath = `${entry.path.slice(1)}.md`
                    const mdOutFile = resolve(buildDir, mdOutPath)
                    mkdirSync(dirname(mdOutFile), {
                        recursive: true,
                    })
                    writeFileSync(mdOutFile, content, "utf-8")
                }

                // Generate .md files for dynamic account pages
                for (const slug of listAccountSlugs(pkgRoot)) {
                    const content = generateAccountMarkdown(pkgRoot, slug, baseUrl)
                    if (!content) continue
                    const mdOutFile = resolve(buildDir, `documentation/comptabilité/ressources/comptes/${slug}.md`)
                    mkdirSync(dirname(mdOutFile), {
                        recursive: true,
                    })
                    writeFileSync(mdOutFile, content, "utf-8")
                }

                // Generate .md files for dynamic scenario pages
                for (const id of listScenarioIds(pkgRoot)) {
                    const content = generateScenarioMarkdown(pkgRoot, id, baseUrl)
                    if (!content) continue
                    const mdOutFile = resolve(buildDir, `documentation/comptabilité/ressources/scénarios/${id}.md`)
                    mkdirSync(dirname(mdOutFile), {
                        recursive: true,
                    })
                    writeFileSync(mdOutFile, content, "utf-8")
                }

                // Generate .md files for dynamic glossary pages
                for (const slug of listGlossarySlugs(pkgRoot)) {
                    const content = generateGlossaryMarkdown(pkgRoot, slug, baseUrl)
                    if (!content) continue
                    const mdOutFile = resolve(buildDir, `documentation/comptabilité/ressources/glossaire/${slug}.md`)
                    mkdirSync(dirname(mdOutFile), {
                        recursive: true,
                    })
                    writeFileSync(mdOutFile, content, "utf-8")
                }

                // Generate the navigation (sommaire) .md file
                const navigationMarkdown = generateNavigationMarkdown(baseUrl)
                const navigationOutFile = resolve(buildDir, "documentation/sommaire.md")
                mkdirSync(dirname(navigationOutFile), {
                    recursive: true,
                })
                writeFileSync(navigationOutFile, navigationMarkdown, "utf-8")

                rmSync(renderBuildDir, {
                    recursive: true,
                    force: true,
                })
                // Keep a clean SPA shell (no prerendered route content) as the
                // Nginx fallback for routes that have no prerendered file (e.g.
                // /dashboard).  Without this, Nginx falls back to index.html
                // which contains the prerendered home-page HTML and causes a
                // visible flash of the "/" page on every other route refresh.
                writeFileSync(resolve(buildDir, "__app.html"), spaShell, "utf-8")

                console.log(`[prerender] Generated ${count} static HTML files`)
            } finally {
                delete process.env.BUILD_PRERENDER
            }
        },
    }
}
