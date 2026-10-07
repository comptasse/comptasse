import {
    createOneInventoryItemRouteDefinition,
    readAllInventoryItemsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import { InputText, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPackage } from "@tabler/icons-react"
import { Fragment } from "react/jsx-runtime"
import { useRightPanel } from "../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../utilities/invalidateData.js"
import { FormControl } from "../forms/FormControl.js"
import { FormError } from "../forms/FormError.js"
import { FormField } from "../forms/FormField.js"
import { FormItem } from "../forms/FormItem.js"
import { FormLabel } from "../forms/FormLabel.js"
import { FormRoot } from "../forms/FormRoot.js"

export function CreateInventoryItemForm(props: { idOrganization: string; idYear: string; presetCategory?: string }) {
    const { closePanel } = useRightPanel()

    return (
        <FormRoot
            schema={createOneInventoryItemRouteDefinition.schemas.body}
            defaultValues={{
                idYear: props.idYear,
                currentQuantity: "0",
                category: props.presetCategory ?? undefined,
            }}
            submitButtonProps={{
                leftIcon: <IconPackage />,
                text: "Ajouter l'article",
            }}
            onSubmit={async (data) => {
                const response = await getResponseBodyFromAPI({
                    routeDefinition: createOneInventoryItemRouteDefinition,
                    body: data,
                })
                if (response.ok === false) {
                    toast({
                        title: "Impossible d'ajouter l'article",
                        variant: "error",
                    })
                    return false
                }
                toast({
                    title: "Article ajouté avec succès",
                    variant: "success",
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                await invalidateData({
                    routeDefinition: readAllInventoryItemsRouteDefinition,
                    body: {
                        idYear: props.idYear,
                    },
                })
                closePanel()
            }}
        >
            {(form) => (
                <Fragment>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Nom"
                                    tooltip="Le nom de l'article."
                                    isRequired={true}
                                />
                                <FormControl>
                                    <InputText
                                        value={field.value}
                                        onChange={field.onChange}
                                        autoFocus
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Référence (SKU)"
                                    tooltip="La référence unique de l'article."
                                    isRequired={false}
                                />
                                <FormControl>
                                    <InputText
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Catégorie"
                                    tooltip="La catégorie de l'article."
                                    isRequired={false}
                                />
                                <FormControl>
                                    <InputText
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <div
                        className={css({
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                        })}
                    >
                        <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel
                                        label="Unité"
                                        tooltip="L'unité de mesure (pièce, kg, litre...)."
                                        isRequired={true}
                                    />
                                    <FormControl>
                                        <InputText
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormError />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="currentQuantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel
                                        label="Quantité initiale"
                                        tooltip="La quantité actuelle en stock."
                                        isRequired={false}
                                    />
                                    <FormControl>
                                        <InputText
                                            value={field.value ?? "0"}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormError />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div
                        className={css({
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                        })}
                    >
                        <FormField
                            control={form.control}
                            name="unitPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel
                                        label="Prix unitaire"
                                        tooltip="Le prix unitaire de l'article."
                                        isRequired={false}
                                    />
                                    <FormControl>
                                        <InputText
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormError />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="minimumThreshold"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel
                                        label="Seuil minimum"
                                        tooltip="Le seuil en dessous duquel le stock est considéré comme faible."
                                        isRequired={false}
                                    />
                                    <FormControl>
                                        <InputText
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormError />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Emplacement"
                                    tooltip="L'emplacement physique de l'article dans l'entrepôt."
                                    isRequired={false}
                                />
                                <FormControl>
                                    <InputText
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Description"
                                    tooltip="Une description optionnelle de l'article."
                                    isRequired={false}
                                />
                                <FormControl>
                                    <InputText
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                </Fragment>
            )}
        </FormRoot>
    )
}
