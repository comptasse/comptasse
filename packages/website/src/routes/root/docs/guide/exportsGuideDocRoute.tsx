import { createRoute } from "@tanstack/react-router"
import { ExportsGuideDocPage } from "../../../../features/docs/guide/ExportsGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const exportsGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/exports",
    beforeLoad: () => ({
        title: "Exports",
        description: "Export FEC et génération XBRL pour vos documents comptables.",
    }),
    component: () => <ExportsGuideDocPage />,
})
