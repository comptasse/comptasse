import { entriesRoutes } from "./entries/entriesRoutes.js"
import { exportsRoutes } from "./exports/exportsRoutes.js"
import { filesRoutes } from "./files/filesRoutes.js"
import { foldersRoutes } from "./folders/foldersRoutes.js"
import { matchingsRoutes } from "./matchings/matchingsRoutes.js"
import { readOneYearRoute } from "./readOneYear.js"
import { scenariosRoutes } from "./scenarios/scenariosRoutes.js"
import { yearSettingsRoute } from "./yearSettings/yearSettingsRoute.js"

export const $idYearRoutes = [
    readOneYearRoute,

    ...entriesRoutes,
    ...exportsRoutes,
    ...filesRoutes,
    ...foldersRoutes,
    ...matchingsRoutes,
    ...scenariosRoutes,
    ...yearSettingsRoute,
]
