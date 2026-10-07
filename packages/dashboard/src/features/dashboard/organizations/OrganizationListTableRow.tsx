import type { getAllMyOrganizationsRouteDefinition } from "@comptasse/application-metadata/routes"
import { Button, Chip, LinkContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useRouter } from "@tanstack/react-router"
import type * as v from "valibot"
import { ListTable } from "../../../components/layouts/listTable/listTable.tsx"

export function OrganizationListTableRow(props: {
    organizationUser: v.InferOutput<typeof getAllMyOrganizationsRouteDefinition.schemas.return>[number]
}) {
    const router = useRouter()
    const organization = props.organizationUser.organization

    const scopeLabel = organization.scope === "company" ? "Entreprise" : "Association"

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
                    <Button
                        onClick={() =>
                            router.navigate({
                                to: "/organisation/$idOrganization",
                                params: {
                                    idOrganization: organization.id,
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
                            {organization.name}
                        </LinkContent>
                    </Button>
                    <div
                        className={css({
                            display: "flex",
                            justifyContent: "start",
                            alignItems: "start",
                            gap: "0.5rem",
                        })}
                    >
                        {props.organizationUser.isAdmin && (
                            <Chip
                                text="Administrateur"
                                color="success"
                            />
                        )}
                        {props.organizationUser.status === "invited" && (
                            <Chip
                                text="En attente"
                                color="warning"
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
                    <Chip
                        text={scopeLabel}
                        color="neutral"
                    />
                </div>
            </div>
        </ListTable.Row>
    )
}
