import type { ReactNode } from "react"
import { useCallback, useMemo, useState } from "react"
import { RightPanel } from "../../components/layouts/RightPanel.js"
import { RightPanelContext } from "./RightPanelContext.js"

export function RightPanelContextProvider({ children }: { children: ReactNode }) {
    const [panelContent, setPanelContent] = useState<{
        children: ReactNode
        title: string
    } | null>(null)

    const openPanel = useCallback((children: ReactNode, title: string) => {
        setPanelContent({
            children,
            title,
        })
    }, [])

    const closePanel = useCallback(() => {
        setPanelContent(null)
    }, [])

    const value = useMemo(
        () => ({
            openPanel,
            closePanel,
        }),
        [
            openPanel,
            closePanel,
        ],
    )

    return (
        <RightPanelContext.Provider value={value}>
            {children}
            <RightPanel
                open={panelContent !== null}
                onClose={closePanel}
                title={panelContent?.title ?? ""}
            >
                {panelContent?.children}
            </RightPanel>
        </RightPanelContext.Provider>
    )
}
