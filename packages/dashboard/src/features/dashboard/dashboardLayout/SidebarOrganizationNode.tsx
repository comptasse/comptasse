import { readAllYearsRouteDefinition } from "@comptasse/application-metadata/routes"
import { IconBuilding, IconCalendar, IconCloud, IconHome, IconLock, IconSettings, IconUsers } from "@tabler/icons-react"
import { useRouterState } from "@tanstack/react-router"
import { useMemo } from "react"
import { TreeNode, TreeNodeLink } from "../../../components/layouts/tree/TreeNode.js"
import { useCollapsibleState } from "../../../components/layouts/tree/useCollapsibleState.js"
import { useDataFromAPI } from "../../../utilities/useHTTPData.js"
import { SidebarYearNode } from "./SidebarYearNode.js"

type Org = {
    id: string
    name?: string
}

function usePathname() {
    return useRouterState({
        select: (s) => s.location.pathname,
    })
}

export function SidebarOrganizationNode({ org }: { org: Org }) {
    const pathname = usePathname()
    const orgPrefix = `/organisation/${org.id}`
    const orgMatch = pathname.startsWith(orgPrefix + "/")
    const [isExpanded, setExpanded] = useCollapsibleState(pathname, orgMatch)
    const [isSettingsExpanded, setSettingsExpanded] = useCollapsibleState(
        pathname,
        pathname.startsWith(`${orgPrefix}/paramètres`),
    )
    const p = (path: string) => path.replace("$idOrganization", org.id)
    const isActive = (path: string) => pathname === p(path)
    const anyOrgChildActive = isExpanded || orgMatch
    const params = {
        idOrganization: org.id,
    }

    const yearsResponse = useDataFromAPI({
        routeDefinition: readAllYearsRouteDefinition,
        body: {
            idOrganization: org.id,
        },
        enabled: anyOrgChildActive,
    })

    const years = useMemo(() => {
        if (!yearsResponse.data) return []
        return yearsResponse.data
    }, [
        yearsResponse.data,
    ])

    return (
        <TreeNode
            icon={<IconBuilding />}
            label={org.name ?? org.id}
            expanded={isExpanded}
            onToggle={() => setExpanded(!isExpanded)}
            onClick={() => {}}
        >
            {isExpanded && yearsResponse.isLoading && (
                <div
                    style={{
                        padding: "0.375rem 0.5rem",
                        paddingLeft: "1.75rem",
                        fontSize: "0.75rem",
                        color: "var(--colors-neutral-40)",
                    }}
                >
                    Chargement...
                </div>
            )}
            <TreeNodeLink
                icon={<IconCloud />}
                label="Stockage"
                depth={1}
                to="/organisation/$idOrganization/stockage"
                params={params}
                active={isActive("/organisation/$idOrganization/stockage")}
            />
            {years.map((year: any) => (
                <SidebarYearNode
                    key={year.id}
                    orgId={org.id}
                    year={year}
                />
            ))}
            <TreeNode
                icon={<IconSettings />}
                label="Paramètres"
                depth={1}
                expanded={isSettingsExpanded}
                onToggle={() => setSettingsExpanded(!isSettingsExpanded)}
                onClick={() => {}}
            >
                <TreeNodeLink
                    icon={<IconHome />}
                    label="Général"
                    depth={2}
                    to="/organisation/$idOrganization/paramètres"
                    params={params}
                    active={isActive("/organisation/$idOrganization/paramètres")}
                />
                <TreeNodeLink
                    icon={<IconLock />}
                    label="Sécurité"
                    depth={2}
                    to="/organisation/$idOrganization/paramètres/sécurité"
                    params={params}
                    active={isActive("/organisation/$idOrganization/paramètres/sécurité")}
                />
                <TreeNodeLink
                    icon={<IconCalendar />}
                    label="Exercices"
                    depth={2}
                    to="/organisation/$idOrganization/exercices"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercices")}
                />
                <TreeNodeLink
                    icon={<IconUsers />}
                    label="Membres"
                    depth={2}
                    to="/organisation/$idOrganization/paramètres/membres"
                    params={params}
                    active={isActive("/organisation/$idOrganization/paramètres/membres")}
                />
            </TreeNode>
        </TreeNode>
    )
}
