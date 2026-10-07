import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../components/document/DocRoot"
import { JournalAccountingDocPage } from "../../../../../features/docs/accounting/reports/JournalAccountingDocPage.js"
import { reportsAccountingDocLayoutRoute } from "./reportsAccountingDocLayoutRoute.js"

export const journalAccountingDocRoute = createRoute({
    getParentRoute: () => reportsAccountingDocLayoutRoute,
    path: "/journal",
    beforeLoad: () => ({
        title: "Journal",
        description:
            "Le journal comptable : document chronologique enregistrant toutes les opérations comptables de l'entreprise.",
    }),
    component: () => (
        <DocRoot>
            <JournalAccountingDocPage />
        </DocRoot>
    ),
})
