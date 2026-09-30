import {
    IconBook,
    IconBook2,
    IconCalculator,
    IconCalendar,
    IconChartBar,
    IconHome,
    IconListNumbers,
    IconPackage,
    IconPencil,
    IconReport,
    IconReportMoney,
    IconScale,
    IconSettings,
    IconTag,
} from "@tabler/icons-react"
import { useRouterState } from "@tanstack/react-router"
import { TreeNode, TreeNodeLink } from "../../../components/layouts/tree/TreeNode.js"
import { useCollapsibleState } from "../../../components/layouts/tree/useCollapsibleState.js"

type Year = {
    id: string
    label: string
}

function usePathname() {
    return useRouterState({
        select: (s) => s.location.pathname,
    })
}

export function SidebarYearNode({ orgId, year }: { orgId: string; year: Year }) {
    const pathname = usePathname()
    const yearPrefix = `/organisation/${orgId}/exercice/${year.id}`
    const isSettingsPath =
        pathname.startsWith(yearPrefix + "/paramètres") ||
        pathname.startsWith(yearPrefix + "/comptes") ||
        pathname.startsWith(yearPrefix + "/journaux") ||
        pathname.startsWith(yearPrefix + "/catégories") ||
        pathname.startsWith(yearPrefix + "/bilan") ||
        pathname.startsWith(yearPrefix + "/compte-de-résultat")
    const [isExpanded, setExpanded] = useCollapsibleState(pathname, pathname.startsWith(yearPrefix))
    const [isSettingsExpanded, setSettingsExpanded] = useCollapsibleState(pathname, isSettingsPath)
    const [isDocumentsExpanded, setDocumentsExpanded] = useCollapsibleState(
        pathname,
        pathname.startsWith(yearPrefix + "/documents"),
    )
    const [isInventoryExpanded, setInventoryExpanded] = useCollapsibleState(
        pathname,
        pathname.startsWith(yearPrefix + "/inventaire"),
    )
    const [isCompteResultatExpanded, setCompteResultatExpanded] = useCollapsibleState(
        pathname,
        pathname.startsWith(yearPrefix + "/compte-de-résultat"),
    )

    const p = (path: string) => path.replace("$idOrganization", orgId).replace("$idYear", year.id)
    const isActive = (path: string) => pathname === p(path) || pathname.startsWith(`${p(path)}/`)
    const params = {
        idOrganization: orgId,
        idYear: year.id,
    }

    return (
        <TreeNode
            icon={<IconCalendar />}
            label={year.label ?? year.id}
            depth={1}
            expanded={isExpanded}
            onToggle={() => setExpanded(!isExpanded)}
            onClick={() => {}}
        >
            <TreeNodeLink
                icon={<IconPencil />}
                label="Écritures"
                depth={2}
                to="/organisation/$idOrganization/exercice/$idYear/écritures"
                params={params}
                active={isActive("/organisation/$idOrganization/exercice/$idYear/écritures")}
            />
            <TreeNode
                icon={<IconReport />}
                label="Documents"
                depth={2}
                expanded={isDocumentsExpanded}
                onToggle={() => setDocumentsExpanded(!isDocumentsExpanded)}
                onClick={() => {}}
            >
                <TreeNodeLink
                    icon={<IconBook />}
                    label="Livre-journal"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/documents"
                    params={params}
                    active={
                        isActive("/organisation/$idOrganization/exercice/$idYear/documents") &&
                        !isActive("/organisation/$idOrganization/exercice/$idYear/documents/grand-livre") &&
                        !isActive("/organisation/$idOrganization/exercice/$idYear/documents/balance") &&
                        !isActive("/organisation/$idOrganization/exercice/$idYear/documents/bilan") &&
                        !isActive("/organisation/$idOrganization/exercice/$idYear/documents/compte-de-résultat")
                    }
                />
                <TreeNodeLink
                    icon={<IconBook2 />}
                    label="Grand livre"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/documents/grand-livre"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercice/$idYear/documents/grand-livre")}
                />
                <TreeNodeLink
                    icon={<IconChartBar />}
                    label="Balance"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/documents/balance"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercice/$idYear/documents/balance")}
                />
                <TreeNodeLink
                    icon={<IconReport />}
                    label="Bilan"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/documents/bilan"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercice/$idYear/documents/bilan")}
                />
                <TreeNodeLink
                    icon={<IconReportMoney />}
                    label="Compte de résultat"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/documents/compte-de-résultat"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercice/$idYear/documents/compte-de-résultat")}
                />
            </TreeNode>
            <TreeNode
                icon={<IconPackage />}
                label="Inventaire"
                depth={2}
                expanded={isInventoryExpanded}
                onToggle={() => setInventoryExpanded(!isInventoryExpanded)}
                onClick={() => {}}
            >
                <TreeNodeLink
                    icon={<IconPackage />}
                    label="Articles"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/inventaire"
                    params={params}
                    active={
                        isActive("/organisation/$idOrganization/exercice/$idYear/inventaire") &&
                        !isActive("/organisation/$idOrganization/exercice/$idYear/inventaire/catégories")
                    }
                />
                <TreeNodeLink
                    icon={<IconTag />}
                    label="Catégories"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/inventaire/catégories"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercice/$idYear/inventaire/catégories")}
                />
            </TreeNode>
            <TreeNode
                icon={<IconSettings />}
                label="Paramètres"
                depth={2}
                expanded={isSettingsExpanded}
                onToggle={() => setSettingsExpanded(!isSettingsExpanded)}
                onClick={() => {}}
            >
                <TreeNodeLink
                    icon={<IconHome />}
                    label="Général"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/paramètres"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercice/$idYear/paramètres")}
                />
                <TreeNodeLink
                    icon={<IconListNumbers />}
                    label="Comptes"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/comptes"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercice/$idYear/comptes")}
                />
                <TreeNodeLink
                    icon={<IconBook />}
                    label="Journaux"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/journaux"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercice/$idYear/journaux")}
                />
                <TreeNodeLink
                    icon={<IconTag />}
                    label="Catégories"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/catégories"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercice/$idYear/catégories")}
                />
                <TreeNodeLink
                    icon={<IconScale />}
                    label="Bilan"
                    depth={3}
                    to="/organisation/$idOrganization/exercice/$idYear/bilan"
                    params={params}
                    active={isActive("/organisation/$idOrganization/exercice/$idYear/bilan")}
                />
                <TreeNode
                    icon={<IconReportMoney />}
                    label="Compte de résultat"
                    depth={3}
                    expanded={isCompteResultatExpanded}
                    onToggle={() => setCompteResultatExpanded(!isCompteResultatExpanded)}
                    onClick={() => {}}
                >
                    <TreeNodeLink
                        icon={<IconReportMoney />}
                        label="Postes"
                        depth={4}
                        to="/organisation/$idOrganization/exercice/$idYear/compte-de-résultat"
                        params={params}
                        active={
                            isActive("/organisation/$idOrganization/exercice/$idYear/compte-de-résultat") &&
                            !isActive("/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs")
                        }
                    />
                    <TreeNodeLink
                        icon={<IconCalculator />}
                        label="Calculs"
                        depth={4}
                        to="/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs"
                        params={params}
                        active={isActive("/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs")}
                    />
                </TreeNode>
            </TreeNode>
        </TreeNode>
    )
}
