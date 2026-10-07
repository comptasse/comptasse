import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
    buildScenarioEntries,
    describeScenarioParams,
    type ScenarioDefinition,
    scenarioCatalog,
} from "@comptasse/application-metadata"
import {
    mdCode,
    mdCodeBlock,
    mdDefinition,
    mdExample,
    mdHeader,
    mdLink,
    mdList,
    mdOrderedList,
    mdParagraph,
    mdSection,
    mdSourceRef,
    mdTable,
    mdTextSection,
    mdTip,
    resolveDocLinkUrl,
} from "../src/components/document/markdown.js"
import { DOC_PAGE_MANIFEST } from "./DOC_PAGE_MANIFEST"

interface AccountData {
    number: string
    slug: string
    label: string
    description: string
    classNumber: string
    className: string
    type: string
    side: string
    isOptional: boolean
    parent: string | null
    counterpartNumber: string
    counterpartLabel: string
    usageTips: string[]
    debitMeaning: string
    creditMeaning: string
}

interface ScenarioExample {
    description: string
    rows: string[][]
}

interface GlossaryTermData {
    slug: string
    term: string
    englishTranslation: string
    definition: string
    sources: {
        label: string
        url: string
    }[]
    relatedTerms: string[]
    relatedPages: {
        label: string
        path: string
    }[]
}

function docUrl(baseUrl: string, path: string): string {
    if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path
    return `${baseUrl}${path}`
}

export const DOC_NAVIGATION_PATH = "/documentation/sommaire"

/**
 * Builds a full navigation tree over the documentation as Markdown links,
 * grouped by `section → navGroup → pages`. Every page link points to the raw
 * `.md` URL so LLM agents can crawl the documentation from a single entry point.
 */
export function generateNavigationMarkdown(baseUrl = ""): string {
    const sections = new Map<
        string,
        Map<
            string,
            Array<{
                label: string
                path: string
            }>
        >
    >()

    for (const entry of DOC_PAGE_MANIFEST) {
        let groups = sections.get(entry.section)
        if (!groups) {
            groups = new Map()
            sections.set(entry.section, groups)
        }
        let pages = groups.get(entry.navGroup)
        if (!pages) {
            pages = []
            groups.set(entry.navGroup, pages)
        }
        pages.push({
            label: entry.navLabel,
            path: `${entry.path}.md`,
        })
    }

    const lines: string[] = []
    lines.push("# Navigation")
    lines.push("")

    for (const [section, groups] of sections) {
        lines.push(`## ${section}`)
        lines.push("")
        for (const [group, pages] of groups) {
            lines.push(`### ${group}`)
            lines.push("")
            for (const page of pages) {
                lines.push(`- [${page.label}](${docUrl(baseUrl, page.path)})`)
            }
            // Dynamic pages: list every accounting scenario right after the
            // scenarios index so agents can jump directly to one scenario.
            if (section === "Comptabilité" && group === "Scénarios") {
                for (const definition of Object.values(scenarioCatalog)) {
                    lines.push(
                        `- [${definition.title}](${docUrl(baseUrl, `/documentation/comptabilité/ressources/scénarios/${definition.slug}.md`)})`,
                    )
                }
            }
            lines.push("")
        }
    }

    return `${lines.join("\n").trimEnd()}\n`
}

function withNavigationLink(markdown: string, baseUrl: string): string {
    const link = `[Navigation de la documentation](${docUrl(baseUrl, `${DOC_NAVIGATION_PATH}.md`)})`
    return `${link}\n\n---\n\n${markdown}`
}

function readAccountsData(pkgRoot: string): string {
    return readFileSync(resolve(pkgRoot, "src/features/docs/accounting/resources/accounts/accountsData.ts"), "utf-8")
}

function readGlossaryData(pkgRoot: string): string {
    return readFileSync(resolve(pkgRoot, "src/features/docs/accounting/resources/glossary/glossaryData.ts"), "utf-8")
}

function extractStringValue(source: string, key: string): string {
    const regex = new RegExp(`${key}\\s*:\\s*\\n?\\s*"([\\s\\S]*?)"`)
    return source.match(regex)?.[1] ?? ""
}

function extractNumberValue(source: string, key: string): string {
    const regex = new RegExp(`${key}\\s*:\\s*(\\d+)`)
    return source.match(regex)?.[1] ?? ""
}

function extractOptionalStringValue(source: string, key: string): string | undefined {
    const regex = new RegExp(`${key}\\s*:\\s*\\n?\\s*"([\\s\\S]*?)"`)
    return source.match(regex)?.[1]
}

