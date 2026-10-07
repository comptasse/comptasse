import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../components/document/DocRoot"
import { IntroductionAccountingDocPage } from "../../../../../features/docs/accounting/introduction/IntroductionAccountingDocPage.js"
import { introductionAccountingDocLayoutRoute } from "./introductionAccountingDocLayoutRoute.js"

export const introductionAccountingDocRoute = createRoute({
    getParentRoute: () => introductionAccountingDocLayoutRoute,
    path: "/",
    beforeLoad: () => ({
        title: "Introduction au cours de comptabilité",
        description:
            "Introduction aux fondamentaux de la comptabilité française : principes, obligations légales et concepts de base.",
    }),
    component: () => (
        <DocRoot>
            <IntroductionAccountingDocPage />
        </DocRoot>
    ),
})
