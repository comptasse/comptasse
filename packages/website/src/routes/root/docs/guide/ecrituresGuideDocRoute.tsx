import { createRoute } from "@tanstack/react-router"
import { EcrituresGuideDocPage } from "../../../../features/docs/guide/EcrituresGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const ecrituresGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/écritures",
    beforeLoad: () => ({
        title: "Saisie des écritures",
        description: "Enregistrer vos opérations comptables dans Comptasse.",
    }),
    component: () => <EcrituresGuideDocPage />,
})