function extractStringArray(source: string, key: string): string[] {
    const regex = new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "")
    const block = source.match(regex)?.[1]
    if (!block) return []
    return Array.from(block.matchAll(/"([^"]*)"/g)).map((m) => m[1])
}

function parseAccountChunk(chunk: string): AccountData {
    const numberMatch = chunk.match(/defineAccount\(\s*"([^"]+)"/)
    const labelMatch = chunk.match(/defineAccount\(\s*"[^"]+",\s*"([^"]+)"/)
    const description = extractOptionalStringValue(chunk, "description")
    const classNumber = extractNumberValue(chunk, "classNumber")
    const className = extractStringValue(chunk, "className")
    const type = extractStringValue(chunk, "type")
    const side = extractStringValue(chunk, "side")
    const isOptional = /isOptional\s*:\s*true/.test(chunk)
    const parentMatch = chunk.match(/parent\s*:\s*("[^"]*"|null)/)
    const parent = parentMatch ? (parentMatch[1] === "null" ? null : parentMatch[1].slice(1, -1)) : null
    const counterpartNumber = extractStringValue(chunk, "number")
    const counterpartLabel = extractStringValue(chunk, "label")
    const usageTips = extractStringArray(chunk, "usageTips")
    const debitMeaning = extractStringValue(chunk, "debitMeaning")
    const creditMeaning = extractStringValue(chunk, "creditMeaning")

    return {
        number: numberMatch?.[1] ?? "",
        slug: numberMatch?.[1] ?? "",
        label: labelMatch?.[1] ?? "",
        description: description ?? "",
        classNumber,
        className,
        type,
        side,
        isOptional,
        parent,
        counterpartNumber,
        counterpartLabel,
        usageTips,
        debitMeaning,
        creditMeaning,
    }
}

function findAccountChunk(source: string, slug: string): string | undefined {
    const chunks = source.split(/(?=\bdefineAccount\()/)
    for (const chunk of chunks) {
        if (!/^\s*defineAccount\s*\(\s*"/.test(chunk)) continue
        const numberMatch = chunk.match(/defineAccount\(\s*"([^"]+)"/)
        if (numberMatch?.[1] === slug) {
            return chunk
        }
    }
    return undefined
}

function findGlossaryChunk(source: string, slug: string): string | undefined {
    const chunks = source.split(/(?=\bdefineTerm\()/)
    for (const chunk of chunks) {
        if (!/^\s*defineTerm\s*\(\s*"/.test(chunk)) continue
        const termMatch = chunk.match(/defineTerm\(\s*"([^"]+)"/)
        if (!termMatch) continue
        if (toGlossarySlug(termMatch[1]) === slug) {
            return chunk
        }
    }
    return undefined
}

function parseGlossaryChunk(chunk: string): GlossaryTermData {
    const term = chunk.match(/defineTerm\(\s*"([^"]+)"/)?.[1] ?? ""
    const englishTranslation = chunk.match(/defineTerm\(\s*"[^"]+",\s*"([^"]+)"/)?.[1] ?? ""
    const definition = chunk.match(/defineTerm\(\s*"[^"]+",\s*"[^"]+",\s*"([^"]+)"/)?.[1] ?? ""
    const slug = chunk.match(/\bslug\s*:\s*"([^"]+)"/)?.[1] ?? ""

    const sources: {
        label: string
        url: string
    }[] = []
    const sourcesBlock = chunk.match(/sources:\s*\[([\s\S]*?)\]\s*,\s*(?:relatedTerms|relatedPages|\})/)?.[1]
    if (sourcesBlock) {
        const sourceMatches = sourcesBlock.matchAll(/\{\s*label:\s*"([^"]+)"\s*,\s*url:\s*"([^"]+)"\s*\}/g)
        for (const m of sourceMatches) {
            sources.push({
                label: m[1],
                url: m[2],
            })
        }
    }

    const relatedTerms = extractStringArray(chunk, "relatedTerms")

    const relatedPages: {
        label: string
        path: string
    }[] = []
    const pagesBlock = chunk.match(/relatedPages:\s*\[([\s\S]*?)\]\s*,?\s*\}/)?.[1]
    if (pagesBlock) {
        const pageMatches = pagesBlock.matchAll(/\{\s*label:\s*"([^"]+)"\s*,\s*path:\s*"([^"]+)"\s*\}/g)
        for (const m of pageMatches) {
            relatedPages.push({
                label: m[1],
                path: m[2],
            })
        }
    }

    return {
        slug,
        term,
        englishTranslation,
        definition,
        sources,
        relatedTerms,
        relatedPages,
    }
}

function buildAccountLabelMap(source: string): Map<string, string> {
    const map = new Map<string, string>()
    const chunks = source.split(/(?=\bdefineAccount\()/)
    for (const chunk of chunks) {
        if (!/^\s*defineAccount\s*\(\s*"/.test(chunk)) continue
        const numberMatch = chunk.match(/defineAccount\(\s*"([^"]+)"/)
        const labelMatch = chunk.match(/defineAccount\(\s*"[^"]+",\s*"([^"]+)"/)
        if (numberMatch && labelMatch) {
            map.set(numberMatch[1], labelMatch[1])
        }
    }
    return map
}

export function generateAccountMarkdown(pkgRoot: string, slug: string, baseUrl = ""): string | null {
    const source = readAccountsData(pkgRoot)
    const chunk = findAccountChunk(source, slug)
    if (!chunk) return null

    const account = parseAccountChunk(chunk)
    const lines: string[] = []

    lines.push(`# ${account.number} - ${account.label}`)
    lines.push("")
    lines.push(`Classe ${account.classNumber} - ${account.className}`)
    lines.push("")

    if (account.description) {
        lines.push(account.description)
        lines.push("")
    }

    lines.push("## Caractéristiques")
    lines.push("")
    lines.push(`- **Type** : ${account.type}`)
    lines.push(`- **Sens** : ${account.side}`)
    lines.push(`- **Facultatif** : ${account.isOptional ? "oui" : "non"}`)
    if (account.parent) {
        lines.push(
            `- **Compte parent** : [${account.parent}](${docUrl(baseUrl, `/documentation/comptabilité/ressources/comptes/${account.parent}`)})`,
        )
    }
    lines.push(
        `- **Contrepartie typique** : [${account.counterpartNumber} ${account.counterpartLabel}](${docUrl(baseUrl, `/documentation/comptabilité/ressources/comptes/${account.counterpartNumber}`)})`,
    )
    lines.push("")

    if (account.usageTips.length > 0) {
        lines.push("## Conseils d'utilisation")
        lines.push("")
        for (const tip of account.usageTips) {
            lines.push(`- ${tip}`)
        }
        lines.push("")
    }

    lines.push("## Signification")
    lines.push("")
    lines.push(`- **Débit** : ${account.debitMeaning}`)
    lines.push(`- **Crédit** : ${account.creditMeaning}`)
    lines.push("")

    return withNavigationLink(lines.join("\n"), baseUrl)
}

function buildScenarioExamples(definition: ScenarioDefinition): ScenarioExample[] {
    const examples: ScenarioExample[] = []
    for (const docExample of definition.docExamples) {
        const drafts = buildScenarioEntries(definition, docExample)
        for (const draft of drafts) {
            const description =
                drafts.length > 1 ? `${docExample.description} (${draft.label})` : docExample.description
            examples.push({
                description,
                rows: draft.lines.map((line) => [
                    line.number,
                    line.label,
                    line.debit,
                    line.credit,
                ]),
            })
        }
    }
    return examples
}

function collectScenarioAccountNumbers(definition: ScenarioDefinition): string[] {
    const numbers: string[] = []
    const seen = new Set<string>()
    for (const docExample of definition.docExamples) {
        for (const draft of buildScenarioEntries(definition, docExample)) {
            for (const line of draft.lines) {
                if (seen.has(line.number)) continue
                seen.add(line.number)
                numbers.push(line.number)
            }
        }
    }
    return numbers
}

function buildScenarioExecutionSection(definition: ScenarioDefinition, baseUrl: string): string {
    const lines: string[] = []
    lines.push("## Exécution")
    lines.push("")
    lines.push("```http")
    if (definition.mode === "balances") {
        lines.push(`POST /organizations/:idOrganization/years/:idYear/scenarios/${definition.slug}`)
        lines.push("")
        lines.push(
            definition.balancesSource === "previousYear"
                ? "// Les soldes de bilan de l'exercice précédent sont lus automatiquement."
                : "// Les soldes des comptes de gestion de l'exercice sont lus automatiquement.",
        )
        lines.push('{ "idYear": "<idYear>", "idJournal": "<idJournal>" }')
    } else {
        lines.push(`POST /organizations/:idOrganization/years/:idYear/scenarios/${definition.slug}`)
        lines.push("")
        lines.push('{ "idYear": "<idYear>", "idJournal": "<idJournal>", "params": { ... } }')
    }
    lines.push("```")
    lines.push("")
    lines.push("```sh")
    lines.push(
        `comptasse scenarios run ${definition.slug} --year <id> --journal <id>${definition.mode === "params" ? " --data '<json>'" : ""}`,
    )
    lines.push("```")
    lines.push("")
    lines.push(
        `Référence complète des routes : [Référence API](${docUrl(baseUrl, "/documentation/guide/référence-api")})`,
    )
    lines.push("")
    return lines.join("\n")
}

export function generateScenarioMarkdown(pkgRoot: string, id: string, baseUrl = ""): string | null {
    const definition = scenarioCatalog[id]
    if (!definition) return null

    const accountsSource = readAccountsData(pkgRoot)
    const accountLabels = buildAccountLabelMap(accountsSource)
    const examples = buildScenarioExamples(definition)
    const accountNumbers = collectScenarioAccountNumbers(definition)
    const params = describeScenarioParams(definition.paramsSchema)
    const lines: string[] = []

    lines.push(`# ${definition.title}`)
    lines.push("")
    lines.push(definition.description)
    lines.push("")

    if (definition.mode === "balances") {
        lines.push(
            definition.balancesSource === "previousYear"
                ? "> Scénario piloté par les données : les soldes de bilan de l'exercice précédent sont agrégés automatiquement au moment de l'exécution."
                : "> Scénario piloté par les données : les soldes des comptes de gestion de l'exercice sont agrégés automatiquement au moment de l'exécution.",
        )
        lines.push("")
    }

    if (params.length > 0) {
        lines.push("## Paramètres")
        lines.push("")
        lines.push("| Nom | Type | Requis | Choix | Défaut |")
        lines.push("|---|---|---|---|---|")
        for (const param of params) {
            lines.push(
                `| ${param.name} | ${param.type} | ${param.required ? "oui" : "non"} | ${param.choices?.join(", ") ?? "-"} | ${param.default ?? "-"} |`,
            )
        }
        lines.push("")
    }

    if (examples.length > 0) {
        lines.push("## Exemples")
        lines.push("")
        for (const example of examples) {
            lines.push(`### ${example.description}`)
            lines.push("")
            lines.push("| Compte | Libellé | Débit | Crédit |")
            lines.push("|---|---|---|---|")
            for (const row of example.rows) {
                lines.push(`| ${row.join(" | ")} |`)
            }
            lines.push("")
        }
    }

    if (accountNumbers.length > 0) {
        lines.push("## Comptes concernés")
        lines.push("")
        for (const number of accountNumbers) {
            const label = accountLabels.get(number)
            const text = label ? `${number} ${label}` : number
            lines.push(`- [${text}](${docUrl(baseUrl, `/documentation/comptabilité/ressources/comptes/${number}`)})`)
        }
        lines.push("")
    }

    lines.push(buildScenarioExecutionSection(definition, baseUrl))

    return withNavigationLink(lines.join("\n"), baseUrl)
}

export function generateGlossaryMarkdown(pkgRoot: string, slug: string, baseUrl = ""): string | null {
    const source = readGlossaryData(pkgRoot)
    const chunk = findGlossaryChunk(source, slug)
    if (!chunk) return null

    const term = parseGlossaryChunk(chunk)
    const lines: string[] = []

    lines.push(`# ${term.term}`)
    lines.push("")
    lines.push(`*${term.englishTranslation}*`)
    lines.push("")
    lines.push(term.definition)
    lines.push("")

    if (term.sources.length > 0) {
        lines.push("## Sources")
        lines.push("")
        for (const source of term.sources) {
            lines.push(`- [${source.label}](${docUrl(baseUrl, source.url)})`)
        }
        lines.push("")
    }

    if (term.relatedTerms.length > 0) {
        lines.push("## Termes associés")
        lines.push("")
        for (const related of term.relatedTerms) {
            const relatedSlug = toGlossarySlug(related)
            lines.push(
                `- [${related}](${docUrl(baseUrl, `/documentation/comptabilité/ressources/glossaire/${relatedSlug}`)})`,
            )
        }
        lines.push("")
    }

    if (term.relatedPages.length > 0) {
        lines.push("## Pages associées")
        lines.push("")
        for (const page of term.relatedPages) {
            lines.push(`- [${page.label}](${docUrl(baseUrl, page.path)})`)
        }
        lines.push("")
    }

    return withNavigationLink(lines.join("\n"), baseUrl)
}

export function listGlossarySlugs(pkgRoot: string): string[] {
    const source = readGlossaryData(pkgRoot)
    const terms = Array.from(source.matchAll(/defineTerm\(\s*"([^"]+)"/g)).map((m) => m[1])
    return terms.map((term) => toGlossarySlug(term))
}

function toGlossarySlug(term: string): string {
    return term
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
}

export function listAccountSlugs(pkgRoot: string): string[] {
    const source = readAccountsData(pkgRoot)
    return Array.from(source.matchAll(/defineAccount\(\s*"([^"]+)"/g)).map((m) => m[1])
}

export function listScenarioIds(_pkgRoot: string): string[] {
    return Object.keys(scenarioCatalog)
}

function splitArrayElements(content: string): string[] {
    const elements: string[] = []
    let depth = 0
    let inString: string | null = null
    let isEscaped = false
    let current = ""

    for (const char of content) {
        if (isEscaped) {
            current += char
            isEscaped = false
            continue
        }
        if (char === "\\") {
            current += char
            isEscaped = true
            continue
        }
        if (inString) {
            current += char
            if (char === inString) inString = null
            continue
        }
        if (char === '"' || char === "'") {
            current += char
            inString = char
            continue
        }
        if (char === "[" || char === "{" || char === "(") {
            depth++
            current += char
            continue
        }
        if (char === "]" || char === "}" || char === ")") {
            depth--
            current += char
            continue
        }
        if (char === "," && depth === 0) {
            elements.push(current.trim())
            current = ""
            continue
        }
        current += char
    }
    if (current.trim()) elements.push(current.trim())
    return elements
}

function unescapeStringLiteral(value: string): string {
    return value
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\")
}

function extractStringLiteral(raw: string): string {
    const trimmed = raw.trim()
    const double = trimmed.match(/^"([\s\S]*)"$/)
    if (double) return unescapeStringLiteral(double[1])
    const single = trimmed.match(/^'([\s\S]*)'$/)
    if (single) return unescapeStringLiteral(single[1])
    return trimmed
}

function parseCellValue(cell: string): string {
    const trimmed = cell.trim()
    const docCodeMatch = trimmed.match(/<DocCode[^>]*>([\s\S]*?)<\/DocCode>/)
    if (docCodeMatch) {
        const inner = docCodeMatch[1]
            .trim()
            .replace(/^\{([\s\S]*)\}$/, "$1")
            .trim()
        return extractStringLiteral(inner)
    }
    return extractStringLiteral(trimmed)
}

function parseInlineStringArray(raw: string, baseUrl = ""): string[] {
    return splitArrayElements(raw).map((element) => {
        const trimmed = element.trim()
        const literal = extractStringLiteral(trimmed)
        if (literal !== trimmed) return literal
        return processInlineContent(trimmed, baseUrl)
    })
}

function parseInlineStringMatrix(raw: string, _baseUrl = ""): string[][] {
    return splitArrayElements(raw).map((row) =>
        splitArrayElements(row.replace(/^\[|\]$/g, "").trim()).map((cell) => parseCellValue(cell)),
    )
}

function stripIndent(text: string): string {
    const lines = text.split("\n")
    const indents: number[] = []
    for (const line of lines) {
        if (line.trim().length > 0) {
            indents.push(line.match(/^\s*/)?.[0].length ?? 0)
        }
    }
    const minIndent = indents.length > 0 ? Math.min(...indents) : 0
    if (minIndent === 0) return text
    return lines.map((line) => line.slice(minIndent)).join("\n")
}

function extractJsxText(value: string): string {
    return value
        .replace(/\{[\s\S]*?\}/g, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<DocCode[^>]*>([\s\S]*?)<\/DocCode>/g, (_, text) => mdCode(text.trim()))
        .replace(/<[^>]+>/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/ ?\n ?/g, "\n")
        .replace(/\n{2,}/g, "\n")
        .trim()
}

function convertInlineLinks(value: string, baseUrl: string): string {
    return value
        .replace(/<a\s+[^>]*?href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) => {
            const cleanText = extractJsxText(text)
            return cleanText ? `[${cleanText}](${docUrl(baseUrl, href)})` : docUrl(baseUrl, href)
        })
        .replace(/<LinkButton\s+[^>]*?to\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/LinkButton>/g, (_, to, text) => {
            const cleanText = extractJsxText(text)
            return cleanText ? `[${cleanText}](${docUrl(baseUrl, to)})` : docUrl(baseUrl, to)
        })
        .replace(
            /<DocLink\s+[^>]*?to\s*=\s*"([^"]+)"(?:[^>]*?params\s*=\s*\{\s*\{([\s\S]*?)\}\s*\})?[^>]*>([\s\S]*?)<\/DocLink>/g,
            (_, to, paramsRaw, text) => {
                const cleanText = extractJsxText(text)
                const params: Record<string, string> = {}
                if (paramsRaw) {
                    for (const paramMatch of paramsRaw.matchAll(/(\w+)\s*:\s*"([^"]+)"/g)) {
                        params[paramMatch[1]] = paramMatch[2]
                    }
                }
                return cleanText ? mdLink(to, cleanText, params) : resolveDocLinkUrl(to, params)
            },
        )
}

function convertBlockComponents(value: string, baseUrl = ""): string {
    return value
        .replace(
            /<DocTable\s+[^>]*headers\s*=\s*\{\s*\[([\s\S]*?)\]\s*\}[^>]*rows\s*=\s*\{\s*\[([\s\S]*?)\]\s*\}[^>]*\/>/g,
            (_, headersRaw, rowsRaw) => {
                const headers = parseInlineStringArray(headersRaw, baseUrl)
                const rows = parseInlineStringMatrix(rowsRaw, baseUrl)
                return mdTable(headers, rows)
            },
        )
        .replace(/<DocList([\s\S]*?)items\s*=\s*\{\s*\[([\s\S]*?)\]\s*\}[\s\S]*?\/>/g, (_, attrs, itemsRaw) => {
            const items = parseInlineStringArray(itemsRaw, baseUrl)
            return /variant\s*=\s*"ordered"/.test(attrs) ? mdOrderedList(items) : mdList(items)
        })
        .replace(/<DocCodeBlock>([\s\S]*?)<\/DocCodeBlock>/g, (_, code) => {
            const literalMatch = code.match(/^\s*\{\s*(?:"([\s\S]*?)"|'([\s\S]*?)')\s*\}\s*$/)
            const raw = literalMatch ? (literalMatch[1] ?? literalMatch[2] ?? "") : code
            const unescaped = unescapeStringLiteral(raw)
            const cleaned = stripIndent(unescaped).trim()
            return mdCodeBlock(cleaned)
        })
        .replace(/<DocSourceRef\s+n\s*=\s*\{(\d+)\}\s*\/>/g, (_, n) => mdSourceRef(Number(n)))
}

function processInlineContent(value: string, baseUrl = ""): string {
    const withBlocks = convertBlockComponents(value, baseUrl)

    const preservedBlocks: string[] = []
    let blockIndex = 0

    const withPlaceholders = withBlocks
        .replace(/\n?```[\s\S]*?```\n?/g, (match) => {
            const placeholder = `__PRESERVE_BLOCK_${blockIndex++}__`
            preservedBlocks.push(match)
            return placeholder
        })
        .replace(/\n?\|[^\n]*\|\n\|[-:| \t]+\|\n(?:\|[^\n]*\|\n?)+/g, (match) => {
            const placeholder = `__PRESERVE_BLOCK_${blockIndex++}__`
            preservedBlocks.push(match)
            return placeholder
        })

    const processed = extractJsxText(convertInlineLinks(withPlaceholders, baseUrl))

    return processed.replace(/__PRESERVE_BLOCK_(\d+)__/g, (_, i) => preservedBlocks[Number(i)] ?? "")
}

function convertDocTip(value: string, baseUrl = ""): string {
    return value.replace(/<(DocTip|DocDefinition|DocExample)\s+([^>]*)>([\s\S]*?)<\/\1>/g, (_, tag, attrs, content) => {
        const isDefinition = tag === "DocDefinition"
        const isExample = tag === "DocExample"
        const variant = attrs.match(/variant\s*=\s*"([^"]+)"/)?.[1] ?? (isDefinition || isExample ? "neutral" : "info")
        const title = attrs.match(/title\s*=\s*"([^"]+)"/)?.[1]
        const termAttr = attrs.match(/term\s*=\s*"([^"]+)"/)?.[1]
        const processedContent = processInlineContent(content, baseUrl).trim()

        if (isDefinition) {
            return mdDefinition(termAttr, processedContent)
        }
        if (isExample) {
            return mdExample(title, processedContent)
        }
        return mdTip(variant, title, processedContent)
    })
}

function renderMarkdownForSectionBody(sectionBody: string, baseUrl: string): string {
    let bodyMd = ""

    // Convert standalone DocTip/DocDefinition/DocExample blocks
    const bodyWithTips = convertDocTip(sectionBody, baseUrl)

    // Keep the converted tip/definition/example blockquotes (everything that is
    // not one of the raw block tags handled below).
    const tipsMarkdown = bodyWithTips
        .replace(/<DocParagraph>[\s\S]*?<\/DocParagraph>/g, "")
        .replace(/<DocList[\s\S]*?\/>/g, "")
        .replace(/<DocTable[\s\S]*?\/>/g, "")
        .replace(/<DocCodeBlock>[\s\S]*?<\/DocCodeBlock>/g, "")
        .replace(/<a\s+[^>]*>[\s\S]*?<\/a>/g, "")
        .trim()
    if (tipsMarkdown) {
        bodyMd += `${tipsMarkdown}\n\n`
    }

    // DocParagraph blocks
    const paragraphMatches = bodyWithTips.matchAll(/<DocParagraph>([\s\S]*?)<\/DocParagraph>/g)
    for (const paragraphMatch of paragraphMatches) {
        const text = processInlineContent(paragraphMatch[1], baseUrl)
        if (text) {
            bodyMd += mdParagraph(text)
        }
    }

    // DocList blocks (not inside DocParagraph)
    const listMatches = bodyWithTips.matchAll(/<DocList([\s\S]*?)items\s*=\s*\{\s*\[([\s\S]*?)\]\s*\}[\s\S]*?\/>/g)
    for (const listMatch of listMatches) {
        const items = parseInlineStringArray(listMatch[2], baseUrl)
        bodyMd += /variant\s*=\s*"ordered"/.test(listMatch[1]) ? mdOrderedList(items) : mdList(items)
    }

    // Standalone links (e.g. Updates page)
    const bodyWithoutBlocks = bodyWithTips
        .replace(/<DocParagraph>[\s\S]*?<\/DocParagraph>/g, "")
        .replace(/<DocList[\s\S]*?\/>/g, "")
    for (const linkMatch of bodyWithoutBlocks.matchAll(/<a\s+[^>]*?href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
        const linkText = processInlineContent(linkMatch[0], baseUrl)
        if (linkText) {
            bodyMd += mdParagraph(linkText)
        }
    }

    // DocTable blocks
    for (const tableMatch of bodyWithTips.matchAll(
        /<DocTable\s+[^>]*headers\s*=\s*\{\s*\[([\s\S]*?)\]\s*\}[^>]*rows\s*=\s*\{\s*\[([\s\S]*?)\]\s*\}[^>]*\/>/g,
    )) {
        const headers = parseInlineStringArray(tableMatch[1], baseUrl)
        const rows = parseInlineStringMatrix(tableMatch[2], baseUrl)
        bodyMd += mdTable(headers, rows)
    }

    // DocCodeBlock blocks
    for (const codeMatch of bodyWithTips.matchAll(/<DocCodeBlock>([\s\S]*?)<\/DocCodeBlock>/g)) {
        const literalMatch = codeMatch[1].match(/^\s*\{\s*(?:"([\s\S]*?)"|'([\s\S]*?)')\s*\}\s*$/)
        const raw = literalMatch ? (literalMatch[1] ?? literalMatch[2] ?? "") : codeMatch[1]
        const unescaped = unescapeStringLiteral(raw)
        const cleaned = stripIndent(unescaped).trim()
        bodyMd += mdCodeBlock(cleaned)
    }

    return bodyMd
}

function renderMarkdownForTextSectionBody(sectionBody: string, baseUrl: string): string {
    let bodyMd = ""

    const paragraphMatches = sectionBody.matchAll(/<p>([\s\S]*?)<\/p>/g)
    for (const paragraphMatch of paragraphMatches) {
        const text = processInlineContent(paragraphMatch[1], baseUrl)
        if (text) {
            bodyMd += mdParagraph(text)
        }
    }

    return bodyMd
}

export function generateStaticDocPageMarkdown(pkgRoot: string, path: string, baseUrl = ""): string | null {
    const entry = DOC_PAGE_MANIFEST.find((e) => e.path === path)
    if (!entry) return null

    let source: string
    try {
        source = readFileSync(resolve(pkgRoot, entry.file), "utf-8")
    } catch {
        try {
            source = readFileSync(resolve(pkgRoot, "src", entry.file), "utf-8")
        } catch {
            return null
        }
    }

    const title = source.match(/<DocHeader[^>]*\btitle\s*=\s*"([^"]+)"/)?.[1] ?? entry.navLabel
    const description = source.match(/<DocHeader[^>]*\bdescription\s*=\s*"([^"]+)"/)?.[1]

    let markdown = mdHeader(title, description)

    const sectionMatches = source.matchAll(/<DocSection\s+title\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/DocSection>/g)
    for (const sectionMatch of sectionMatches) {
        const sectionTitle = sectionMatch[1]
        const sectionBody = sectionMatch[2]
        const sectionMd = renderMarkdownForSectionBody(sectionBody, baseUrl)
        markdown += mdSection(sectionTitle, sectionMd)
    }

    const textSectionMatches = source.matchAll(
        /<DocTextSection\s+title\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/DocTextSection>/g,
    )
    for (const sectionMatch of textSectionMatches) {
        const sectionTitle = sectionMatch[1]
        const sectionBody = sectionMatch[2]
        const sectionMd = renderMarkdownForTextSectionBody(sectionBody, baseUrl)
        markdown += mdTextSection(sectionTitle, sectionMd)
    }

    // Sources section (rendered by <DocSources>) — a numbered list of references.
    const docSourcesMatch = source.match(/<DocSources[\s\S]*?sources\s*=\s*\{\s*\[([\s\S]*?)\]\s*\}/)
    if (docSourcesMatch) {
        const items: string[] = []
        for (const m of docSourcesMatch[1].matchAll(
            /\{\s*label\s*:\s*"([^"]+)"\s*,\s*url\s*:\s*"([^"]+)"\s*,?\s*\}/g,
        )) {
            items.push(mdLink(m[2], m[1]))
        }
        if (items.length > 0) {
            markdown += mdSection("Sources", mdOrderedList(items))
        }
    }

    // Fallback: extract standalone JSX text nodes to catch custom layouts
    const stripped = source
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
        .replace(/\/\/[^\n]*/g, "")
        .replace(/<DocCode[^>]*>([\s\S]*?)<\/DocCode>/g, "$1")
    const textNodes = stripped.matchAll(/>([^<>{}]{8,})</g)
    const existingText = markdown
        .split("\n")
        .map((line) => line.trim().replace(/\s+/g, " "))
        .filter(Boolean)
    const codeLikePattern = /\b(const|let|var|function|return|use[A-Z][a-zA-Z]*|=>|\[\])\b/
    for (const m of textNodes) {
        const text = m[1].trim().replace(/\s+/g, " ")
        if (!text) continue
        if (!/^[a-zA-ZÀ-ÿ0-9]/.test(text)) continue
        if (!/[a-zA-ZÀ-ÿ]/.test(text)) continue
        if (codeLikePattern.test(text)) continue
        const alreadyIncluded = existingText.some((line) => line.includes(text) || text.includes(line))
        if (!alreadyIncluded) {
            existingText.push(text)
            markdown += mdParagraph(text)
        }
    }

    // Append structured link lists for resource index pages
    if (path === "/documentation/comptabilité/ressources/comptes") {
        const items: string[] = []
        const accountsSource = readAccountsData(pkgRoot)
        const chunks = accountsSource.split(/(?=\bdefineAccount\()/)
        for (const chunk of chunks) {
            const numberMatch = chunk.match(/^\s*defineAccount\(\s*"([^"]+)"/)
            const labelMatch = chunk.match(/^\s*defineAccount\(\s*"[^"]+",\s*"([^"]+)"/)
            if (numberMatch && labelMatch) {
                items.push(
                    mdLink(
                        `/documentation/comptabilité/ressources/comptes/${numberMatch[1]}`,
                        `${numberMatch[1]} ${labelMatch[1]}`,
                    ),
                )
            }
        }
        markdown += mdSection("Comptes", mdList(items))
    }

    if (path === "/documentation/comptabilité/ressources/scénarios") {
        const items: string[] = []
        for (const definition of Object.values(scenarioCatalog)) {
            items.push(
                mdLink(
                    `/documentation/comptabilité/ressources/scénarios/${definition.slug}`,
                    `${definition.title} (${definition.slug})`,
                ),
            )
        }
        markdown += mdSection("Scénarios", mdList(items))
    }

    if (path === "/documentation/comptabilité/ressources/glossaire") {
        const items: string[] = []
        const glossarySource = readGlossaryData(pkgRoot)
        const chunks = glossarySource.split(/(?=\bdefineTerm\()/)
        for (const chunk of chunks) {
            const termMatch = chunk.match(/^\s*defineTerm\(\s*"([^"]+)"/)
            const englishMatch = chunk.match(/^\s*defineTerm\(\s*"[^"]+",\s*"([^"]+)"/)
            if (termMatch) {
                const slug = toGlossarySlug(termMatch[1])
                const label = englishMatch ? `${termMatch[1]} (${englishMatch[1]})` : termMatch[1]
                items.push(mdLink(`/documentation/comptabilité/ressources/glossaire/${slug}`, label))
            }
        }
        markdown += mdSection("Termes", mdList(items))
    }

    return withNavigationLink(markdown, baseUrl)
}
