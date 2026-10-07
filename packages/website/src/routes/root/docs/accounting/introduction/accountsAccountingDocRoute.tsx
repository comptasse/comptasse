import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../components/document/DocRoot"
import { AccountsAccountingDocPage } from "../../../../../features/docs/accounting/introduction/AccountsAccountingDocPage.js"
import { introductionAccountingDocLayoutRoute } from "./introductionAccountingDocLayoutRoute.tsx"

export const accountsAccountingDocRoute = createRoute({
    getParentRoute: () => introductionAccountingDocLayoutRoute,
    path: "/comptes",
    beforeLoad: () => ({
        title: "Comptes",
        description:
            "Présentation des comptes comptables : structure, numérotation et fonctionnement du plan comptable général français.",
    }),
    component: () => (
        <DocRoot>
            <AccountsAccountingDocPage />
        </DocRoot>
    ),
})
