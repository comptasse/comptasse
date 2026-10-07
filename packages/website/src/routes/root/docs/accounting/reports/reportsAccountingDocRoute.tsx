import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../components/document/DocRoot"
import { ReportsAccountingDocPage } from "../../../../../features/docs/accounting/reports/ReportsAccountingDocPage.js"
import { reportsAccountingDocLayoutRoute } from "./reportsAccountingDocLayoutRoute.js"

export const reportsAccountingDocRoute = createRoute({
    getParentRoute: () => reportsAccountingDocLayoutRoute,
    path: "/",
    beforeLoad: () => ({
        title: "Documents comptables",
        description:
            "Les documents comptables obligatoires : journal, grand livre, balance, bilan, compte de résultat et annexe.",
    }),
    component: () => (
        <DocRoot>
            <ReportsAccountingDocPage />
        </DocRoot>
    ),
})
