import { $idMatchingRoutes } from "./$idMatching/$idMatchingRoutes.js"
import { createOneMatchingRoute } from "./createOneMatching.js"
import { readAllMatchingsRoute } from "./readAllMatchings.js"

export const matchingsRoutes = [
    createOneMatchingRoute,
    readAllMatchingsRoute,

    ...$idMatchingRoutes,
]
