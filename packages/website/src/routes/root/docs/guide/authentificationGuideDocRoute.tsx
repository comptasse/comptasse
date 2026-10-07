import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../components/document/DocRoot"
import { AuthentificationGuideDocPage } from "../../../../features/docs/guide/AuthentificationGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const authentificationGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/authentification",
    beforeLoad: () => ({
        title: "Authentification",
        description: "Authentifiez-vous sur Comptasse : connexion au dashboard, clés API et connexion du CLI.",
    }),
    component: () => (
        <DocRoot>
            <AuthentificationGuideDocPage />
        </DocRoot>
    ),
})
