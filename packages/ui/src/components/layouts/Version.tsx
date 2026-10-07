import version from "../../../../../VERSION?raw"
import { css } from "../../utilities/cn.ts"

export function Version() {
    return (
        <span
            className={css({
                color: "primary",
                fontWeight: "lighter",
                fontSize: "xs",
                lineHeight: 1,
            })}
        >
            {version.trim()}
        </span>
    )
}
