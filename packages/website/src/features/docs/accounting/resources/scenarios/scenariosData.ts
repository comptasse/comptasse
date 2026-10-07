import { buildScenarioEntries, type ScenarioDefinition, scenarioCatalog } from "@comptasse/application-metadata"
import { type AccountEntry, getAccount } from "../accounts/accountsData.js"

export interface ScenarioExample {
    description: string
    entry: {
        rows: string[][]
    }
}

export interface ScenarioEntry {
    id: string
    path: string
    title: string
    description: string
    examples: ScenarioExample[]
    accountNumbers: string[]
}

/**
 * The accounting scenarios are defined once, in the shared metadata package
 * (`@comptasse/application-metadata` → `scenarioCatalog`). The documentation
 * renders examples produced by the very same builders that power the API
 * endpoint `POST /organizations/:idOrganization/years/:idYear/scenarios/:scenario`.
 */

function formatAmount(value: string): string {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed === 0) return ""
    return parsed
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")
}

function formatAmountsForAccountLines(
    rows: Array<{
        debit: string
        credit: string
    }>,
): Array<
    [
        string,
        string,
    ]
> {
    return rows.map((row) => [
        formatAmount(row.debit),
        formatAmount(row.credit),
    ])
}

function buildExamples(definition: ScenarioDefinition): ScenarioExample[] {
    const examples: ScenarioExample[] = []
    for (const docExample of definition.docExamples) {
        const drafts = buildScenarioEntries(definition, docExample)
        for (const draft of drafts) {
            const description =
                drafts.length > 1 ? `${docExample.description} (${draft.label})` : docExample.description
            const debitsAndCredits = formatAmountsForAccountLines(draft.lines)
            examples.push({
                description,
                entry: {
                    rows: draft.lines.map((line, index) => [
                        line.number,
                        line.label,
                        debitsAndCredits[index][0],
                        debitsAndCredits[index][1],
                    ]),
                },
            })
        }
    }
    return examples
}

function collectAccountNumbers(definition: ScenarioDefinition): string[] {
    const numbers: string[] = []
    for (const docExample of definition.docExamples) {
        for (const draft of buildScenarioEntries(definition, docExample)) {
            for (const line of draft.lines) {
                if (!numbers.includes(line.number)) numbers.push(line.number)
            }
        }
    }
    return numbers
}

export const scenarioEntries: ScenarioEntry[] = Object.values(scenarioCatalog).map((definition) => ({
    id: definition.slug,
    path: `/documentation/comptabilité/ressources/scénarios/${definition.slug}`,
    title: definition.title,
    description: definition.description,
    examples: buildExamples(definition),
    accountNumbers: collectAccountNumbers(definition),
}))

export function getScenarioById(id: string): ScenarioEntry | undefined {
    return scenarioEntries.find((entry) => entry.id === id)
}

export function getScenariosByAccountNumber(accountNumber: string): ScenarioEntry[] {
    return scenarioEntries.filter((entry) => entry.accountNumbers.includes(accountNumber))
}

export function getScenarioAccounts(entry: ScenarioEntry): AccountEntry[] {
    return entry.accountNumbers
        .map((number) => getAccount(number))
        .filter((account): account is AccountEntry => Boolean(account))
        .sort((a, b) => a.number.localeCompare(b.number))
}

function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
}

export function searchScenarios(query: string): ScenarioEntry[] {
    if (!query.trim()) return scenarioEntries

    const normalizedQuery = normalize(query)

    return scenarioEntries.filter((entry) => {
        const titleMatch = normalize(entry.title).includes(normalizedQuery)
        const descriptionMatch = normalize(entry.description).includes(normalizedQuery)
        const exampleDescriptionMatch = entry.examples.some((ex) => normalize(ex.description).includes(normalizedQuery))
        const accountNumberMatch = entry.accountNumbers.some((n) => n.includes(query))
        const accountLabelMatch = normalize(
            entry.accountNumbers.map((number) => getAccount(number)?.label ?? "").join(" "),
        ).includes(normalizedQuery)

        return titleMatch || descriptionMatch || exampleDescriptionMatch || accountNumberMatch || accountLabelMatch
    })
}
