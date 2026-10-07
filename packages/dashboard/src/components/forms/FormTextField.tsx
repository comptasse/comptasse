import { InputText, InputTextArea } from "@comptasse/ui"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { FormControl } from "./FormControl.js"
import { FormError } from "./FormError.js"
import { FormField } from "./FormField.js"
import { FormItem } from "./FormItem.js"
import { FormLabel } from "./FormLabel.js"

/** Text (or textarea) field wired to a react-hook-form controller. */
export function FormTextField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(props: {
    control: Control<TFieldValues>
    name: TName
    label: string
    isRequired?: boolean
    autoFocus?: boolean
    multiline?: boolean
}) {
    return (
        <FormField
            control={props.control}
            name={props.name}
            render={({ field }) => {
                const value = typeof field.value === "string" ? field.value : ""
                return (
                    <FormItem>
                        <FormLabel
                            label={props.label}
                            isRequired={props.isRequired ?? false}
                        />
                        <FormControl>
                            {props.multiline ? (
                                <InputTextArea
                                    value={value}
                                    onChange={field.onChange}
                                />
                            ) : (
                                <InputText
                                    value={value}
                                    onChange={field.onChange}
                                    autoFocus={props.autoFocus}
                                />
                            )}
                        </FormControl>
                        <FormError />
                    </FormItem>
                )
            }}
        />
    )
}
