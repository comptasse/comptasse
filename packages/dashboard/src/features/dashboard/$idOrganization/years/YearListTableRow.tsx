import type { readAllYearsRouteDefinition } from "@comptasse/application-metadata/routes"
import { Button, Chip, formatDate, LinkContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useRouter } from "@tanstack/react-router"
import type * as v from "valibot"
import { ListTable } from "../../../../components/layouts/listTable/listTable.tsx"

export function YearListTableRow(props: {
    year: v.InferOutput<typeof readAllYearsRouteDefinition.schemas.return>[number]
}) {
    const router = useRouter()
    const startDate = formatDate(props.year.startingAt)
    const endDate = formatDate(props.year.endingAt)

    return (
        <ListTable.Row>
            <div
                className={css({
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                })}
            >
                <div
                    className={css({
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "start",
                        gap: "1rem",
                    })}
                >
                    <div
                        className={css({
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                        })}
                    >
                        <Button
                            onClick={() =>
                                router.navigate({
                                    to: "/organisation/$idOrganization/exercice/$idYear/écritures",
                                    params: {
                                        idOrganization: props.year.idOrganization,
                                        idYear: props.year.id,
                                    },
                                })
                            }
                        >
                            <LinkContent
                                className={{
                                    fontSize: "base",
                                    fontWeight: "semibold",
                                    color: "primary",
                                    textDecoration: "none",
                                    _hover: {
                                        textDecoration: "underline",
                                    },
                                }}
                            >
                                {props.year.label}
                            </LinkContent>
                        </Button>
                    </div>
                    <div
                        className={css({
                            display: "flex",
                            justifyContent: "start",
                            alignItems: "start",
                            gap: "0.5rem",
                        })}
                    >
                        {props.year.isClosed ? (
                            <Chip
                                text="Clôturé"
                                color="neutral"
                            />
                        ) : (
                            <Chip
                                text="En cours"
                                color="success"
                            />
                        )}
                    </div>
                </div>
                <div
                    className={css({
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                    })}
                >
                    <span
                        className={css({
                            fontSize: "xs",
                            color: "neutral/50",
                        })}
                    >
                        {startDate} - {endDate}
                    </span>
                </div>
            </div>
        </ListTable.Row>
    )
}
