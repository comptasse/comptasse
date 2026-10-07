import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../components/document/DocRoot"
import { ComptesGuideDocPage } from "../../../../features/docs/guide/ComptesGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const comptesGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/comptes",
    beforeLoad: () => ({
        title: "Comptes",
        description: "Plan comptable de l'exercice : création, modification et suppression des comptes.",
    }),
    component: () => (
        <DocRoot>
            <ComptesGuideDocPage />
        </DocRoot>
    ),
})
