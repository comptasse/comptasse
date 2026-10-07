import { InputCheckbox } from "@comptasse/ui"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { FormError } from "./FormError.js"
import { FormField } from "./FormField.js"
import { FormItem } from "./FormItem.js"
import { FormLabel } from "./FormLabel.js"

/** Multi-checkbox field (string[] value) wired to a react-hook-form controller. */
export function FormCheckboxListField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(props: {
    control: Control<TFieldValues>
    name: TName
    label: string
    isRequired?: boolean
    options: Array<{
        key: string
        label: string
    }>
}) {
    return (
        <FormField
            control={props.control}
            name={props.name}
            render={({ field }) => {
                const selected = (Array.isArray(field.value) ? field.value : []) as Array<string>
                const selectedSet = new Set(selected)
                return (
                    <FormItem>
                        <FormLabel
                            label={props.label}
                            isRequired={props.isRequired ?? false}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.375rem",
                            }}
                        >
                            {props.options.map((option) => (
                                <div
                                    key={option.key}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    }}
                                >
                                    <InputCheckbox
                                        checked={selectedSet.has(option.key)}
                                        onChange={(checked) =>
                                            field.onChange(
                                                checked
                                                    ? [
                                                          ...selected,
                                                          option.key,
                                                      ]
                                                    : selected.filter((id) => id !== option.key),
                                            )
                                        }
                                    />
                                    {option.label}
                                </div>
                            ))}
                        </div>
                        <FormError />
                    </FormItem>
                )
            }}
        />
    )
}
