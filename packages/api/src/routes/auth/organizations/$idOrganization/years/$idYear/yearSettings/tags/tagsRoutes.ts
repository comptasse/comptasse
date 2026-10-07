import { createOneTagRoute } from "./createOneTag.js"
import { readAllTagsRoute } from "./readAllTags.js"

export const tagsRoutes = [
    createOneTagRoute,
    readAllTagsRoute,
]
