import { readAllInventoryItemsRouteDefinition } from "@comptasse/application-metadata/routes"
import { Button, ButtonPlainContent, InputText, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { Fragment } from "react/jsx-runtime"
import * as v from "valibot"
import { FormControl } from "../../../../components/forms/FormControl.js"
import { FormError } from "../../../../components/forms/FormError.js"
import { FormField } from "../../../../components/forms/FormField.js"
import { FormItem } from "../../../../components/forms/FormItem.js"
import { FormLabel } from "../../../../components/forms/FormLabel.js"
import { FormRoot } from "../../../../components/forms/FormRoot.js"
import { DataWrapper } from "../../../../components/layouts/DataWrapper.js"
import { DataTable } from "../../../../components/layouts/dataTable/DataTable.tsx"
import { Page } from "../../../../components/layouts/page/page.js"
import { CreateInventoryItemForm } from "../../../../components/panels/CreateInventoryItemForm.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"

export function InventoryCategoriesPage() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
    }
    const { openPanel, closePanel } = useRightPanel()

    function openCreateCategory() {
        const form = (
            <FormRoot
                schema={v.object({
                    category: v.pipe(v.string(), v.minLength(1, "Veuillez entrer un nom de catégorie")),
                })}
                defaultValues={{
                    category: "",
                }}
                submitButtonProps={{
                    leftIcon: <IconPlus />,
                    text: "Ajouter un article",
                }}
                onSubmit={async (data) => {
                    closePanel()
                    openPanel(
                        <CreateInventoryItemForm
                            idOrganization={params.idOrganization}
                            idYear={params.idYear}
                            presetCategory={data.category.trim()}
                        />,
                        `Ajouter un article (${data.category.trim()})`,
                    )
                    return true
                }}
                onCancel={undefined}
                onSuccess={async () => {}}
            >
                {(form) => (
                    <Fragment>
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel
                                        label="Nom de la catégorie"
                                        isRequired
                                    />
                                    <FormControl>
                                        <InputText
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                            autoFocus
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
        openPanel(form, "Nouvelle catégorie")
    }

    const columns = useMemo<
        Array<
            ColumnDef<{
                category: string
                count: number
            }>
        >
    >(
        () => [
            {
                header: "Catégorie",
                accessorKey: "category",
                cell: ({ row }) => (
                    <span
                        className={css({
                            fontWeight: "semibold",
                        })}
                    >
                        {row.original.category}
                    </span>
                ),
            },
            {
                header: "Nombre d'articles",
                accessorKey: "count",
            },
        ],
        [],
    )

    return (
        <Page.Root>
            <Page.Content>
                <DataWrapper
                    routeDefinition={readAllInventoryItemsRouteDefinition}
                    body={{
                        idYear: params.idYear,
                    }}
                >
                    {(items) => {
                        const categories = [
                            ...new Set(
                                items.flatMap((i: any) =>
                                    i.category
                                        ? [
                                              i.category,
                                          ]
                                        : [],
                                ) as string[],
                            ),
                        ]
                            .sort()
                            .map((cat) => ({
                                category: cat,
                                count: items.filter((i: any) => i.category === cat).length,
                            }))

                        return (
                            <DataTable
                                data={categories}
                                columns={columns}
                            >
                                <Button onClick={openCreateCategory}>
                                    <ButtonPlainContent
                                        leftIcon={<IconPlus />}
                                        text="Ajouter une catégorie"
                                    />
                                </Button>
                            </DataTable>
                        )
                    }}
                </DataWrapper>
            </Page.Content>
        </Page.Root>
    )
}
