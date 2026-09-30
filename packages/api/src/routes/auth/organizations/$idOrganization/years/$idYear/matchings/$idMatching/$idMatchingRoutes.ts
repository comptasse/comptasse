import { connectEntryLinesToMatchingRoute } from "./connectEntryLinesToMatching.js"
import { deleteOneMatchingRoute } from "./deleteOneMatching.js"
import { readOneMatchingRoute } from "./readOneMatching.js"

export const $idMatchingRoutes = [
    deleteOneMatchingRoute,
    readOneMatchingRoute,
    connectEntryLinesToMatchingRoute,
]
