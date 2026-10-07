import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../components/document/DocRoot"
import { BalanceSheetAccountingDocPage } from "../../../../../features/docs/accounting/reports/BalanceSheetAccountingDocPage.js"
import { reportsAccountingDocLayoutRoute } from "./reportsAccountingDocLayoutRoute.js"

export const balanceSheetAccountingDocRoute = createRoute({
    getParentRoute: () => reportsAccountingDocLayoutRoute,
    path: "/bilan",
    beforeLoad: () => ({
        title: "Bilan",
        description:
            "Le bilan comptable : document de synthèse présentant le patrimoine de l'entreprise (actif et passif) à la clôture de l'exercice.",
    }),
    component: () => (
        <DocRoot>
            <BalanceSheetAccountingDocPage />
        </DocRoot>
    ),
})
