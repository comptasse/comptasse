import type { Icon, IconProps, ReactNode } from "@tabler/icons-react"
import { cloneElement, type ReactElement } from "react"
import type { Styles } from "../../../styled-system/css/css"
import type { SystemStyleObject } from "../../../styled-system/types"
import { css } from "../../utilities/cn.ts"
import { CircularLoader } from "../layouts/CircularLoader"

export type ButtonColor = "default" | "neutral" | "danger" | "success"

export type ButtonContentProps = {
    color?: ButtonColor
    text?: string
    title?: string
    leftIcon?: ReactElement<IconProps & React.RefAttributes<Icon>>
    rightIcon?: ReactElement<IconProps & React.RefAttributes<Icon>>
    isLoading?: boolean
    isDisabled?: boolean
    isCurrent?: boolean
    className?: Styles
    children?: ReactNode
}

export function renderButtonContent(
    props: ButtonContentProps,
    classes: Partial<Record<"container" | "leftIcon" | "text" | "rightIcon", SystemStyleObject>>,
    contextLoading = false,
) {
    const isLoading = props.isLoading ?? contextLoading
    const isDisabled = props.isDisabled || isLoading

    return (
        <div
            title={props.title ?? props.text}
            aria-current={props.isCurrent}
            aria-disabled={isDisabled}
            className={css(classes.container, props.className)}
        >
            {isLoading ? (
                <div className={css(classes.leftIcon)}>
                    <CircularLoader size={16} />
                </div>
            ) : (
                props.leftIcon &&
                cloneElement(props.leftIcon, {
                    "aria-disabled": isDisabled,
                    "aria-current": props.isCurrent,
                    size: 14,
                    className: css(classes.leftIcon),
                    strokeWidth: 1.75,
                })
            )}

            {props.text && (
                <span
                    aria-disabled={isDisabled}
                    aria-current={props.isCurrent}
                    className={css(classes.text)}
                >
                    {props.text}
                </span>
            )}

            {props.children}

            {props.rightIcon &&
                cloneElement(props.rightIcon, {
                    "aria-disabled": isDisabled,
                    size: 16 - 4,
                    className: css(classes.rightIcon, {
                        _disabled: {
                            color: "neutral/50",
                        },
                    }),
                    strokeWidth: 1.75,
                })}
        </div>
    )
}
