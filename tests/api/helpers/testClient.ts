const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000"

export type TestResponse<T = unknown> = {
    status: number
    data: T
    headers: Headers
    cookies: string[]
}

/**
 * HTTP client for API integration tests.
 * Supports all HTTP methods; body is omitted for GET and HEAD requests.
 */
export async function apiRequest<T = unknown>(parameters: {
    path: string
    method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT"
    body?: Record<string, unknown>
    cookies?: string
}): Promise<TestResponse<T>> {
    const method = parameters.method ?? "POST"
    const hasBody = method !== "GET" && method !== "HEAD"
    const response = await fetch(`${API_BASE_URL}${parameters.path}`, {
        method,
        headers: {
            ...(hasBody
                ? {
                      "Content-Type": "application/json",
                  }
                : {}),
            ...(parameters.cookies
                ? {
                      Cookie: parameters.cookies,
                  }
                : {}),
        },
        body: hasBody && parameters.body !== undefined ? JSON.stringify(parameters.body) : undefined,
    })

    const setCookieHeaders = response.headers.getSetCookie?.() ?? []

    const data = (await response.json().catch(() => null)) as T

    return {
        status: response.status,
        data,
        headers: response.headers,
        cookies: setCookieHeaders,
    }
}

/**
 * Parses Set-Cookie headers into a cookie string for subsequent requests.
 */
export function buildCookieString(setCookieHeaders: string[]): string {
    return setCookieHeaders.map((header) => header.split(";")[0]).join("; ")
}

/**
 * Merges existing cookies with new Set-Cookie headers.
 */
export function mergeCookies(existing: string, newSetCookieHeaders: string[]): string {
    const existingMap = new Map<string, string>()
    if (existing) {
        for (const part of existing.split("; ")) {
            const [key, ...val] = part.split("=")
            existingMap.set(key, val.join("="))
        }
    }
    for (const header of newSetCookieHeaders) {
        const cookiePart = header.split(";")[0]
        const [key, ...val] = cookiePart.split("=")
        existingMap.set(key, val.join("="))
    }
    return Array.from(existingMap.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join("; ")
}
