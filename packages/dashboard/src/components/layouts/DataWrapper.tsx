import type { routeDefinition } from "@comptasse/application-metadata/utilities"
import { CircularLoader, FormatError } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useParams } from "@tanstack/react-router"
import { type ComponentProps, type ReactElement, Suspense } from "react"
import type * as v from "valibot"
import { useDataFromAPI } from "../../utilities/useHTTPData.js"

export function DataWrapper<TRouteDefinition extends ReturnType<typeof routeDefinition>>(props: {
    routeDefinition: TRouteDefinition
    body: v.InferInput<TRouteDefinition["schemas"]["body"]>
    params?: Record<string, string>
    children: (data: v.InferOutput<TRouteDefinition["schemas"]["return"]>) => ReactElement | Array<ReactElement> | null
    className?: ComponentProps<"div">["className"]
    loaderProps?: ComponentProps<typeof CircularLoader>
    errorProps?: ComponentProps<typeof FormatError>
}) {
    const urlParams = useParams({
        strict: false,
    })
    const params = {
        ...props.params,
    }
    if (
        props.routeDefinition.path.includes(":idOrganization") &&
        params.idOrganization === undefined &&
        typeof urlParams.idOrganization === "string"
    ) {
        params.idOrganization = urlParams.idOrganization
    }

    const response = useDataFromAPI({
        routeDefinition: props.routeDefinition,
        body: props.body,
        params,
    })

    if (response.data === undefined) {
        if (response.isPending) {
            return (
                <CircularLoader
                    {...props.loaderProps}
                    text={props.loaderProps?.text ?? "Chargement des données..."}
                    className={css.raw(
                        {
                            padding: "1rem",
                        },
                        props.loaderProps?.className,
                    )}
                />
            )
        }
        return (
            <FormatError
                {...props.errorProps}
                text={props.errorProps?.text ?? "Erreur lors de la récupération des données."}
                className={{
                    padding: "1rem",
                }}
            />
        )
    }

    return <Suspense fallback={<CircularLoader />}>{props.children(response.data)}</Suspense>
}
