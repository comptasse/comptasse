import { models, readOneOrganizationUserRouteDefinition } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../middlewares/checkAuthMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../middlewares/validateBody.middleware.js"
import { apiFactory } from "../../../../../../utilities/apiFactory.js"
import { Exception } from "../../../../../../utilities/exception.js"
import { response } from "../../../../../../utilities/response.js"
import { selectOne } from "../../../../../../utilities/sql/selectOne.js"

export const readOneOrganizationUserRoute = apiFactory
    .createApp()
    .get(readOneOrganizationUserRouteDefinition.path, async (c) => {
        const auth = await checkAuthMiddleware({
            context: c,
        })
        const body = await validateBodyMiddleware({
            context: c,
            schema: readOneOrganizationUserRouteDefinition.schemas.body,
        })

        const organizationUser = await selectOne({
            database: c.var.clients.sql,
            table: models.organizationUser,
            where: (table) => and(eq(table.id, body.idOrganizationUser)),
        })

        // Authorize against the *requesting* user's membership, not the target's.
        const requestingOrganizationUser = await selectOne({
            database: c.var.clients.sql,
            table: models.organizationUser,
            where: (table) =>
                and(eq(table.idUser, auth.user.id), eq(table.idOrganization, organizationUser.idOrganization)),
        })
        if (requestingOrganizationUser.isAdmin === false) {
            throw new Exception({
                statusCode: 401,
                internalMessage: "User is not admin of the organization",
                externalMessage: "Vous n'êtes pas administrateur de l'organisation",
            })
        }

        const readOneOrganizationUser = await c.var.clients.sql.query.organizationUserModel.findFirst({
            where: (table) => and(eq(table.id, body.idOrganizationUser)),
            with: {
                user: true,
            },
        })
        if (readOneOrganizationUser === undefined) {
            throw new Exception({
                statusCode: 404,
                internalMessage: "Organization user not found",
                externalMessage: "Utilisateur de l'organisation introuvable",
            })
        }

        return response({
            context: c,
            statusCode: 200,
            schema: readOneOrganizationUserRouteDefinition.schemas.return,
            data: readOneOrganizationUser,
        })
    })
