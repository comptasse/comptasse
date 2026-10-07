import { getAllMyOrganizationsRouteDefinition } from "@comptasse/application-metadata/routes"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useRouter } from "@tanstack/react-router"
import { TreeSection } from "../../../components/layouts/tree/TreeSection.js"
import { useDataFromAPI } from "../../../utilities/useHTTPData.js"
import { SidebarOrganizationNode } from "./SidebarOrganizationNode.js"

export function SidebarNavigation() {
    const response = useDataFromAPI({
        routeDefinition: getAllMyOrganizationsRouteDefinition,
        body: {},
    })
    const orgs = Array.isArray(response.data) ? response.data : []
    const _router = useRouter()

    return (
        <nav
            className={css({
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
            })}
        >
            <TreeSection>
                {orgs.length === 0 && (
                    <div
                        className={css({
                            padding: "0.5rem",
                            fontSize: "0.875rem",
                            color: "neutral/500",
                        })}
                    >
                        {response.isLoading ? "Chargement..." : "Aucune organisation"}
                    </div>
                )}
                {orgs.map((item: any) => {
                    const org = item.organization
                    return (
                        <SidebarOrganizationNode
                            key={org.id}
                            org={org}
                        />
                    )
                })}
            </TreeSection>
        </nav>
    )
}
