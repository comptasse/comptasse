import {
    readOneOrganizationRouteDefinition,
    updateOrganizationStorageCredentialsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, formatFileSize, InputPassword, InputText, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconDeviceFloppy } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import type * as v from "valibot"
import { Block } from "../../../../components/layouts/block/block.tsx"
import { DataWrapper } from "../../../../components/layouts/DataWrapper.tsx"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"

export function OrganizationStorageCredentialsPage({
    idOrganization: idOrganizationProp,
}: {
    idOrganization?: string
} = {}) {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization?: string
    }
    const idOrganization = idOrganizationProp ?? params.idOrganization ?? ""

    return (
        <DataWrapper
            routeDefinition={readOneOrganizationRouteDefinition}
            body={{
                idOrganization,
            }}
        >
            {(organization) => {
                const org = organization as v.InferOutput<typeof returnedSchemas.organization>
                return (
                    <>
                        <Block.Root>
                            <Block.Header title="Stockage" />
                            <Block.Row
                                title="Espace utilisé"
                                description={formatFileSize(org.storageCurrentUsage)}
                            />
                        </Block.Root>
                        <StorageCredentialsBlock
                            idOrganization={idOrganization}
                            org={org}
                        />
                    </>
                )
            }}
        </DataWrapper>
    )
}

interface FieldDef {
    key: string
    label: string
    isPassword?: boolean
}

const FIELDS: FieldDef[] = [
    {
        key: "storageEndpoint",
        label: "Endpoint",
    },
    {
        key: "storageAccessKey",
        label: "Clé d'accès",
    },
    {
        key: "storageSecretKey",
        label: "Clé secrète",
        isPassword: true,
    },
    {
        key: "storageBucketName",
        label: "Bucket",
    },
    {
        key: "storageRegion",
        label: "Région",
    },
]

function StorageCredentialsBlock({ idOrganization, org }: { idOrganization: string; org: Record<string, unknown> }) {
    const initialSnap = FIELDS.map((f) => `${f.key}:${(org[f.key] as string | null | undefined) ?? ""}`).join("|")
    const [values, setValues] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {}
        for (const f of FIELDS) init[f.key] = (org[f.key] as string | null | undefined) ?? ""
        return init
    })
    const [isSaving, setIsSaving] = useState(false)
    const snap = FIELDS.map((f) => `${f.key}:${values[f.key] ?? ""}`).join("|")
    const hasChanges = snap !== initialSnap

    const handleSave = useCallback(async () => {
        setIsSaving(true)
        try {
            const body: Record<string, string | null | undefined> = {
                ...values,
            }
            for (const f of FIELDS) if (body[f.key] === "") body[f.key] = undefined
            const response = await getResponseBodyFromAPI({
                routeDefinition: updateOrganizationStorageCredentialsRouteDefinition,
                body,
            })
            if (response.ok === false) {
                toast({
                    title: response.error?.cause ?? "Impossible d'enregistrer",
                    variant: "error",
                })
            } else {
                await invalidateData({
                    routeDefinition: readOneOrganizationRouteDefinition,
                    body: {
                        idOrganization,
                    },
                })
                toast({
                    title: "Identifiants de stockage mis à jour",
                    variant: "success",
                })
            }
        } finally {
            setIsSaving(false)
        }
    }, [
        values,
        idOrganization,
    ])

    return (
        <Block.Root>
            <Block.Header title="Identifiants de stockage (S3)" />
            <div
                className={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    padding: "1.5rem",
                })}
            >
                {FIELDS.map((f) => (
                    <div
                        key={f.key}
                        className={css({
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                        })}
                    >
                        <span
                            className={css({
                                fontSize: "sm",
                                fontWeight: "medium",
                                color: "fg.muted",
                            })}
                        >
                            {f.label}
                        </span>
                        {f.isPassword ? (
                            <InputPassword
                                value={values[f.key] ?? ""}
                                onChange={(v) =>
                                    setValues((p) => ({
                                        ...p,
                                        [f.key]: v ?? "",
                                    }))
                                }
                            />
                        ) : (
                            <InputText
                                value={values[f.key] ?? ""}
                                onChange={(v) =>
                                    setValues((p) => ({
                                        ...p,
                                        [f.key]: v ?? "",
                                    }))
                                }
                            />
                        )}
                    </div>
                ))}
                <div
                    className={css({
                        display: "flex",
                        justifyContent: "flex-start",
                        paddingTop: "0.5rem",
                    })}
                >
                    <Button
                        onClick={handleSave}
                        isDisabled={!hasChanges || isSaving}
                    >
                        <ButtonOutlineContent
                            leftIcon={isSaving ? undefined : <IconDeviceFloppy />}
                            text={isSaving ? "Enregistrement..." : "Enregistrer"}
                        />
                    </Button>
                </div>
            </div>
        </Block.Root>
    )
}
