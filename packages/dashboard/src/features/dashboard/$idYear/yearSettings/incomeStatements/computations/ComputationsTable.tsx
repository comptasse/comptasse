import { readAllComputationsRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconCalculator } from "@tabler/icons-react"
import type * as v from "valibot"
import { LinkButton } from "../../../../../../components/LinkButton.tsx"
import { DataWrapper } from "../../../../../../components/layouts/DataWrapper.tsx"
import { EmptyState } from "../../../../../../components/layouts/EmptyState.tsx"

export function ComputationsTable(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
}) {
    return (
        <DataWrapper
            routeDefinition={readAllComputationsRouteDefinition}
            body={{
                idYear: props.idYear,
            }}
        >
            {(computations) => {
                if (computations.length === 0) {
                    return (
                        <EmptyState
                            icon={<IconCalculator size={48} />}
                            title="Aucune ligne de calcul"
                            subtitle="Ajoutez une ligne de calcul pour commencer"
                        />
                    )
                }
                return (
                    <div
                        className={css({
                            height: "fit-content",
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            padding: "1rem",
                        })}
                    >
                        {computations.map((computation) => (
                            <LinkButton
                                key={computation.id}
                                to="/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs/$idComputation"
                                params={{
                                    idOrganization: props.idOrganization,
                                    idYear: props.idYear,
                                    idComputation: computation.id,
                                }}
                                className={{
                                    width: "100%",
                                }}
                            >
                                <div
                                    className={css({
                                        padding: "0.5rem",
                                        borderRadius: "md",
                                        minWidth: "fit-content",
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        _hover: {
                                            backgroundColor: "neutral/5",
                                        },
                                        borderBottom: "1px solid",
                                        borderBottomColor: "neutral/5",
                                        _last: {
                                            borderBottom: "0",
                                        },
                                    })}
                                >
                                    <span
                                        className={css({
                                            color: "neutral",
                                            fontSize: "xs",
                                            lineHeight: "none",
                                        })}
                                    >
                                        {computation.number}
                                    </span>
                                    <span
                                        className={css({
                                            color: "neutral",
                                            fontSize: "xs",
                                            textAlign: "left",
                                            lineHeight: "none",
                                            whiteSpace: "nowrap",
                                        })}
                                    >
                                        {computation.label}
                                    </span>
                                </div>
                            </LinkButton>
                        ))}
                    </div>
                )
            }}
        </DataWrapper>
    )
}
