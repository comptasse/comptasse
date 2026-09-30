import {
    deleteOneInventoryItemRouteDefinition,
    readAllInventoryItemsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonGhostContent, ButtonPlainContent, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconAlertCircle, IconEye, IconPlus, IconTrash } from "@tabler/icons-react"
import { useNavigate, useParams } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import type * as v from "valibot"
import { DataWrapper } from "../../../../components/layouts/DataWrapper.tsx"
import { DataTable } from "../../../../components/layouts/dataTable/DataTable.tsx"
import { Page } from "../../../../components/layouts/page/page.tsx"
import { CreateInventoryItemForm } from "../../../../components/panels/CreateInventoryItemForm.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"

type InventoryItemRow = v.InferOutput<typeof returnedSchemas.inventoryItem> & {
    isLowStock: boolean
}

export function InventoryPage() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
    }
    const navigate = useNavigate()
    const { openPanel } = useRightPanel()

    const columns = useMemo<Array<ColumnDef<InventoryItemRow>>>(
        () => [
            {
                header: "Article",
                accessorKey: "name",
                cell: ({ row }) => (
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                        })}
                    >
                        <span
                            className={css({
                                fontWeight: "semibold",
                            })}
                        >
                            {row.original.name}
                        </span>
                        {row.original.description && (
                            <span
                                className={css({
                                    fontSize: "xs",
                                    color: "neutral/50",
                                })}
                            >
                                {row.original.description}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                header: "SKU",
                accessorKey: "sku",
                cell: ({ row }) => <span>{row.original.sku ?? "—"}</span>,
            },
            {
                header: "Catégorie",
                accessorKey: "category",
                cell: ({ row }) => <span>{row.original.category ?? "—"}</span>,
            },
            {
                header: "Quantité",
                accessorKey: "currentQuantity",
                cell: ({ row }) => (
                    <div
                        className={css({
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        })}
                    >
                        <span>{row.original.currentQuantity}</span>
                        {row.original.isLowStock && (
                            <IconAlertCircle
                                size={16}
                                className={css({
                                    color: "warning",
                                })}
                            />
                        )}
                    </div>
                ),
            },
            {
                header: "Unité",
                accessorKey: "unit",
            },
            {
                header: "Prix unitaire",
                accessorKey: "unitPrice",
                cell: ({ row }) => <span>{row.original.unitPrice ? `${row.original.unitPrice} €` : "—"}</span>,
            },
            {
                header: "Seuil",
                accessorKey: "minimumThreshold",
                cell: ({ row }) => <span>{row.original.minimumThreshold ?? "—"}</span>,
            },
            {
                header: "Emplacement",
                accessorKey: "location",
                cell: ({ row }) => <span>{row.original.location ?? "—"}</span>,
            },
            {
                header: "Actions",
                id: "actions",
                meta: {
                    fit: true,
                },
                cell: ({ row }) => (
                    <div
                        className={css({
                            display: "flex",
                            gap: "0.25rem",
                        })}
                    >
                        <Button
                            className={{
                                padding: "0.25rem",
                                border: "none",
                                backgroundColor: "transparent",
                            }}
                            onClick={() =>
                                navigate({
                                    to: "/organisation/$idOrganization/exercice/$idYear/inventaire/$idInventoryItem",
                                    params: {
                                        idOrganization: params.idOrganization,
                                        idYear: params.idYear,
                                        idInventoryItem: row.original.id,
                                    },
                                })
                            }
                            title="Voir"
                        >
                            <ButtonGhostContent leftIcon={<IconEye />} />
                        </Button>
                        <Button
                            className={{
                                padding: "0.25rem",
                                border: "none",
                                backgroundColor: "transparent",
                            }}
                            onClick={async () => {
                                if (!confirm("Supprimer cet article ?")) return
                                const response = await getResponseBodyFromAPI({
                                    routeDefinition: deleteOneInventoryItemRouteDefinition,
                                    body: {
                                        idInventoryItem: row.original.id,
                                        idYear: params.idYear,
                                    },
                                })
                                if (response.ok === false) {
                                    toast({
                                        title: "Impossible de supprimer l'article",
                                        variant: "error",
                                    })
                                    return
                                }
                                toast({
                                    title: "Article supprimé",
                                    variant: "success",
                                })
                                await invalidateData({
                                    routeDefinition: readAllInventoryItemsRouteDefinition,
                                    body: {
                                        idYear: params.idYear,
                                    },
                                })
                            }}
                            title="Supprimer"
                        >
                            <ButtonGhostContent leftIcon={<IconTrash />} />
                        </Button>
                    </div>
                ),
            },
        ],
        [
            navigate,
            params.idOrganization,
            params.idYear,
        ],
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
                        const sorted = items
                            .map((item) => {
                                const quantity = Number(item.currentQuantity)
                                const threshold = item.minimumThreshold ? Number(item.minimumThreshold) : null
                                return {
                                    ...item,
                                    isLowStock: threshold !== null && quantity <= threshold,
                                }
                            })
                            .sort((a, b) => a.name.localeCompare(b.name))

                        return (
                            <DataTable
                                data={sorted}
                                columns={columns}
                                pageSize={50}
                                persistKey="inventory"
                            >
                                <Button
                                    onClick={() =>
                                        openPanel(
                                            <CreateInventoryItemForm
                                                idOrganization={params.idOrganization}
                                                idYear={params.idYear}
                                            />,
                                            "Ajouter un article",
                                        )
                                    }
                                >
                                    <ButtonPlainContent
                                        leftIcon={<IconPlus />}
                                        text="Ajouter un article"
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
