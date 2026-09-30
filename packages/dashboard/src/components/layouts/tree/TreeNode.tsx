import { Button, ButtonGhostContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import type { Icon, IconProps } from "@tabler/icons-react"
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import type { ReactElement, ReactNode } from "react"

type TreeNodeProps = {
    icon?: ReactElement<IconProps & React.RefAttributes<Icon>>
    label: string
    expanded?: boolean
    active?: boolean
    depth?: number
    onToggle?: () => void
    onClick?: () => void
    children?: ReactNode
}

export function TreeNode({
    icon,
    label,
    expanded = false,
    active = false,
    depth = 0,
    onToggle,
    onClick,
    children,
}: TreeNodeProps) {
    const hasChildren = children !== undefined
    const canToggle = hasChildren && onToggle !== undefined

    function handleClick() {
        if (canToggle) onToggle()
        if (onClick) onClick()
    }

    return (
        <>
            <Button
                onClick={handleClick}
                style={{
                    paddingLeft: `${depth * 1}rem`,
                }}
                className={{
                    width: "100%",
                    gap: "0.25rem",
                }}
            >
                <ButtonGhostContent
                    leftIcon={icon}
                    text={label}
                    rightIcon={expanded ? <IconChevronDown /> : <IconChevronRight />}
                    isCurrent={active}
                    className={{
                        width: "100%",
                        justifyContent: "start",
                    }}
                />
            </Button>
            {hasChildren && expanded && (
                <div
                    className={css({
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                    })}
                >
                    <div
                        className={css({
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: "1rem",
                            borderLeft: "1px solid",
                            borderLeftColor: "neutral/10",
                        })}
                    />
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                        })}
                    >
                        {children}
                    </div>
                </div>
            )}
        </>
    )
}

export function TreeNodeLink({
    icon,
    label,
    active = false,
    depth = 0,
    to,
    params,
}: {
    icon?: ReactElement<IconProps & React.RefAttributes<Icon>>
    label: string
    active?: boolean
    depth?: number
    to: string
    params?: Record<string, string | null | undefined>
}) {
    return (
        <Link
            to={to as never}
            params={params as never}
            style={{
                paddingLeft: `${depth * 1}rem`,
            }}
            className={css({
                width: "100%",
                maxWidth: "100%",
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
            })}
        >
            <ButtonGhostContent
                leftIcon={icon}
                text={label}
                isCurrent={active}
                className={{
                    width: "100%",
                    justifyContent: "start",
                }}
            />
        </Link>
    )
}
