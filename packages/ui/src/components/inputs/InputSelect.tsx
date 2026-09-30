import { IconCheck, IconChevronDown } from "@tabler/icons-react"
import { type InputHTMLAttributes, useState } from "react"
import type { FieldError } from "react-hook-form"
import type { Styles } from "../../../styled-system/css/css"
import { css } from "../../utilities/cn.js"
import { Button } from "../buttons/Button.js"
import { ButtonGhostContent } from "../buttons/ButtonGhostContent.js"
import { ButtonOutlineContent } from "../buttons/ButtonOutlineContent.js"
import { FormatNull } from "../formats/FormatNull.js"
import { CircularLoader } from "../layouts/CircularLoader.js"
import { Popover } from "../overlays/popover/popover.js"

function inputSelect<TValue>(value: TValue | null | undefined) {
    return value
}

function outputSelect<TValue extends string>(value: TValue | undefined | null) {
    if (!value) return null
    return value
}

export function InputSelect<TValue extends string>(
    props: Omit<InputHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "className"> & {
        error?: FieldError
        value?: TValue | null
        defaultValue?: TValue | null
        onChange?: (value?: TValue | null | undefined) => void
        options:
            | Array<{
                  key: TValue
                  label: string
              }>
            | undefined
        autoFocus?: boolean
        allowEmpty?: boolean
        isDisabled?: boolean
        isLoading?: boolean
        className?: Styles
    },
) {
    const [open, setOpen] = useState(false)

    const currentOption = props.options?.find((x) => x.key === inputSelect(props.value ?? props.defaultValue))
    return (
        <Popover.Root
            open={open}
            onOpenChange={setOpen}
        >
            <Popover.Trigger asChild>
                <Button
                    autoFocus={props.autoFocus}
                    onClick={() => {
                        if (props.isDisabled === true) return
                        setOpen(!open)
                    }}
                    className={css.raw(
                        {
                            width: "100%",
                        },
                        props.isDisabled
                            ? {
                                  cursor: "not-allowed",
                              }
                            : undefined,
                        props.className,
                    )}
                    data-open={open}
                >
                    <ButtonOutlineContent
                        text={
                            currentOption === undefined
                                ? (props.placeholder ?? "Veuiller choisir une option")
                                : currentOption.label
                        }
                        rightIcon={<IconChevronDown />}
                        className={css.raw(
                            {
                                width: "100%",
                                justifyContent: "space-between",
                                _hover: {
                                    borderColor: "neutral/50",
                                },
                                _focusWithin: {
                                    borderColor: "neutral/50",
                                    boxShadow: "inset",
                                },
                            },
                            props.error !== undefined
                                ? {
                                      borderColor: "error",
                                  }
                                : undefined,
                            currentOption === undefined
                                ? {
                                      "& span": {
                                          color: "neutral/50",
                                      },
                                  }
                                : undefined,
                        )}
                    />
                </Button>
            </Popover.Trigger>
            <Popover.Content
                align="start"
                className={{
                    padding: "0.5rem",
                }}
            >
                <div
                    className={css({
                        height: "fit-content",
                        maxHeight: "256px",
                        overflowY: "auto",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "start",
                        alignItems: "start",
                        gap: "0.125rem",
                    })}
                >
                    {props.isLoading === true ? (
                        <CircularLoader text="Chargement des options..." />
                    ) : props.options === undefined || props.options.length === 0 ? (
                        <FormatNull text="Pas d'options" />
                    ) : (
                        props.options.map((option) => {
                            const isSelected = currentOption?.key === option.key
                            return (
                                <Button
                                    key={option.key}
                                    onClick={() => {
                                        if (props.isDisabled === true) return
                                        if (props.onChange === undefined) return
                                        if (props.allowEmpty === true && option.key === props.value) {
                                            props.onChange(undefined)
                                            setOpen(false)
                                            return
                                        }
                                        props.onChange(outputSelect(option.key))
                                        setOpen(false)
                                    }}
                                    className={{
                                        width: "100%",
                                    }}
                                >
                                    <ButtonGhostContent
                                        text={option.label}
                                        rightIcon={isSelected ? <IconCheck /> : undefined}
                                        className={css.raw(
                                            {
                                                width: "100%",
                                                justifyContent: "space-between",
                                            },
                                            isSelected
                                                ? {
                                                      backgroundColor: "background",
                                                  }
                                                : undefined,
                                        )}
                                        isCurrent={isSelected}
                                    />
                                </Button>
                            )
                        })
                    )}
                </div>
            </Popover.Content>
        </Popover.Root>
    )
}
