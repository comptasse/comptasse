import { $idTagRoutes } from "./$idTag/$idTagRoutes.js"
import { createOneOrganizationTagRoute } from "./createOneTag.js"
import { readAllOrganizationTagsRoute } from "./readAllTags.js"

export const tagsRoutes = [
    createOneOrganizationTagRoute,
    readAllOrganizationTagsRoute,

    ...$idTagRoutes,
]
