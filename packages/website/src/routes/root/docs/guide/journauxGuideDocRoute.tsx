import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../components/document/DocRoot"
import { JournauxGuideDocPage } from "../../../../features/docs/guide/JournauxGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const journauxGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/journaux",
    beforeLoad: () => ({
        title: "Journaux",
        description: "Journaux comptables de l'exercice : création, modification et suppression.",
    }),
    component: () => (
        <DocRoot>
            <JournauxGuideDocPage />
        </DocRoot>
    ),
})
