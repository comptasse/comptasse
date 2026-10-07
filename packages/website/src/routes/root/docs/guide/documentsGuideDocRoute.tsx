import { createRoute } from "@tanstack/react-router"
import { DocumentsGuideDocPage } from "../../../../features/docs/guide/DocumentsGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const documentsGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/documents",
    beforeLoad: () => ({
        title: "Documents comptables",
        description: "Produire vos documents comptables et analyser vos données.",
    }),
    component: () => <DocumentsGuideDocPage />,
})
