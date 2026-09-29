import { readOneYearRouteDefinition } from "@comptasse/application-metadata/routes"
import { ButtonOutlineContent } from "@comptasse/ui"
import {
    IconArrowBarToRight,
    IconLock,
    IconLockOpen,
    IconPencil,
    IconReportMoney,
    IconScale,
    IconTrash,
} from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { Block } from "../../../../components/layouts/block/block.tsx"
import { DataWrapper } from "../../../../components/layouts/DataWrapper.tsx"
import { CloseYear } from "./CloseYear.tsx"
import { DeleteOneYear } from "./DeleteOneYear.tsx"
import { OpenYear } from "./OpenYear.tsx"
import { SettleBalanceSheet } from "./SettleBalanceSheet.tsx"
import { SettleIncomeStatement } from "./SettleIncomeStatement.tsx"
import { UpdateOneYear } from "./UpdateOneYear.tsx"

export function YearSettingsPage({
    idOrganization: idOrganizationProp,
    idYear: idYearProp,
}: {
    idOrganization?: string
    idYear?: string
} = {}) {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization?: string
        idYear?: string
    }
    const idOrganization = idOrganizationProp ?? params.idOrganization ?? ""
    const idYear = idYearProp ?? params.idYear ?? ""
    void idOrganization

    return (
        <DataWrapper
            routeDefinition={readOneYearRouteDefinition}
            body={{
                idYear: idYear,
            }}
            params={{
                idOrganization,
            }}
        >
            {(year) => {
                return (
                    <>
                        <Block.Root>
                            <Block.Header title="Informations générales" />
                            <Block.Row
                                title="Modifier l'exercice"
                                description="Mettez à jour les informations principales."
                            >
                                <UpdateOneYear year={year}>
                                    <ButtonOutlineContent
                                        leftIcon={<IconPencil />}
                                        text="Modifier"
                                    />
                                </UpdateOneYear>
                            </Block.Row>
                        </Block.Root>
                        <Block.Root>
                            <Block.Header
                                title="Clôture de l'exercice"
                                description="Ces opérations n'affectent ni le bilan ni le compte de résultat, à l'exception du résultat porté aux comptes 120/129. Elles sont idempotentes : les relancer remplace l'écriture générée."
                            />
                            <Block.Row
                                title="Solder les comptes de gestion"
                                description="Génère l'écriture de clôture des comptes de gestion et constate le résultat (120/129). À effectuer avant de solder le bilan."
                            >
                                <SettleIncomeStatement year={year}>
                                    <ButtonOutlineContent
                                        leftIcon={<IconReportMoney />}
                                        text="Solder"
                                    />
                                </SettleIncomeStatement>
                            </Block.Row>
                            <Block.Row
                                title="Solder les comptes de bilan"
                                description="Génère l'écriture de clôture des comptes de bilan."
                            >
                                <SettleBalanceSheet year={year}>
                                    <ButtonOutlineContent
                                        leftIcon={<IconScale />}
                                        text="Solder"
                                    />
                                </SettleBalanceSheet>
                            </Block.Row>
                            {year.idYearPrevious !== null ? (
                                <Block.Row
                                    title="Générer les à-nouveaux"
                                    description="Reporte les soldes de bilan de l'exercice précédent dans cet exercice."
                                >
                                    <OpenYear year={year}>
                                        <ButtonOutlineContent
                                            leftIcon={<IconArrowBarToRight />}
                                            text="Générer"
                                        />
                                    </OpenYear>
                                </Block.Row>
                            ) : null}
                            <Block.Row
                                title={year.isClosed ? "Rouvrir l'exercice" : "Clôturer l'exercice"}
                                description={
                                    year.isClosed
                                        ? "L'exercice sera de nouveau modifiable."
                                        : "Les écritures de l'exercice ne seront plus modifiables."
                                }
                            >
                                <CloseYear year={year}>
                                    <ButtonOutlineContent
                                        leftIcon={year.isClosed ? <IconLockOpen /> : <IconLock />}
                                        text={year.isClosed ? "Rouvrir" : "Clôturer"}
                                    />
                                </CloseYear>
                            </Block.Row>
                        </Block.Root>
                        <Block.Root variant="danger">
                            <Block.Header
                                title="Zone de danger"
                                variant="danger"
                            />
                            <Block.Row
                                title="Supprimer l'exercice"
                                description="Cette action est irréversible."
                                variant="danger"
                            >
                                <DeleteOneYear year={year}>
                                    <ButtonOutlineContent
                                        leftIcon={<IconTrash />}
                                        text="Supprimer"
                                        color="danger"
                                    />
                                </DeleteOneYear>
                            </Block.Row>
                        </Block.Root>
                    </>
                )
            }}
        </DataWrapper>
    )
}
