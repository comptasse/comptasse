import { IconCheck, IconChevronDown } from "@tabler/icons-react"
import { useId, useMemo, useState } from "react"
import type { FieldError } from "react-hook-form"
import type { Styles } from "../../../styled-system/css/css"
import { css } from "../../utilities/cn.js"
import { Button } from "../buttons/Button.js"
import { ButtonGhostContent } from "../buttons/ButtonGhostContent.js"
import { ButtonOutlineContent } from "../buttons/ButtonOutlineContent.js"
import { FormatNull } from "../formats/FormatNull.js"
import { CircularLoader } from "../layouts/CircularLoader.js"
import { Virtualizer } from "../layouts/Virtualizer.js"
import { Popover } from "../overlays/popover/popover.js"
import { InputText } from "./InputText.js"

export function InputCombobox<TValue extends string>(props: {
    error?: FieldError
    placeholder?: string
    value?: TValue | null
    defaultValue?: TValue | null
    onChange: (value?: TValue | null) => void
    options: Array<{
        key: TValue
        label: string
    }>
    isLoading?: boolean
    isDisabled?: boolean
    autoFocus?: boolean
    className?: Styles
    allowEmpty?: boolean
}) {
    const popoverContentId = useId().replace(/:/g, "")
    const [open, setOpen] = useState(false)
    const [rawQuery, setRawQuery] = useState<string | null | undefined>(undefined)
    const { options } = props
    const currentOptions = useMemo(
        () =>
            rawQuery === null || rawQuery === undefined || rawQuery === ""
                ? options
                : options.filter((x) => x.label.toLowerCase().includes(rawQuery.toLowerCase())),
        [
            rawQuery,
            options,
        ],
    )
    const currentOption = props.options?.find((x) => x.key === (props.value ?? props.defaultValue))

    return (
        <Popover.Root
            open={open}
            onOpenChange={setOpen}
        >
            <Popover.Trigger asChild>
                <Button
                    role="combobox"
                    aria-controls={popoverContentId}
                    aria-expanded={open}
                    onClick={() => {
                        if (props.isDisabled) return
                        setOpen(!open)
                    }}
                    data-open={open}
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
                    autoFocus={props.autoFocus}
                    isDisabled={props.isDisabled}
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
            {open === false ? null : (
                <Popover.Content
                    align="start"
                    className={{
                        padding: "0.5rem",
                    }}
                >
                    <InputText
                        value={rawQuery}
                        onChange={(value) => setRawQuery(value)}
                        autoFocus={true}
                    />
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
                        {props.isLoading === true ? <CircularLoader /> : null}
                        {currentOptions.length > 0 ? null : (
                            <FormatNull
                                text="Pas de résultat"
                                className={{
                                    padding: "0.5rem",
                                }}
                            />
                        )}
                        <Virtualizer data={currentOptions}>
                            {(option) => {
                                const isSelected = currentOption?.key === option.key
                                return (
                                    <Button
                                        key={option.key}
                                        className={{
                                            width: "100%",
                                        }}
                                        onClick={() => {
                                            if (props.isDisabled) return
                                            if (props.allowEmpty === true && option.key === props.value) {
                                                props.onChange(undefined)
                                                setOpen(false)
                                                return
                                            }
                                            props.onChange(option.key)
                                            setOpen(false)
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
                            }}
                        </Virtualizer>
                    </div>
                </Popover.Content>
            )}
        </Popover.Root>
    )
}
