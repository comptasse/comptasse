import type { AnyRoute } from "@tanstack/react-router"
import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"
import { dashboardOrganisationExerciceBilanRoute } from "./dashboardOrganisationExerciceBilanRoute.js"
import { dashboardOrganisationExerciceCategoriesRoute } from "./dashboardOrganisationExerciceCategoriesRoute.js"
import { dashboardOrganisationExerciceCompteDeResultatCalculsRoute } from "./dashboardOrganisationExerciceCompteDeResultatCalculsRoute.js"
import { dashboardOrganisationExerciceCompteDeResultatRoute } from "./dashboardOrganisationExerciceCompteDeResultatRoute.js"
import { dashboardOrganisationExerciceComptesRoute } from "./dashboardOrganisationExerciceComptesRoute.js"
import { dashboardOrganisationExerciceDocumentsBalanceRoute } from "./dashboardOrganisationExerciceDocumentsBalanceRoute.js"
import { dashboardOrganisationExerciceDocumentsBilanRoute } from "./dashboardOrganisationExerciceDocumentsBilanRoute.js"
import { dashboardOrganisationExerciceDocumentsCompteDeResultatRoute } from "./dashboardOrganisationExerciceDocumentsCompteDeResultatRoute.js"
import { dashboardOrganisationExerciceDocumentsGrandLivreRoute } from "./dashboardOrganisationExerciceDocumentsGrandLivreRoute.js"
import { dashboardOrganisationExerciceDocumentsRoute } from "./dashboardOrganisationExerciceDocumentsRoute.js"
import { dashboardOrganisationExerciceEcritureIdRoute } from "./dashboardOrganisationExerciceEcritureIdRoute.js"
import { dashboardOrganisationExerciceEcrituresRoute } from "./dashboardOrganisationExerciceEcrituresRoute.js"
import { dashboardOrganisationExerciceInventaireCategoriesRoute } from "./dashboardOrganisationExerciceInventaireCategoriesRoute.js"
import { dashboardOrganisationExerciceInventaireIdRoute } from "./dashboardOrganisationExerciceInventaireIdRoute.js"
import { dashboardOrganisationExerciceInventaireRoute } from "./dashboardOrganisationExerciceInventaireRoute.js"
import { dashboardOrganisationExerciceJournauxRoute } from "./dashboardOrganisationExerciceJournauxRoute.js"
import { dashboardOrganisationExerciceLettragesRoute } from "./dashboardOrganisationExerciceLettragesRoute.js"
import { dashboardOrganisationExerciceParametresRoute } from "./dashboardOrganisationExerciceParametresRoute.js"
import { dashboardOrganisationExerciceStockageRoute } from "./dashboardOrganisationExerciceStockageRoute.js"
import { dashboardOrganisationExercicesRoute } from "./dashboardOrganisationExercicesRoute.js"
import { dashboardOrganisationFichierIdRoute } from "./dashboardOrganisationFichierIdRoute.js"
import { dashboardOrganisationIndexRoute } from "./dashboardOrganisationIndexRoute.js"
import { dashboardOrganisationParametresMembresRoute } from "./dashboardOrganisationParametresMembresRoute.js"
import { dashboardOrganisationParametresRoute } from "./dashboardOrganisationParametresRoute.js"
import { dashboardOrganisationParametresSecuriteRoute } from "./dashboardOrganisationParametresSecuriteRoute.js"
import { dashboardOrganisationStockageRoute } from "./dashboardOrganisationStockageRoute.js"
import { dashboardOrganisationsRoute } from "./dashboardOrganisationsRoute.js"
import { dashboardParametresApplicationRoute } from "./dashboardParametresApplicationRoute.js"
import { dashboardParametresRoute } from "./dashboardParametresRoute.js"
import { dashboardRootRoute } from "./dashboardRootRoute.js"
import { resetPasswordRoute } from "./resetPasswordRoute.js"
import { rootLayoutRoute } from "./rootLayoutRoute.js"
import { signInRoute } from "./signInRoute.js"
import { signUpRoute } from "./signUpRoute.js"

export const applicationTree: AnyRoute = rootLayoutRoute.addChildren([
    dashboardLayoutRoute.addChildren([
        dashboardOrganisationsRoute,
        dashboardParametresRoute,
        dashboardParametresApplicationRoute,
        dashboardOrganisationIndexRoute,
        dashboardOrganisationExercicesRoute,

        dashboardOrganisationStockageRoute,
        dashboardOrganisationParametresRoute,
        dashboardOrganisationParametresSecuriteRoute,
        dashboardOrganisationParametresMembresRoute,
        dashboardOrganisationExerciceEcrituresRoute,
        dashboardOrganisationExerciceLettragesRoute,
        dashboardOrganisationExerciceDocumentsRoute,
        dashboardOrganisationExerciceDocumentsGrandLivreRoute,
        dashboardOrganisationExerciceDocumentsBalanceRoute,
        dashboardOrganisationExerciceDocumentsBilanRoute,
        dashboardOrganisationExerciceDocumentsCompteDeResultatRoute,
        dashboardOrganisationExerciceInventaireRoute,
        dashboardOrganisationExerciceInventaireCategoriesRoute,
        dashboardOrganisationExerciceInventaireIdRoute,
        dashboardOrganisationExerciceStockageRoute,
        dashboardOrganisationExerciceParametresRoute,
        dashboardOrganisationExerciceComptesRoute,
        dashboardOrganisationExerciceJournauxRoute,
        dashboardOrganisationExerciceCategoriesRoute,
        dashboardOrganisationExerciceBilanRoute,
        dashboardOrganisationExerciceCompteDeResultatRoute,
        dashboardOrganisationExerciceCompteDeResultatCalculsRoute,
        dashboardOrganisationExerciceEcritureIdRoute,
        dashboardOrganisationFichierIdRoute,
        dashboardRootRoute,
    ]),
    signInRoute,
    signUpRoute,
    resetPasswordRoute,
])
