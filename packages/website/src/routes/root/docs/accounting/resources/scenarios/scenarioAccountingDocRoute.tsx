import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../../../components/document/DocRoot"
import { ScenarioResourcesAccountingDocPage } from "../../../../../../features/docs/accounting/resources/scenarios/ScenarioResourcesAccountingDocPage.js"
import { getScenarioById } from "../../../../../../features/docs/accounting/resources/scenarios/scenariosData.js"
import { scenariosAccountingDocLayoutRoute } from "./scenariosAccountingDocLayoutRoute.js"

export const scenarioAccountingDocRoute = createRoute({
    getParentRoute: () => scenariosAccountingDocLayoutRoute,
    path: "/$scenario",
    beforeLoad: ({ params }) => {
        const entry = getScenarioById(params.scenario)

        return {
            title: entry ? `${entry.title} - Scénario comptable` : "Scénario introuvable",
            description: entry ? entry.description : "Ce scénario comptable n'a pas été trouvé.",
        }
    },
    component: () => (
        <DocRoot>
            <ScenarioResourcesAccountingDocPage />
        </DocRoot>
    ),
})
