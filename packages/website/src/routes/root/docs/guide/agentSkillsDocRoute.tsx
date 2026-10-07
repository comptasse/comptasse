import { createRoute } from "@tanstack/react-router"
import { AgentSkillsDocPage } from "../../../../features/docs/guide/AgentSkillsDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const agentSkillsDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/agent",
    beforeLoad: () => ({
        title: "Skills agent IA",
        description: "Skills Markdown pour configurer votre agent IA avec Comptasse.",
    }),
    component: () => <AgentSkillsDocPage />,
})
