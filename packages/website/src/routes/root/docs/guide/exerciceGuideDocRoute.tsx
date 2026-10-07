import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../components/document/DocRoot"
import { ExerciceGuideDocPage } from "../../../../features/docs/guide/ExerciceGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const exerciceGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/exercices",
    beforeLoad: () => ({
        title: "Exercices",
        description: "Créez et gérez le cycle de vie de vos exercices comptables dans Comptasse.",
    }),
    component: () => (
        <DocRoot>
            <ExerciceGuideDocPage />
        </DocRoot>
    ),
})
