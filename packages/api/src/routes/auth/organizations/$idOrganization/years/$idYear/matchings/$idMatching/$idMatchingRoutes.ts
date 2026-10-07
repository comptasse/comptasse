import { connectEntryLinesToMatchingRoute } from "./connectEntryLinesToMatching.js"
import { deleteOneMatchingRoute } from "./deleteOneMatching.js"
import { readOneMatchingRoute } from "./readOneMatching.js"
import { updateOneMatchingRoute } from "./updateOneMatching.js"

export const $idMatchingRoutes = [
    deleteOneMatchingRoute,
    readOneMatchingRoute,
    updateOneMatchingRoute,
    connectEntryLinesToMatchingRoute,
]
