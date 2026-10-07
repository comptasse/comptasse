import { createRoute } from "@tanstack/react-router"
import { StockageGuideDocPage } from "../../../../features/docs/guide/StockageGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const stockageGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/stockage",
    beforeLoad: () => ({
        title: "Stockage & Fichiers",
        description: "Gérer vos pièces justificatives et documents numériques dans Comptasse.",
    }),
    component: () => <StockageGuideDocPage />,
})
