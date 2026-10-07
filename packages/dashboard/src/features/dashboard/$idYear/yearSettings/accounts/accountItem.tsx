import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { css } from "@comptasse/ui/utilities/cn.js"
import { type MouseEvent, memo, useCallback } from "react"
import type * as v from "valibot"

export const INDENT_PER_LEVEL = 16

export const ACCOUNT_ITEM_HEIGHT = 32

const labelContainerStyle = css({
    padding: "1",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: "0.5rem",
})

const numberBaseStyle = css({
    color: "neutral",
    fontSize: "xs",
    lineHeight: "none",
})
const numberBoldStyle = css({
    color: "neutral",
    fontSize: "xs",
    lineHeight: "none",
    fontWeight: "bold",
})

const labelBaseStyle = css({
    color: "neutral",
    fontSize: "xs",
    textAlign: "left",
    lineHeight: "none",
    whiteSpace: "nowrap",
})
const labelBoldStyle = css({
    color: "neutral",
    fontSize: "xs",
    textAlign: "left",
    lineHeight: "none",
    whiteSpace: "nowrap",
    fontWeight: "bold",
})

export const AccountItem = memo(function AccountItem(props: {
    account: v.InferOutput<typeof returnedSchemas.account>
    level: number
    href: string
    onClick?: () => void
}) {
    const handleClick = useCallback(
        (e: MouseEvent<HTMLAnchorElement>) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
            e.preventDefault()
            props.onClick?.()
        },
        [
            props.onClick,
        ],
    )

    return (
        <a
            href={props.href}
            data-account-link
            className={css({
                width: "100%",
                cursor: "pointer",
            })}
            onClick={handleClick}
        >
            <div
                className={css({
                    minWidth: "fit",
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem",
                    _hover: {
                        backgroundColor: "neutral/5",
                    },
                    borderRadius: "md",
                    borderBottomWidth: "1px",
                    borderColor: "neutral/5",
                    _last: {
                        borderBottomWidth: "0",
                    },
                })}
                style={{
                    height: `${ACCOUNT_ITEM_HEIGHT}px`,
                    paddingLeft: `${(props.level + 1) * INDENT_PER_LEVEL}px`,
                }}
            >
                <div className={labelContainerStyle}>
                    <span className={!props.account.isOptional ? numberBoldStyle : numberBaseStyle}>
                        {props.account.number}
                    </span>
                    <span className={!props.account.isOptional ? labelBoldStyle : labelBaseStyle}>
                        {props.account.label}
                    </span>
                </div>
            </div>
        </a>
    )
})
