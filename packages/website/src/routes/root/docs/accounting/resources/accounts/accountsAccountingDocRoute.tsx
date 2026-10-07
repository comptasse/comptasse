import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../../components/document/DocRoot"
import { AccountsResourcesAccountingDocPage } from "../../../../../../features/docs/accounting/resources/accounts/AccountsResourcesAccountingDocPage.js"
import { accountsAccountingDocLayoutRoute } from "./accountsAccountingDocLayoutRoute.js"

export const accountsAccountingDocRoute = createRoute({
    getParentRoute: () => accountsAccountingDocLayoutRoute,
    path: "/",
    beforeLoad: () => ({
        title: "Plan comptable",
        description:
            "Liste complète des comptes du plan comptable général français. Recherchez et consultez les comptes par numéro ou libellé.",
    }),
    component: () => (
        <DocRoot>
            <AccountsResourcesAccountingDocPage />
        </DocRoot>
    ),
})
