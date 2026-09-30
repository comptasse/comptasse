import { type InputHTMLAttributes, useRef, useState } from "react"
import type { FieldError } from "react-hook-form"
import { IMask, IMaskInput } from "react-imask"
import type { Styles } from "../../../styled-system/css/css"
import { css } from "../../utilities/cn.js"

function isoToDisplay(value: string | undefined | null) {
    if (!value) return ""
    if (String(new Date(value)) === "Invalid Date") return ""

    const date = new Date(value)
    let day = String(date.getDate())
    let month = String(date.getMonth() + 1)
    const year = String(date.getFullYear())

    if (date.getDate() < 10) day = `0${day}`
    if (date.getMonth() + 1 < 10) month = `0${month}`
    return [
        day,
        month,
        year,
    ].join(" / ")
}

function displayToIso(value: string | undefined) {
    if (!value) return undefined
    const parts = value.split(" / ")
    if (parts.length !== 3) return undefined
    const day = Number(parts[0])
    const month = Number(parts[1])
    const year = Number(parts[2])
    if (!day || !month || !year || year < 1930) return undefined
    return new Date(year, month - 1, day, 12, 0, 0).toISOString()
}

export function InputDate(
    props: Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "value" | "onChange" | "className"> & {
        error?: FieldError
        defaultValue?: string | undefined | null
        value?: string | undefined | null
        onChange: (value: string | undefined) => void
        className?: Styles
    },
) {
    const { className } = props
    const [displayValue, setDisplayValue] = useState(() => isoToDisplay(props.value))
    const [prevValue, setPrevValue] = useState(props.value)
    const isFocusedRef = useRef(false)
    // Last value we emitted to the parent, so an interrupted typing session can
    // be reverted on blur instead of leaving a half-written date.
    const lastEmittedRef = useRef<string | undefined>(props.value ?? undefined)

    // Only mirror external changes while the field is not being edited,
    // otherwise a round-trip through the parent would clobber the typing.
    if (props.value !== prevValue) {
        setPrevValue(props.value)
        if (!isFocusedRef.current) {
            const externalDisplay = isoToDisplay(props.value)
            if (externalDisplay !== displayValue) {
                setDisplayValue(externalDisplay)
            }
        }
    }

    return (
        <div
            className={css(
                {
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "stretch",
                    gap: "0.5rem",
                    border: "1px solid",
                    borderRadius: "md",
                    _hover: {
                        borderColor: "neutral/50",
                    },
                    _focusWithin: {
                        borderColor: "neutral/50",
                        boxShadow: "inset",
                    },
                },
                props.error
                    ? {
                          borderColor: "error",
                      }
                    : {
                          borderColor: "neutral/20",
                      },
                className,
            )}
        >
            <IMaskInput
                mask="d{ / }`m{ / }`Y"
                blocks={{
                    d: {
                        mask: IMask.MaskedRange,
                        from: 1,
                        to: 31,
                        maxLength: 2,
                        placeholderChar: "J",
                    },
                    m: {
                        mask: IMask.MaskedRange,
                        from: 1,
                        to: 12,
                        maxLength: 2,
                        placeholderChar: "M",
                    },
                    Y: {
                        mask: IMask.MaskedRange,
                        from: 1930,
                        to: 2100,
                        maxLength: 4,
                        placeholderChar: "Y",
                    },
                }}
                autofix={false}
                lazy={false}
                overwrite="shift"
                eager="append"
                unmask="typed"
                placeholder={"JJ / MM / YYYY"}
                onFocus={(event) => {
                    isFocusedRef.current = true
                    // Select everything so typing replaces a completed date.
                    event.target.select()
                }}
                onBlur={() => {
                    isFocusedRef.current = false
                    const iso = displayToIso(displayValue)
                    if (displayValue.trim() !== "" && iso === undefined) {
                        setDisplayValue(isoToDisplay(lastEmittedRef.current))
                    }
                }}
                onAccept={(value: unknown) => {
                    const display = String(value)
                    setDisplayValue(display)
                    if (display.trim() === "") {
                        lastEmittedRef.current = undefined
                        props.onChange(undefined)
                        return
                    }
                    const iso = displayToIso(display)
                    // Do not notify the parent for incomplete input: an
                    // `undefined` round-trip would wipe what is being typed.
                    if (iso !== undefined) {
                        lastEmittedRef.current = iso
                        props.onChange(iso)
                    }
                }}
                value={displayValue}
                className={css({
                    borderRadius: "inherit",
                    width: "100%",
                    fontSize: "0.875rem",
                    lineHeight: "1rem",
                    fontWeight: "400",
                    _placeholder: {
                        color: "neutral/25",
                    },
                    padding: "0.5rem",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    _focusWithin: {
                        borderColor: "neutral/50",
                        outline: "none",
                    },
                })}
                inputMode="decimal"
            />
        </div>
    )
}
