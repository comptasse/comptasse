import { createRoute } from "@tanstack/react-router"
import { BilansGuideDocPage } from "../../../../features/docs/guide/BilansGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const bilansGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/bilans",
    beforeLoad: () => ({
        title: "Bilans",
        description: "Structure du bilan comptable : création, modification et suppression.",
    }),
    component: () => <BilansGuideDocPage />,
})
