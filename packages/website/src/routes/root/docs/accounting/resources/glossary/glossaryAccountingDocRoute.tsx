import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../../components/document/DocRoot"
import { GlossaryResourcesAccountingDocPage } from "../../../../../../features/docs/accounting/resources/glossary/GlossaryResourcesAccountingDocPage.js"
import { glossaryAccountingDocLayoutRoute } from "./glossaryAccountingDocLayoutRoute.js"

export const glossaryAccountingDocIndexRoute = createRoute({
    getParentRoute: () => glossaryAccountingDocLayoutRoute,
    path: "/",
    beforeLoad: () => ({
        title: "Glossaire comptable",
        description:
            "Glossaire de la comptabilité française : définitions claires des termes comptables essentiels, de A à Z.",
    }),
    component: () => (
        <DocRoot>
            <GlossaryResourcesAccountingDocPage />
        </DocRoot>
    ),
})
