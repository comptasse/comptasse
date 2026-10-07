import { createRoute } from "@tanstack/react-router"
import { AgentToolsDocPage } from "../../../../features/docs/guide/AgentToolsDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const agentToolsDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/agent/outils",
    beforeLoad: () => ({
        title: "Outils et code",
        description: "Exemples TypeScript et Python pour utiliser l'API Comptasse avec un agent IA.",
    }),
    component: () => <AgentToolsDocPage />,
})
