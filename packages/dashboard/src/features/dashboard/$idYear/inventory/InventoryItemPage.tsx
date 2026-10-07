import {
    readAllInventoryItemsRouteDefinition,
    readOneInventoryItemRouteDefinition,
    updateOneInventoryItemRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonGhostContent, ButtonPlainContent, InputText, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconArrowLeft, IconPackage, IconPencil } from "@tabler/icons-react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { Fragment } from "react/jsx-runtime"
import type { UseFormReturn } from "react-hook-form"
import type * as v from "valibot"
import { FormControl } from "../../../../components/forms/FormControl.tsx"
import { FormError } from "../../../../components/forms/FormError.tsx"
import { FormField } from "../../../../components/forms/FormField.tsx"
import { FormItem } from "../../../../components/forms/FormItem.tsx"
import { FormLabel } from "../../../../components/forms/FormLabel.tsx"
import { FormRoot } from "../../../../components/forms/FormRoot.tsx"
import { DataWrapper } from "../../../../components/layouts/DataWrapper.tsx"
import { Page } from "../../../../components/layouts/page/page.tsx"
import { Section } from "../../../../components/layouts/section/section.tsx"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"

function InventoryItemFormFields({ form }: { form: UseFormReturn<any> }) {
    return (
        <Fragment>
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel
                            label="Nom"
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
                                label="Quantité"
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
    )
}

function InventoryItemDetails({
    item,
    onEdit,
}: {
    item: v.InferOutput<typeof returnedSchemas.inventoryItem>
    onEdit: () => void
}) {
    return (
        <Section.Root>
            <Section.Item>
                <div
                    className={css({
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    })}
                >
                    <h2
                        className={css({
                            fontSize: "xl",
                            fontWeight: "semibold",
                        })}
                    >
                        {item.name}
                    </h2>
                    <div
                        className={css({
                            fontSize: "sm",
                            color: "neutral/50",
                        })}
                    >
                        SKU: {item.sku ?? "—"} &middot; Catégorie: {item.category ?? "—"}
                    </div>
                    <div
                        className={css({
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                            marginTop: "0.5rem",
                        })}
                    >
                        <div>
                            <span
                                className={css({
                                    fontSize: "sm",
                                    color: "neutral/60",
                                })}
                            >
                                Quantité
                            </span>
                            <p
                                className={css({
                                    fontWeight: "semibold",
                                })}
                            >
                                {item.currentQuantity} {item.unit}
                            </p>
                        </div>
                        <div>
                            <span
                                className={css({
                                    fontSize: "sm",
                                    color: "neutral/60",
                                })}
                            >
                                Prix unitaire
                            </span>
                            <p
                                className={css({
                                    fontWeight: "semibold",
                                })}
                            >
                                {item.unitPrice ? `${item.unitPrice} €` : "—"}
                            </p>
                        </div>
                        <div>
                            <span
                                className={css({
                                    fontSize: "sm",
                                    color: "neutral/60",
                                })}
                            >
                                Seuil minimum
                            </span>
                            <p
                                className={css({
                                    fontWeight: "semibold",
                                })}
                            >
                                {item.minimumThreshold ?? "—"}
                            </p>
                        </div>
                        <div>
                            <span
                                className={css({
                                    fontSize: "sm",
                                    color: "neutral/60",
                                })}
                            >
                                Emplacement
                            </span>
                            <p
                                className={css({
                                    fontWeight: "semibold",
                                })}
                            >
                                {item.location ?? "—"}
                            </p>
                        </div>
                    </div>
                    {item.description && (
                        <div>
                            <span
                                className={css({
                                    fontSize: "sm",
                                    color: "neutral/60",
                                })}
                            >
                                Description
                            </span>
                            <p>{item.description}</p>
                        </div>
                    )}
                    <Button onClick={onEdit}>
                        <ButtonPlainContent
                            leftIcon={<IconPencil />}
                            text="Modifier"
                        />
                    </Button>
                </div>
            </Section.Item>
        </Section.Root>
    )
}

export function InventoryItemPage() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
        idInventoryItem: string
    }
    const navigate = useNavigate()
    const { openPanel } = useRightPanel()

    return (
        <Page.Root>
            <Page.Content>
                <Button
                    onClick={() =>
                        navigate({
                            to: "/organisation/$idOrganization/exercice/$idYear/inventaire",
                            params: {
                                idOrganization: params.idOrganization,
                                idYear: params.idYear,
                            },
                        })
                    }
                >
                    <ButtonGhostContent
                        leftIcon={<IconArrowLeft />}
                        text="Retour à l'inventaire"
                    />
                </Button>

                <DataWrapper
                    routeDefinition={readOneInventoryItemRouteDefinition}
                    body={{
                        idInventoryItem: params.idInventoryItem,
                        idYear: params.idYear,
                    }}
                >
                    {(item) => {
                        const form = (
                            <FormRoot
                                schema={updateOneInventoryItemRouteDefinition.schemas.body}
                                defaultValues={{
                                    idInventoryItem: item.id,
                                    idYear: params.idYear,
                                    name: item.name,
                                    sku: item.sku ?? undefined,
                                    category: item.category ?? undefined,
                                    unit: item.unit,
                                    unitPrice: item.unitPrice ?? undefined,
                                    currentQuantity: item.currentQuantity,
                                    minimumThreshold: item.minimumThreshold ?? undefined,
                                    location: item.location ?? undefined,
                                    description: item.description ?? undefined,
                                }}
                                submitButtonProps={{
                                    leftIcon: <IconPackage />,
                                    text: "Enregistrer",
                                }}
                                onSubmit={async (data) => {
                                    const response = await getResponseBodyFromAPI({
                                        routeDefinition: updateOneInventoryItemRouteDefinition,
                                        body: data,
                                    })
                                    if (response.ok === false) {
                                        toast({
                                            title: "Impossible de modifier l'article",
                                            variant: "error",
                                        })
                                        return false
                                    }
                                    toast({
                                        title: "Article modifié",
                                        variant: "success",
                                    })
                                    return true
                                }}
                                onCancel={undefined}
                                onSuccess={async () => {
                                    await invalidateData({
                                        routeDefinition: readAllInventoryItemsRouteDefinition,
                                        body: {
                                            idYear: params.idYear,
                                        },
                                    })
                                    await invalidateData({
                                        routeDefinition: readOneInventoryItemRouteDefinition,
                                        body: {
                                            idInventoryItem: params.idInventoryItem,
                                            idYear: params.idYear,
                                        },
                                    })
                                }}
                            >
                                {(form) => <InventoryItemFormFields form={form} />}
                            </FormRoot>
                        )

                        return (
                            <InventoryItemDetails
                                item={item}
                                onEdit={() => openPanel(form, "Modifier l'article")}
                            />
                        )
                    }}
                </DataWrapper>
            </Page.Content>
        </Page.Root>
    )
}
