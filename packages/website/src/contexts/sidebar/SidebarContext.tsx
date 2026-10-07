import { createContext, useContext } from "react"

export const SidebarWidthContext = createContext<number>(280)
export const SidebarSetWidthContext = createContext<(width: number) => void>(() => {})

export function useSidebarContext() {
    const width = useContext(SidebarWidthContext)
    const setWidth = useContext(SidebarSetWidthContext)
    return {
        width,
        setWidth,
    }
}
