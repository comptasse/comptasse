import { deleteOneTagRoute } from "./deleteOneTag.js"
import { readOneTagRoute } from "./readOneTag.js"
import { updateOneTagRoute } from "./updateOneTag.js"

export const $idTagRoutes = [
    deleteOneTagRoute,
    readOneTagRoute,
    updateOneTagRoute,
]
