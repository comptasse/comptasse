import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../components/document/DocRoot"
import { LedgerAccountingDocPage } from "../../../../../features/docs/accounting/reports/LedgerAccountingDocPage.js"
import { reportsAccountingDocLayoutRoute } from "./reportsAccountingDocLayoutRoute.js"

export const ledgerAccountingDocRoute = createRoute({
    getParentRoute: () => reportsAccountingDocLayoutRoute,
    path: "/grand-livre",
    beforeLoad: () => ({
        title: "Grand livre",
        description:
            "Le grand livre comptable : regroupement de toutes les écritures par compte, outil essentiel de suivi comptable.",
    }),
    component: () => (
        <DocRoot>
            <LedgerAccountingDocPage />
        </DocRoot>
    ),
})
