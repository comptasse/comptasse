import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../components/document/DocRoot"
import { MigrationsGuideDocPage } from "../../../../features/docs/guide/MigrationsGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const migrationsGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/migrations",
    beforeLoad: () => ({
        title: "Migrations de base de données",
        description:
            "Gérer les migrations de schéma de la base de données : pousser, réinitialiser et résoudre les problèmes de synchronisation.",
    }),
    component: () => (
        <DocRoot>
            <MigrationsGuideDocPage />
        </DocRoot>
    ),
})
