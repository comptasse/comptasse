import { Button, ButtonGhostContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import type { Icon, IconProps } from "@tabler/icons-react"
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react"
import type { ReactElement, ReactNode } from "react"

export function DocsTreeNode({
    icon,
    label,
    expanded = false,
    active = false,
    depth = 0,
    onToggle,
    onClick,
    children,
}: {
    icon?: ReactElement<IconProps & React.RefAttributes<Icon>>
    label: string
    expanded?: boolean
    active?: boolean
    depth?: number
    onToggle?: () => void
    onClick?: () => void
    children?: ReactNode
}) {
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
                            left: "0.5rem",
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
