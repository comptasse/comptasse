import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../components/document/DocRoot"
import { BalanceAccountingDocPage } from "../../../../../features/docs/accounting/reports/BalanceAccountingDocPage.js"
import { reportsAccountingDocLayoutRoute } from "./reportsAccountingDocLayoutRoute.js"

export const balanceAccountingDocRoute = createRoute({
    getParentRoute: () => reportsAccountingDocLayoutRoute,
    path: "/balance",
    beforeLoad: () => ({
        title: "Balance",
        description:
            "La balance comptable : tableau récapitulatif des soldes débiteurs et créditeurs de tous les comptes d'un exercice.",
    }),
    component: () => (
        <DocRoot>
            <BalanceAccountingDocPage />
        </DocRoot>
    ),
})
