import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../components/document/DocRoot"
import { NotesAccountingDocPage } from "../../../../../features/docs/accounting/reports/NotesAccountingDocPage.js"
import { reportsAccountingDocLayoutRoute } from "./reportsAccountingDocLayoutRoute.js"

export const notesAccountingDocRoute = createRoute({
    getParentRoute: () => reportsAccountingDocLayoutRoute,
    path: "/annexe",
    beforeLoad: () => ({
        title: "Annexe comptable",
        description:
            "L'annexe comptable : document complémentaire au bilan et au compte de résultat, fournissant des informations détaillées.",
    }),
    component: () => (
        <DocRoot>
            <NotesAccountingDocPage />
        </DocRoot>
    ),
})
