import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../../components/document/DocRoot"
import { AccountResourcesAccountingDocPage } from "../../../../../../features/docs/accounting/resources/accounts/AccountResourcesAccountingDocPage.js"
import { getAccountBySlug } from "../../../../../../features/docs/accounting/resources/accounts/accountsData.ts"
import { accountsAccountingDocLayoutRoute } from "./accountsAccountingDocLayoutRoute.tsx"

function buildMetaDescription(entry: { number: string; label: string; description?: string }): string {
    const fallback = `Fiche du compte ${entry.number} (${entry.label}) : fonctionnement débit/crédit, exemples d'écritures et cas pratiques.`
    if (!entry.description) return fallback
    if (entry.description.length <= 155) return entry.description
    const cut = entry.description.slice(0, 155)
    const lastSpace = cut.lastIndexOf(" ")
    return `${cut.slice(0, lastSpace > 0 ? lastSpace : 155).trimEnd()}…`
}

export const accountAccountingDocRoute = createRoute({
    getParentRoute: () => accountsAccountingDocLayoutRoute,
    path: "/$account",
    beforeLoad: ({ params }) => {
        const entry = getAccountBySlug(params.account)
        return {
            title: entry ? `Compte ${entry.number} - ${entry.label}` : "Compte introuvable",
            description: entry
                ? buildMetaDescription(entry)
                : "Ce compte comptable n'a pas été trouvé dans le plan comptable général.",
        }
    },
    component: () => (
        <DocRoot>
            <AccountResourcesAccountingDocPage />
        </DocRoot>
    ),
})
