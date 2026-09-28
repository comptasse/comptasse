import { Exception } from "../utilities/exception.js"

export async function requireOrganizationMiddleware(parameters: { idOrganization: string | undefined }) {
    if (parameters.idOrganization !== undefined) {
        return parameters.idOrganization
    }

    throw new Exception({
        statusCode: 400,
        internalMessage: "Organization required",
        cause: "No organization context found in the request",
    })
}
