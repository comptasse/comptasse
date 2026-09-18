import { createRoute, redirect } from "@tanstack/react-router"
import { rootLayoutRoute } from "../rootLayoutRoute.js"

export const cliRoute = createRoute({
    getParentRoute: () => rootLayoutRoute,
    path: "/cli",
    beforeLoad: () => {
        throw redirect({
            href: "https://github.com/comptasse/comptasse/releases/latest",
        })
    },
})
