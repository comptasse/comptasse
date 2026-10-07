import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../components/document/DocRoot"
import { EntriesAccountingDocPage } from "../../../../../features/docs/accounting/introduction/EntriesAccountingDocPage.js"
import { introductionAccountingDocLayoutRoute } from "./introductionAccountingDocLayoutRoute.tsx"

export const entriesAccountingDocRoute = createRoute({
    getParentRoute: () => introductionAccountingDocLayoutRoute,
    path: "/écritures",
    beforeLoad: () => ({
        title: "Écritures comptables",
        description:
            "Apprenez à passer des écritures comptables : lignes de débit et crédit, pièces justificatives et enregistrement des opérations.",
    }),
    component: () => (
        <DocRoot>
            <EntriesAccountingDocPage />
        </DocRoot>
    ),
})
