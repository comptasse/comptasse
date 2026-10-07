import { models } from "@comptasse/application-metadata"
import { eq } from "drizzle-orm"
import type { Context } from "hono"
import { parseCookies } from "../utilities/cookies/parseCookies.js"
import { unsignString } from "../utilities/cookies/unsignString.js"
import { Exception } from "../utilities/exception.js"
import { selectOne } from "../utilities/sql/selectOne.js"
import { productName } from "../utilities/variables.js"
import { resolveOrganizationMiddleware } from "./resolveOrganizationMiddleware.js"

export async function checkAuthMiddleware(parameters: { context: Context<any> }) {
    try {
        const cookieAuth = await tryAuthWithCookie(parameters.context)
        if (cookieAuth !== null) {
            return cookieAuth
        }

        throw new Exception({
            internalMessage: "Auth error",
            cause: "No valid authentication method found",
        })
    } catch (error: unknown) {
        if (error instanceof Exception) {
            throw new Exception({
                statusCode: 401,
                internalMessage: "Auth error",
                rawError: error,
            })
        }
        throw new Exception({
            statusCode: 401,
            internalMessage: "Auth error",
            rawError: error,
        })
    }
}

async function tryAuthWithCookie(context: Context<any>) {
    try {
        const cookieMap = parseCookies({
            value: context.req.header("Cookie"),
        })

        const idUserSession = unsignString({
            signedValue: cookieMap[`${productName}_id_user_session`],
            secret: context.var.env.COOKIES_KEY,
        })

        if (!idUserSession) {
            return null
        }

        const userSession = await selectOne({
            database: context.var.clients.sql,
            table: models.userSession,
            where: (table) => eq(table.id, idUserSession),
        })

        if (!userSession || userSession.isActive === false) {
            return null
        }

        const user = await selectOne({
            database: context.var.clients.sql,
            table: models.user,
            where: (table) => eq(table.id, userSession.idUser),
        })

        if (!user) {
            return null
        }

        context.set("user", user)

        // Resolve idOrganization from header/cookie/body for cookie-based auth
        let idOrganization: string | undefined
        try {
            idOrganization = await resolveOrganizationMiddleware({
                context,
            })
        } catch {
            // Fallback to URL path param when the route is mounted under /organizations/:idOrganization
            // and nested Hono apps don't expose the param to resolveOrganizationMiddleware.
            const urlParam = context.req.param("idOrganization")
            idOrganization = urlParam && !urlParam.startsWith(":") ? urlParam : undefined
        }

        return {
            userSession: userSession,
            user: user,
            idOrganization: idOrganization,
        }
    } catch {
        return null
    }
}
