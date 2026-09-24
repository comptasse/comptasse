import {
    readAllEntryLinesRouteDefinition,
    updateManyEntryLinesRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, InputText, InputToggle, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPencil } from "@tabler/icons-react"
import { type JSX } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { FormControl } from "../../../../../components/forms/FormControl.tsx"
import { FormError } from "../../../../../components/forms/FormError.tsx"
import { FormField } from "../../../../../components/forms/FormField.tsx"
import { FormItem } from "../../../../../components/forms/FormItem.tsx"
import { FormLabel } from "../../../../../components/forms/FormLabel.tsx"
import { FormRoot } from "../../../../../components/forms/FormRoot.tsx"
import { useRightPanel } from "../../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../utilities/invalidateData.ts"

export function UpdateManyEntryLines(props: {
    entry: v.InferOutput<typeof returnedSchemas.entry>
    children: JSX.Element
}) {
    const { openPanel, closePanel } = useRightPanel()

    const form = (
        <FormRoot
            schema={updateManyEntryLinesRouteDefinition.schemas.body}
            defaultValues={{
                idYear: props.entry.idYear,
                idEntry: props.entry.id,
            }}
            submitButtonProps={{
                leftIcon: <IconPencil />,
                text: "Modifier les mouvements",
            }}
            onSubmit={async (data) => {
                const updateManyEntryLinesResponse = await getResponseBodyFromAPI({
                    routeDefinition: updateManyEntryLinesRouteDefinition,
                    body: data,
                })
                if (updateManyEntryLinesResponse.ok === false) {
                    toast({
                        title: "Impossible de modifier les mouvements",
                        variant: "error",
                    })
                    return false
                }

                toast({
                    title: "Mouvements modifiés avec succès",
                    variant: "success",
                })
                return true
            }}
            onCancel={() => closePanel()}
            onSuccess={async () => {
                await Promise.all([
                    invalidateData({
                        routeDefinition: readAllEntryLinesRouteDefinition,
                        body: {
                            idYear: props.entry.idYear,
                        },
                    }),
                ])

                closePanel()
            }}
        >
            {(form) => (
                <Fragment>
                    <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Libellé"
                                    isRequired={false}
                                />
                                <FormControl>
                                    <InputText
                                        value={field.value}
                                        onChange={field.onChange}
                                        autoFocus={true}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <div
                        className={css({
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            gap: "0.5rem",
                        })}
                    >
                        <FormLabel
                            label="Mouvement ajouté aux calculs ?"
                            isRequired={false}
                        />
                        <div
                            className={css({
                                width: "100%",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                            })}
                        >
                            <FormField
                                control={form.control}
                                name="isComputedForJournalReport"
                                render={({ field }) => (
                                    <FormItem
                                        className={{
                                            width: "fit-content",
                                        }}
                                    >
                                        <FormLabel
                                            label="Journal"
                                            isRequired={true}
                                        />
                                        <FormControl>
                                            <InputToggle
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={[
                                                    {
                                                        value: true,
                                                        label: "Oui",
                                                    },
                                                    {
                                                        value: false,
                                                        label: "Non",
                                                    },
                                                ]}
                                            />
                                        </FormControl>
                                        <FormError />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isComputedForLedgerReport"
                                render={({ field }) => (
                                    <FormItem
                                        className={{
                                            width: "fit-content",
                                        }}
                                    >
                                        <FormLabel
                                            label="Grand-livre"
                                            isRequired={true}
                                        />
                                        <FormControl>
                                            <InputToggle
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={[
                                                    {
                                                        value: true,
                                                        label: "Oui",
                                                    },
                                                    {
                                                        value: false,
                                                        label: "Non",
                                                    },
                                                ]}
                                            />
                                        </FormControl>
                                        <FormError />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isComputedForBalanceReport"
                                render={({ field }) => (
                                    <FormItem
                                        className={{
                                            width: "fit-content",
                                        }}
                                    >
                                        <FormLabel
                                            label="Balance"
                                            isRequired={true}
                                        />
                                        <FormControl>
                                            <InputToggle
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={[
                                                    {
                                                        value: true,
                                                        label: "Oui",
                                                    },
                                                    {
                                                        value: false,
                                                        label: "Non",
                                                    },
                                                ]}
                                            />
                                        </FormControl>
                                        <FormError />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isComputedForBalanceSheetReport"
                                render={({ field }) => (
                                    <FormItem
                                        className={{
                                            width: "fit-content",
                                        }}
                                    >
                                        <FormLabel
                                            label="Bilan"
                                            isRequired={true}
                                        />
                                        <FormControl>
                                            <InputToggle
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={[
                                                    {
                                                        value: true,
                                                        label: "Oui",
                                                    },
                                                    {
                                                        value: false,
                                                        label: "Non",
                                                    },
                                                ]}
                                            />
                                        </FormControl>
                                        <FormError />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isComputedForIncomeStatementReport"
                                render={({ field }) => (
                                    <FormItem
                                        className={{
                                            width: "fit-content",
                                        }}
                                    >
                                        <FormLabel
                                            label="Compte de résultat"
                                            isRequired={true}
                                        />
                                        <FormControl>
                                            <InputToggle
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={[
                                                    {
                                                        value: true,
                                                        label: "Oui",
                                                    },
                                                    {
                                                        value: false,
                                                        label: "Non",
                                                    },
                                                ]}
                                            />
                                        </FormControl>
                                        <FormError />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </Fragment>
            )}
        </FormRoot>
    )

    return (
        <Button
            className={{
                padding: "0",
                border: "none",
                backgroundColor: "transparent",
                width: "fit-content",
                height: "fit-content",
            }}
            onClick={() => openPanel(form, "Modifier les mouvements")}
        >
            {props.children}
        </Button>
    )
}
