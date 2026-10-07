import { useState } from "react"

const DEFAULT_ORIGIN = "https://comptasse.com"

export function useSiteOrigin() {
    const [origin] = useState(() => (typeof window === "undefined" ? DEFAULT_ORIGIN : window.location.origin))

    return origin
}
