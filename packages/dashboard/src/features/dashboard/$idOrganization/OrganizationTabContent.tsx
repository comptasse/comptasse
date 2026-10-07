import { Button, ButtonGhostContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconCalendar, IconChevronRight, IconSettings, IconUsers } from "@tabler/icons-react"
import { useRouter } from "@tanstack/react-router"
import type { ReactNode } from "react"

type NavItem = {
    label: string
    description: string
    icon: ReactNode
    route: {
        to: string
        params: Record<string, string>
        search?: Record<string, string>
    }
}

function NavCard({ item }: { item: NavItem }) {
    const router = useRouter()
    return (
        <Button
            onClick={() =>
                router.navigate({
                    to: item.route.to,
                    params: item.route.params,
                    search: item.route.search,
                })
            }
            className={{
                width: "100%",
                height: "100%",
                textAlign: "left",
            }}
        >
            <div
                className={css({
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "1.25rem",
                    padding: "1.5rem",
                    border: "1px solid",
                    borderColor: "neutral/10",
                    borderRadius: "xl",
                    transition: "background-color 0.15s ease, border-color 0.15s ease",
                    _hover: {
                        backgroundColor: "neutral/3",
                        borderColor: "primary/20",
                    },
                })}
            >
                <div
                    className={css({
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "3.5rem",
                        height: "3.5rem",
                        borderRadius: "lg",
                        backgroundColor: "primary/8",
                        color: "primary",
                        flexShrink: 0,
                    })}
                >
                    {item.icon}
                </div>
                <div
                    className={css({
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.375rem",
                    })}
                >
                    <span
                        className={css({
                            fontSize: "base",
                            fontWeight: "semibold",
                            color: "neutral",
                        })}
                    >
                        {item.label}
                    </span>
                    <span
                        className={css({
                            fontSize: "sm",
                            color: "neutral/50",
                            lineHeight: "1.5",
                        })}
                    >
                        {item.description}
                    </span>
                </div>
                <ButtonGhostContent
                    leftIcon={
                        <IconChevronRight
                            className={css({
                                color: "neutral/30",
                            })}
                        />
                    }
                />
            </div>
        </Button>
    )
}

export function OrganizationTabContent(props: { idOrganization: string }) {
    const items: NavItem[] = [
        {
            label: "Exercices",
            description: "Ann\u00e9es fiscales et \u00e9critures comptables",
            icon: <IconCalendar />,
            route: {
                to: "/organisation/$idOrganization/exercices",
                params: {
                    idOrganization: props.idOrganization,
                },
            },
        },
        {
            label: "Membres",
            description: "Utilisateurs et droits d\u2019acc\u00e8s",
            icon: <IconUsers />,
            route: {
                to: "/organisation/$idOrganization/paramètres/membres",
                params: {
                    idOrganization: props.idOrganization,
                },
            },
        },
        {
            label: "Param\u00e8tres",
            description: "Configuration g\u00e9n\u00e9rale et s\u00e9curit\u00e9",
            icon: <IconSettings />,
            route: {
                to: "/organisation/$idOrganization/paramètres",
                params: {
                    idOrganization: props.idOrganization,
                },
            },
        },
    ]

    return (
        <div
            className={css({
                width: "100%",
                flex: 1,
                padding: "2rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "1rem",
                alignContent: "start",
                overflowY: "auto",
            })}
        >
            {items.map((item) => (
                <div
                    key={item.label}
                    className={css({
                        aspectRatio: "1",
                    })}
                >
                    <NavCard item={item} />
                </div>
            ))}
        </div>
    )
}
