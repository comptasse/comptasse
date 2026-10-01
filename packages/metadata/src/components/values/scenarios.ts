import * as v from "valibot"
import { numericSchema } from "../schemas/numericSchema.js"

/**
 * Single source of truth for accounting entry scenarios.
 *
 * Consumed by:
 * - the API (`POST /years/:idYear/scenarios/:scenario`) to generate entries
 * - the website documentation (`scénarios` pages) to render examples
 *
 * Account references use PCG numbers (stable across fiscal years); they are
 * resolved to the target year's chart at execution time.
 */

export type ScenarioReportFlags = {
    isComputedForJournalReport: boolean
    isComputedForLedgerReport: boolean
    isComputedForBalanceReport: boolean
    isComputedForBalanceSheetReport: boolean
    isComputedForIncomeStatementReport: boolean
}

export type ScenarioLine = {
    number: string
    label: string
    debit: string
    credit: string
    /**
     * Optional overrides applied to the report flags persisted with the entry
     * lines. Unspecified flags default to true (every report enabled).
     */
    reportFlags?: Partial<ScenarioReportFlags>
}

export type ScenarioEntryDraft = {
    label: string
    lines: ScenarioLine[]
}

/**
 * Algebraic balance (debit - credit) of a single account, consumed by
 * balance-driven scenarios (`mode: "balances"`).
 */
export type ScenarioAccountBalance = {
    /** PCG account number */
    number: string
    label: string
    balance: number
}

export type ScenarioMode = "params" | "balances"

export type ScenarioDocExample = {
    description: string
    params: Record<string, unknown>
    /** Sample account balances, used by balances-mode scenarios */
    balances?: ScenarioAccountBalance[]
}

export type ScenarioParamDescription = {
    name: string
    type: "string" | "number" | "boolean" | "choice"
    required: boolean
    choices?: string[]
    default?: string | number | boolean
}

export type ScenarioDefinition = {
    slug: string
    title: string
    description: string
    mode: ScenarioMode
    /**
     * Balances-mode only: where the account balances are read from.
     * - "year": income-statement accounts of the target year (clôture)
     * - "previousYear": balance-sheet accounts of the previous year (à-nouveaux)
     */
    balancesSource?: "year" | "previousYear"
    paramsSchema: v.ObjectSchema<Record<string, v.GenericSchema>, undefined>
    docExamples: ScenarioDocExample[]
    /** Params-mode only */
    buildEntries?: (params: Record<string, unknown>) => ScenarioEntryDraft[]
    /** Balances-mode only */
    buildEntriesFromBalances?: (
        balances: ScenarioAccountBalance[],
        params: Record<string, unknown>,
    ) => ScenarioEntryDraft[]
}

function money(value: number): string {
    return value.toFixed(2)
}

function vat(amountHT: number, rate: number): number {
    return Math.round(amountHT * rate) / 100
}

function line(number: string, label: string, debit = 0, credit = 0): ScenarioLine {
    return {
        number,
        label,
        debit: debit > 0 ? money(debit) : "0.00",
        credit: credit > 0 ? money(credit) : "0.00",
    }
}

const amountSchema = numericSchema
const optionalString = (fallback?: string) =>
    fallback === undefined ? v.optional(v.string()) : v.optional(v.string(), fallback)

/** Idempotency keys / slugs of the year-end scenarios, shared with the API endpoints. */
export const ouvertureScenarioSlug = "ouverture-exercice"
export const clotureScenarioSlug = "cloture-exercice"

function paymentModeSchema(): v.GenericSchema {
    return v.optional(
        v.picklist(
            [
                "credit",
                "bank",
                "cash",
            ],
            "Mode de règlement invalide",
        ),
        "credit",
    )
}

export function describeScenarioParams(
    schema: v.ObjectSchema<Record<string, v.GenericSchema>, undefined>,
): ScenarioParamDescription[] {
    return Object.entries(schema.entries).map(([name, entry]) => {
        let wrapped: v.GenericSchema = entry
        let isOptional = false
        if (wrapped.type === "optional") {
            isOptional = true
            wrapped = (wrapped as v.OptionalSchema<v.GenericSchema, undefined>).wrapped
        }
        const base: ScenarioParamDescription = {
            name,
            type: wrapped.type === "picklist" ? "choice" : (wrapped.type as ScenarioParamDescription["type"]),
            required: !isOptional,
        }
        if (wrapped.type === "picklist") {
            base.choices = (
                wrapped as v.PicklistSchema<
                    readonly [
                        string,
                        ...string[],
                    ],
                    undefined
                >
            ).options.map((option) => String(option))
        }
        if (isOptional) {
            const defaultValue = (entry as v.OptionalSchema<v.GenericSchema, undefined>).default
            if (defaultValue !== undefined) {
                base.default = defaultValue as unknown as string | number | boolean
            }
        }
        return base
    })
}

function defineScenario<const TSchema extends v.ObjectSchema<Record<string, v.GenericSchema>, undefined>>(definition: {
    slug: string
    title: string
    description: string
    paramsSchema: TSchema
    docExamples: ScenarioDocExample[]
    buildEntries: (params: v.InferOutput<TSchema>) => ScenarioEntryDraft[]
}): ScenarioDefinition {
    return {
        slug: definition.slug,
        title: definition.title,
        description: definition.description,
        mode: "params",
        paramsSchema: definition.paramsSchema,
        docExamples: definition.docExamples,
        buildEntries: definition.buildEntries as ScenarioDefinition["buildEntries"],
    }
}

function defineBalancesScenario<
    const TSchema extends v.ObjectSchema<Record<string, v.GenericSchema>, undefined>,
>(definition: {
    slug: string
    title: string
    description: string
    balancesSource: "year" | "previousYear"
    paramsSchema: TSchema
    docExamples: ScenarioDocExample[]
    buildEntriesFromBalances: (
        balances: ScenarioAccountBalance[],
        params: v.InferOutput<TSchema>,
    ) => ScenarioEntryDraft[]
}): ScenarioDefinition {
    return {
        slug: definition.slug,
        title: definition.title,
        description: definition.description,
        mode: "balances",
        balancesSource: definition.balancesSource,
        paramsSchema: definition.paramsSchema,
        docExamples: definition.docExamples,
        buildEntriesFromBalances: definition.buildEntriesFromBalances as ScenarioDefinition["buildEntriesFromBalances"],
    }
}

/**
 * Builds the entry drafts for one documented example, whatever the scenario
 * mode (params or balances).
 */
export function buildScenarioEntries(
    definition: ScenarioDefinition,
    example: ScenarioDocExample,
): ScenarioEntryDraft[] {
    // Apply the params schema so defaults (e.g. an account number) are present,
    // matching what a real execution receives.
    const parsedParams = (() => {
        const result = v.safeParse(definition.paramsSchema, example.params)
        return result.success ? (result.output as Record<string, unknown>) : example.params
    })()

    if (definition.mode === "balances") {
        if (definition.buildEntriesFromBalances === undefined) {
            throw new Error(`Scenario ${definition.slug} is missing buildEntriesFromBalances`)
        }
        return definition.buildEntriesFromBalances(example.balances ?? [], parsedParams)
    }
    if (definition.buildEntries === undefined) {
        throw new Error(`Scenario ${definition.slug} is missing buildEntries`)
    }
    return definition.buildEntries(parsedParams)
}

const vatRateSchema = v.optional(v.number("Le taux de TVA doit être un nombre"), 20)

export const scenarioCatalog: Record<string, ScenarioDefinition> = {
    "constitution-capital": defineScenario({
        slug: "constitution-capital",
        title: "Constitution du capital social",
        description:
            "À la création d'une société (SARL, SAS, SA…), les associés ou actionnaires souscrivent le capital social. Pour une SARL et une SAS, le capital peut être libéré en deux temps : au moins 20 % à la constitution pour une SARL (50 % pour une SAS), le solde dans les cinq ans. Les fonds sont déposés sur un compte bancaire bloqué jusqu'à l'immatriculation, puis virés sur le compte courant de la société.",
        paramsSchema: v.object({
            capitalAmount: amountSchema,
            liberatedAmount: optionalString(),
        }),
        docExamples: [
            {
                description:
                    "Étape 1 - Souscription : les associés s'engagent à apporter 10 000 € (capital intégralement libéré dès la constitution)",
                params: {
                    capitalAmount: "10000",
                    liberatedAmount: "10000",
                },
            },
        ],
        buildEntries: (params) => {
            const drafts: ScenarioEntryDraft[] = []
            const capital = Number(params.capitalAmount)
            const liberated = params.liberatedAmount === undefined ? capital : Number(params.liberatedAmount)
            drafts.push({
                label: "Constitution du capital - souscription",
                lines: [
                    line("4561", "Associés - Comptes d'apport en société", capital),
                    line("101", "Capital", 0, capital),
                ],
            })
            if (liberated > 0) {
                drafts.push({
                    label: "Constitution du capital - libération",
                    lines: [
                        line("512", "Banques", liberated),
                        line("4561", "Associés - Comptes d'apport en société", 0, liberated),
                    ],
                })
            }
            return drafts
        },
    }),
    "augmentation-capital": defineScenario({
        slug: "augmentation-capital",
        title: "Augmentation de capital",
        description:
            "Le capital social peut être augmenté soit par apport en numéraire (les actionnaires versent de l'argent frais), soit par incorporation de réserves (conversion de bénéfices mis en réserve en capital, sans flux de trésorerie). Dans le premier cas, une prime d'émission est souvent demandée pour compenser le droit d'entrée des nouveaux actionnaires. La décision relève d'une assemblée générale extraordinaire.",
        paramsSchema: v.object({
            mode: v.picklist(
                [
                    "cash",
                    "reserves",
                ],
                "Le mode doit être « cash » ou « reserves »",
            ),
            capitalAmount: amountSchema,
            premiumAmount: optionalString(),
        }),
        docExamples: [
            {
                description:
                    "Augmentation par apport en numéraire : 20 000 € de capital nouveau + 5 000 € de prime d'émission - les souscripteurs versent 25 000 € en banque",
                params: {
                    mode: "cash",
                    capitalAmount: "20000",
                    premiumAmount: "5000",
                },
            },
            {
                description:
                    "Augmentation par incorporation de réserves : 10 000 € de réserves légales transformées en capital (aucun flux de trésorerie)",
                params: {
                    mode: "reserves",
                    capitalAmount: "10000",
                },
            },
        ],
        buildEntries: (params) => {
            const capital = Number(params.capitalAmount)
            if (params.mode === "reserves") {
                return [
                    {
                        label: "Augmentation de capital par incorporation de réserves",
                        lines: [
                            line("1061", "Réserve légale", capital),
                            line("101", "Capital", 0, capital),
                        ],
                    },
                ]
            }
            const premium = params.premiumAmount === undefined ? 0 : Number(params.premiumAmount)
            return [
                {
                    label: "Augmentation de capital en numéraire",
                    lines: [
                        line("512", "Banques", capital + premium),
                        line("101", "Capital", 0, capital),
                        ...(premium > 0
                            ? [
                                  line("1041", "Primes d'émission", 0, premium),
                              ]
                            : []),
                    ],
                },
            ]
        },
    }),
    "achat-marchandises-fournisseur": defineScenario({
        slug: "achat-marchandises-fournisseur",
        title: "Achat de marchandises",
        description:
            "L'achat de marchandises destinées à la revente est enregistré dès la réception de la facture (et non à la livraison ou au paiement). La TVA déductible sur les biens est récupérable immédiatement. Le compte 401 Fournisseurs enregistre la dette jusqu'au règlement ; le compte 607 Achats de marchandises est soldé en fin d'exercice lors du calcul de la variation de stock.",
        paramsSchema: v.object({
            amountHT: amountSchema,
            vatRate: vatRateSchema,
            paymentMode: paymentModeSchema(),
        }),
        docExamples: [
            {
                description: "Facture d'achat de marchandises reçue : 1 000 € HT, TVA 20 % - règlement sous 30 jours",
                params: {
                    amountHT: "1000",
                    vatRate: 20,
                    paymentMode: "credit",
                },
            },
            {
                description:
                    "Achat de marchandises payé comptant par virement : 500 € HT, TVA 20 % (pas de dette fournisseur)",
                params: {
                    amountHT: "500",
                    vatRate: 20,
                    paymentMode: "bank",
                },
            },
        ],
        buildEntries: (params) => {
            const ht = Number(params.amountHT)
            const tva = vat(ht, params.vatRate as number)
            const third = params.paymentMode === "credit" ? "401" : "512"
            const thirdLabel = params.paymentMode === "credit" ? "Fournisseurs" : "Banques"
            return [
                {
                    label: "Achat de marchandises",
                    lines: [
                        line("607", "Achats de marchandises", ht),
                        line("44566", "TVA sur autres biens et services", tva),
                        line(third, thirdLabel, 0, ht + tva),
                    ],
                },
            ]
        },
    }),
    "reglement-fournisseur": defineScenario({
        slug: "reglement-fournisseur",
        title: "Règlement d'un fournisseur",
        description:
            "Le paiement d'une facture fournisseur solde le compte 401 (ou 404 pour les immobilisations). Si le règlement intervient avant l'échéance, le fournisseur peut accorder un escompte de règlement (compte 765 Escomptes obtenus), qui représente un produit financier pour l'acheteur et réduit son décaissement effectif.",
        paramsSchema: v.object({
            amount: amountSchema,
            discountRate: v.optional(v.number("Le taux d'escompte doit être un nombre"), 0),
        }),
        docExamples: [
            {
                description: "Règlement par virement bancaire de la facture fournisseur de 1 200 € à l'échéance",
                params: {
                    amount: "1200",
                    discountRate: 0,
                },
            },
            {
                description:
                    "Règlement anticipé avec escompte de 2 % obtenu : facture 1 200 €, escompte 24 €, virement de 1 176 €",
                params: {
                    amount: "1200",
                    discountRate: 2,
                },
            },
        ],
        buildEntries: (params) => {
            const amount = Number(params.amount)
            const discount = Math.round(amount * (params.discountRate as number)) / 100
            const net = amount - discount
            return [
                {
                    label: "Règlement fournisseur",
                    lines: [
                        line("401", "Fournisseurs", amount),
                        ...(discount > 0
                            ? [
                                  line("765", "Escomptes obtenus", 0, discount),
                              ]
                            : []),
                        line("512", "Banques", 0, net),
                    ],
                },
            ]
        },
    }),
    "vente-marchandises-client": defineScenario({
        slug: "vente-marchandises-client",
        title: "Vente de marchandises",
        description:
            "Le chiffre d'affaires est enregistré à la date de transfert de propriété des biens (généralement la livraison), indépendamment de la date d'encaissement. La TVA collectée constitue une dette envers l'État. La créance sur le client (compte 411) est soldée lors de l'encaissement.",
        paramsSchema: v.object({
            amountHT: amountSchema,
            vatRate: vatRateSchema,
            paymentMode: paymentModeSchema(),
        }),
        docExamples: [
            {
                description: "Facture de vente émise : 2 000 € HT, TVA 20 % - paiement attendu à 30 jours",
                params: {
                    amountHT: "2000",
                    vatRate: 20,
                    paymentMode: "credit",
                },
            },
            {
                description: "Vente de marchandises au comptant : 800 € HT, TVA 20 % - encaissement immédiat en banque",
                params: {
                    amountHT: "800",
                    vatRate: 20,
                    paymentMode: "bank",
                },
            },
        ],
        buildEntries: (params) => {
            const ht = Number(params.amountHT)
            const tva = vat(ht, params.vatRate as number)
            const debitAccount = params.paymentMode === "credit" ? "411" : "512"
            const debitLabel = params.paymentMode === "credit" ? "Clients" : "Banques"
            return [
                {
                    label: "Vente de marchandises",
                    lines: [
                        line(debitAccount, debitLabel, ht + tva),
                        line("707", "Ventes de marchandises", 0, ht),
                        line("44571", "TVA collectée", 0, tva),
                    ],
                },
            ]
        },
    }),
    "encaissement-client": defineScenario({
        slug: "encaissement-client",
        title: "Encaissement d'un client",
        description:
            "Le règlement d'une créance client solde le compte 411 et crédite le compte bancaire. Si le client règle avant l'échéance et que l'entreprise lui a accordé un escompte de règlement, la différence est portée au débit du compte 665 Escomptes accordés, qui constitue une charge financière.",
        paramsSchema: v.object({
            amount: amountSchema,
        }),
        docExamples: [
            {
                description: "Virement reçu du client en règlement intégral de sa facture de 2 400 €",
                params: {
                    amount: "2400",
                },
            },
        ],
        buildEntries: (params) => {
            const amount = Number(params.amount)
            return [
                {
                    label: "Encaissement client",
                    lines: [
                        line("512", "Banques", amount),
                        line("411", "Clients", 0, amount),
                    ],
                },
            ]
        },
    }),
    "vente-prestation-services": defineScenario({
        slug: "vente-prestation-services",
        title: "Vente d'une prestation de services",
        description:
            "Le produit d'une prestation de services est comptabilisé au compte 706 à la date d'achèvement ou, pour les prestations continues, de manière proratisée sur la durée. Si la facture est émise avant la réalisation complète, la partie non encore réalisée est inscrite en produit constaté d'avance (compte 487). La TVA sur services est déductible chez le client dès le paiement.",
        paramsSchema: v.object({
            amountHT: amountSchema,
            vatRate: vatRateSchema,
        }),
        docExamples: [
            {
                description: "Facture de prestation de conseil émise : 5 000 € HT, TVA 20 % - client à 30 jours",
                params: {
                    amountHT: "5000",
                    vatRate: 20,
                },
            },
        ],
        buildEntries: (params) => {
            const ht = Number(params.amountHT)
            const tva = vat(ht, params.vatRate as number)
            return [
                {
                    label: "Vente de prestation de services",
                    lines: [
                        line("411", "Clients", ht + tva),
                        line("706", "Prestations de services", 0, ht),
                        line("44571", "TVA collectée", 0, tva),
                    ],
                },
            ]
        },
    }),
    "achat-immobilisation-corporelle": defineScenario({
        slug: "achat-immobilisation-corporelle",
        title: "Acquisition d'une immobilisation corporelle",
        description:
            "Un bien est immobilisé (inscrit en classe 2) lorsqu'il est destiné à être utilisé durablement par l'entreprise (plus d'un exercice) et que son coût dépasse le seuil d'usage en vigueur (généralement 500 € HT). Le coût d'entrée comprend le prix d'achat, les droits de douane et les frais directement attribuables à l'acquisition. La TVA sur immobilisations (44562) est déductible dès la réception de la facture.",
        paramsSchema: v.object({
            assetAccount: optionalString("2183"),
            amountHT: amountSchema,
            vatRate: vatRateSchema,
            paymentMode: paymentModeSchema(),
        }),
        docExamples: [
            {
                description:
                    "Achat d'un ordinateur 800 € HT, TVA 20 % - facture du fournisseur d'immobilisations, règlement à 30 jours",
                params: {
                    assetAccount: "2183",
                    amountHT: "800",
                    vatRate: 20,
                    paymentMode: "credit",
                },
            },
            {
                description: "Achat d'une machine industrielle 15 000 € HT, TVA 20 % - payée comptant par virement",
                params: {
                    assetAccount: "2154",
                    amountHT: "15000",
                    vatRate: 20,
                    paymentMode: "bank",
                },
            },
        ],
        buildEntries: (params) => {
            const ht = Number(params.amountHT)
            const tva = vat(ht, params.vatRate as number)
            const asset = params.assetAccount as string
            const creditAccount = params.paymentMode === "credit" ? "404" : "512"
            const creditLabel = params.paymentMode === "credit" ? "Fournisseurs d'immobilisations" : "Banques"
            return [
                {
                    label: "Acquisition d'une immobilisation corporelle",
                    lines: [
                        line(asset, "Immobilisation corporelle", ht),
                        line("44562", "TVA sur immobilisations", tva),
                        line(creditAccount, creditLabel, 0, ht + tva),
                    ],
                },
            ]
        },
    }),
    "dotation-amortissement": defineScenario({
        slug: "dotation-amortissement",
        title: "Dotation aux amortissements",
        description:
            "L'amortissement répartit le coût d'une immobilisation sur sa durée d'utilisation (durée de vie économique). La méthode linéaire applique un taux constant chaque année ; la méthode dégressive fiscale applique un taux plus élevé les premières années (coefficient 1,25 à 2,25 selon la durée). Les dotations sont une charge non décaissable, enregistrée en fin d'exercice au débit du compte 6811.",
        paramsSchema: v.object({
            amount: amountSchema,
            expenseAccount: optionalString("6811"),
            depreciationAccount: optionalString("281"),
        }),
        docExamples: [
            {
                description:
                    "Dotation annuelle à l'amortissement linéaire d'un ordinateur (2183) de 800 € sur 3 ans : 800 / 3 = 266,67 €",
                params: {
                    amount: "266.67",
                },
            },
        ],
        buildEntries: (params) => {
            const amount = Number(params.amount)
            return [
                {
                    label: "Dotation aux amortissements",
                    lines: [
                        line(params.expenseAccount as string, "Dotations aux amortissements", amount),
                        line(params.depreciationAccount as string, "Amortissements cumulés", 0, amount),
                    ],
                },
            ]
        },
    }),
    "paiement-salaires": defineScenario({
        slug: "paiement-salaires",
        title: "Paiement des salaires",
        description:
            "La paie se comptabilise en deux étapes distinctes. Premièrement, la constatation de la charge : le salaire brut est débité au compte 641, tandis que les cotisations salariales (part prélevée sur le salaire brut) sont créditées sur les comptes de dette sociale (431, 437) et le net à payer au compte 421. Deuxièmement, le paiement effectif du net au salarié sur son compte bancaire.",
        paramsSchema: v.object({
            grossSalary: amountSchema,
            socialSecurityContributions: amountSchema,
            otherContributions: optionalString("0"),
            payNow: v.optional(v.boolean(), false),
        }),
        docExamples: [
            {
                description:
                    "Constatation du bulletin de paie : salaire brut 3 000 €, cotisations salariales 600 € (SS) + 150 € (autres organismes), net à payer 2 250 €",
                params: {
                    grossSalary: "3000",
                    socialSecurityContributions: "600",
                    otherContributions: "150",
                    payNow: true,
                },
            },
        ],
        buildEntries: (params) => {
            const gross = Number(params.grossSalary)
            const ss = Number(params.socialSecurityContributions)
            const other = Number(params.otherContributions ?? "0")
            const net = gross - ss - other
            const drafts: ScenarioEntryDraft[] = [
                {
                    label: "Constatation du bulletin de paie",
                    lines: [
                        line("641", "Rémunérations du personnel", gross),
                        line("421", "Personnel - Rémunérations dues", 0, net),
                        ...(ss > 0
                            ? [
                                  line("431", "Sécurité sociale", 0, ss),
                              ]
                            : []),
                        ...(other > 0
                            ? [
                                  line("437", "Autres organismes sociaux", 0, other),
                              ]
                            : []),
                    ],
                },
            ]
            if (params.payNow === true && net > 0) {
                drafts.push({
                    label: "Paiement des salaires",
                    lines: [
                        line("421", "Personnel - Rémunérations dues", net),
                        line("512", "Banques", 0, net),
                    ],
                })
            }
            return drafts
        },
    }),
    "charges-sociales-patronales": defineScenario({
        slug: "charges-sociales-patronales",
        title: "Charges sociales patronales",
        description:
            "Les cotisations patronales s'ajoutent au salaire brut et constituent la part de l'employeur dans le financement de la protection sociale. Elles sont enregistrées au compte 645 lors de la constatation du bulletin de paie, et soldées lors du paiement à l'URSSAF (compte 431) et aux organismes de prévoyance/retraite complémentaire (compte 437). Le paiement intervient le mois suivant, généralement le 15.",
        paramsSchema: v.object({
            employerSocialSecurity: amountSchema,
            employerOtherOrganizations: optionalString("0"),
            payNow: v.optional(v.boolean(), false),
        }),
        docExamples: [
            {
                description:
                    "Constatation des cotisations patronales sur salaire brut de 3 000 € : SS 900 € + autres organismes 450 € (soit 45 % total)",
                params: {
                    employerSocialSecurity: "900",
                    employerOtherOrganizations: "450",
                },
            },
            {
                description:
                    "Paiement des cotisations sociales le mois suivant : virement URSSAF 1 500 € (patronales 900 + salariales 600)",
                params: {
                    employerSocialSecurity: "1500",
                    payNow: true,
                },
            },
        ],
        buildEntries: (params) => {
            const ssEmployer = Number(params.employerSocialSecurity)
            const other = Number(params.employerOtherOrganizations ?? "0")
            const total = ssEmployer + other
            const drafts: ScenarioEntryDraft[] = [
                {
                    label: "Constatation des charges sociales patronales",
                    lines: [
                        line("645", "Cotisations de sécurité sociale et de prévoyance", total),
                        ...(ssEmployer > 0
                            ? [
                                  line("431", "Sécurité sociale", 0, ssEmployer),
                              ]
                            : []),
                        ...(other > 0
                            ? [
                                  line("437", "Autres organismes sociaux", 0, other),
                              ]
                            : []),
                    ],
                },
            ]
            if (params.payNow === true && ssEmployer > 0) {
                drafts.push({
                    label: "Paiement des cotisations sociales",
                    lines: [
                        line("431", "Sécurité sociale", ssEmployer),
                        line("512", "Banques", 0, ssEmployer),
                    ],
                })
            }
            return drafts
        },
    }),
    "emprunt-bancaire": defineScenario({
        slug: "emprunt-bancaire",
        title: "Contraction d'un emprunt bancaire",
        description:
            "Lorsqu'une entreprise contracte un emprunt auprès d'un établissement de crédit, les fonds reçus sont portés au crédit du compte 164 (ou 163 pour les emprunts obligataires). Le montant total de l'emprunt figure au passif du bilan. Des frais de dossier ou de garantie peuvent être engagés et sont comptabilisés en charges ou étalés selon leur nature. Les intérêts courus mais non échus en fin d'exercice sont provisionnés au compte 1688.",
        paramsSchema: v.object({
            amount: amountSchema,
        }),
        docExamples: [
            {
                description:
                    "Réception des fonds d'un emprunt bancaire de 50 000 € à 4 % sur 5 ans - virement sur le compte courant",
                params: {
                    amount: "50000",
                },
            },
        ],
        buildEntries: (params) => {
            const amount = Number(params.amount)
            return [
                {
                    label: "Contraction d'un emprunt bancaire",
                    lines: [
                        line("512", "Banques", amount),
                        line("164", "Emprunts auprès des établissements de crédit", 0, amount),
                    ],
                },
            ]
        },
    }),
    "remboursement-echeance-emprunt": defineScenario({
        slug: "remboursement-echeance-emprunt",
        title: "Remboursement d'une échéance d'emprunt",
        description:
            "Chaque mensualité comprend une part de remboursement du capital (débit compte 164, qui diminue la dette au bilan) et une part d'intérêts (débit compte 6611, charge financière déductible fiscalement). Un tableau d'amortissement du prêt détaille la décomposition de chaque échéance. Les intérêts payés diminuent le résultat imposable.",
        paramsSchema: v.object({
            capitalPart: amountSchema,
            interestPart: optionalString("0"),
        }),
        docExamples: [
            {
                description:
                    "Prélèvement mensuel de 1 000 € : 800 € en remboursement du capital et 200 € d'intérêts (taux 4 % sur capital restant dû)",
                params: {
                    capitalPart: "800",
                    interestPart: "200",
                },
            },
        ],
        buildEntries: (params) => {
            const capital = Number(params.capitalPart)
            const interest = Number(params.interestPart ?? "0")
            return [
                {
                    label: "Remboursement d'échéance d'emprunt",
                    lines: [
                        line("164", "Emprunts auprès des établissements de crédit", capital),
                        ...(interest > 0
                            ? [
                                  line("6611", "Intérêts des emprunts et dettes", interest),
                              ]
                            : []),
                        line("512", "Banques", 0, capital + interest),
                    ],
                },
            ]
        },
    }),
    "tva-declaration-mensuelle": defineScenario({
        slug: "tva-declaration-mensuelle",
        title: "Déclaration de TVA mensuelle",
        description:
            "Les entreprises soumises au régime réel normal déposent une déclaration CA3 chaque mois (généralement entre le 15 et le 25). La TVA à décaisser est égale à la TVA collectée (44571) diminuée de la TVA déductible (44566, 44562). Si la TVA déductible est supérieure, un crédit de TVA apparaît, report sur la déclaration suivante ou demande de remboursement.",
        paramsSchema: v.object({
            collectedVat: amountSchema,
            deductibleVat: amountSchema,
            payNow: v.optional(v.boolean(), false),
        }),
        docExamples: [
            {
                description:
                    "Liquidation mensuelle : TVA collectée 400 €, TVA déductible sur achats courants 200 € - solde à décaisser 200 €",
                params: {
                    collectedVat: "400",
                    deductibleVat: "200",
                    payNow: true,
                },
            },
        ],
        buildEntries: (params) => {
            const collected = Number(params.collectedVat)
            const deductible = Number(params.deductibleVat)
            const net = collected - deductible
            const drafts: ScenarioEntryDraft[] = [
                {
                    label: "Déclaration de TVA mensuelle",
                    lines: [
                        ...(collected > 0
                            ? [
                                  line("44571", "TVA collectée", collected),
                              ]
                            : []),
                        ...(deductible > 0
                            ? [
                                  line("44566", "TVA sur autres biens et services", 0, deductible),
                              ]
                            : []),
                        ...(net > 0
                            ? [
                                  line("44551", "TVA à décaisser", 0, net),
                              ]
                            : net < 0
                              ? [
                                    line("44551", "Crédit de TVA", -net),
                                ]
                              : []),
                    ],
                },
            ]
            if (params.payNow === true && net > 0) {
                drafts.push({
                    label: "Paiement de la TVA à décaisser",
                    lines: [
                        line("44551", "TVA à décaisser", net),
                        line("512", "Banques", 0, net),
                    ],
                })
            }
            return drafts.filter((draft) => draft.lines.length >= 2)
        },
    }),
    "paiement-loyer": defineScenario({
        slug: "paiement-loyer",
        title: "Paiement d'un loyer",
        description:
            "Le loyer professionnel est comptabilisé au compte 613 Locations, charge déductible du résultat. Pour les locaux commerciaux, le bailleur peut opter pour l'assujettissement à la TVA (option de l'article 260-2° du CGI) : le loyer est alors facturé HT + TVA 20 %, récupérable par le locataire assujetti. Par défaut, les loyers d'habitation sont exonérés de TVA.",
        paramsSchema: v.object({
            amountHT: amountSchema,
            vatRate: v.optional(v.number("Le taux de TVA doit être un nombre")),
        }),
        docExamples: [
            {
                description: "Loyer mensuel de locaux professionnels hors TVA : 1 500 € payés par virement",
                params: {
                    amountHT: "1500",
                },
            },
            {
                description:
                    "Loyer mensuel de locaux commerciaux avec option TVA : 1 500 € HT + TVA 20 % = 1 800 € TTC payés à réception de la quittance",
                params: {
                    amountHT: "1500",
                    vatRate: 20,
                },
            },
        ],
        buildEntries: (params) => {
            const ht = Number(params.amountHT)
            const rate = params.vatRate as number | undefined
            const tva = rate === undefined ? 0 : vat(ht, rate)
            return [
                {
                    label: "Paiement du loyer",
                    lines: [
                        line("613", "Locations", ht),
                        ...(tva > 0
                            ? [
                                  line("44566", "TVA sur autres biens et services", tva),
                              ]
                            : []),
                        line("512", "Banques", 0, ht + tva),
                    ],
                },
            ]
        },
    }),
    "provision-risques-charges": defineScenario({
        slug: "provision-risques-charges",
        title: "Provision pour risques et charges",
        description:
            "Une provision est constituée lorsqu'il existe, à la clôture de l'exercice, une obligation probable envers un tiers, résultant d'un événement passé, dont le montant peut être estimé de manière fiable (principe de prudence, article L. 123-20 du Code de commerce). Si le risque ne se matérialise pas, la provision doit être reprise au crédit du compte 7815. Une provision non reprise à tort constitue une réserve occulte.",
        paramsSchema: v.object({
            mode: v.picklist(
                [
                    "constitute",
                    "release",
                ],
                "Le mode doit être « constitute » ou « release »",
            ),
            amount: amountSchema,
        }),
        docExamples: [
            {
                description:
                    "Constitution d'une provision pour litige commercial en cours d'instance : risque estimé à 5 000 € par le conseil juridique",
                params: {
                    mode: "constitute",
                    amount: "5000",
                },
            },
            {
                description:
                    "Reprise de la provision l'exercice suivant : le litige est clôturé sans condamnation - la provision devient sans objet",
                params: {
                    mode: "release",
                    amount: "5000",
                },
            },
        ],
        buildEntries: (params) => {
            const amount = Number(params.amount)
            if (params.mode === "release") {
                return [
                    {
                        label: "Reprise de provision pour risques et charges",
                        lines: [
                            line("151", "Provisions pour risques", amount),
                            line("7815", "Reprises sur provisions d'exploitation", 0, amount),
                        ],
                    },
                ]
            }
            return [
                {
                    label: "Dotation aux provisions pour risques et charges",
                    lines: [
                        line("6815", "Dotations aux provisions d'exploitation", amount),
                        line("151", "Provisions pour risques", 0, amount),
                    ],
                },
            ]
        },
    }),
    "caution-depot-garantie": defineScenario({
        slug: "caution-depot-garantie",
        title: "Caution – dépôt de garantie (versement et récupération)",
        description:
            "Un dépôt de garantie versé (bail, marché, abonnement) est une créance : il est enregistré au débit du compte 275 « Dépôts et cautionnements versés », en contrepartie de la banque (512). À sa récupération, l'écriture est inversée : débit 512 « Banques », crédit 275.",
        paramsSchema: v.object({
            mode: v.picklist(
                [
                    "deposit",
                    "recovery",
                ],
                "Le mode doit être « deposit » ou « recovery »",
            ),
            amount: amountSchema,
        }),
        docExamples: [
            {
                description: "Versement d'un dépôt de garantie de 1 200 € (bail commercial)",
                params: {
                    mode: "deposit",
                    amount: "1200",
                },
            },
            {
                description: "Récupération du dépôt de garantie de 1 200 €",
                params: {
                    mode: "recovery",
                    amount: "1200",
                },
            },
        ],
        buildEntries: (params) => {
            const amount = Number(params.amount)
            if (params.mode === "recovery") {
                return [
                    {
                        label: "Récupération du dépôt de garantie",
                        lines: [
                            line("512", "Banques", amount),
                            line("275", "Dépôts et cautionnements versés", 0, amount),
                        ],
                    },
                ]
            }
            return [
                {
                    label: "Dépôt de garantie",
                    lines: [
                        line("275", "Dépôts et cautionnements versés", amount),
                        line("512", "Banques", 0, amount),
                    ],
                },
            ]
        },
    }),
    "affectation-resultat-benefice": defineScenario({
        slug: "affectation-resultat-benefice",
        title: "Affectation du résultat : bénéfice",
        description:
            "L'assemblée générale ordinaire annuelle décide de l'affectation du bénéfice de l'exercice (compte 120). La loi impose de doter la réserve légale de 5 % du bénéfice annuel jusqu'à ce qu'elle atteigne 10 % du capital social (SARL, SAS, SA). Le solde peut être distribué en dividendes (compte 457), reporté à nouveau (compte 110) ou affecté en réserves facultatives (compte 106).",
        paramsSchema: v.object({
            result: amountSchema,
            legalReserve: optionalString("0"),
            retainedEarnings: optionalString("0"),
            dividends: optionalString("0"),
            payDividendsNow: v.optional(v.boolean(), false),
        }),
        docExamples: [
            {
                description:
                    "Affectation du bénéfice de 20 000 € : 5 % en réserve légale (1 000 €), 19 000 € en dividendes à distribuer",
                params: {
                    result: "20000",
                    legalReserve: "1000",
                    dividends: "19000",
                    payDividendsNow: true,
                },
            },
        ],
        buildEntries: (params) => {
            const result = Number(params.result)
            const legalReserve = Number(params.legalReserve ?? "0")
            const retained = Number(params.retainedEarnings ?? "0")
            const dividends = Number(params.dividends ?? "0")
            const drafts: ScenarioEntryDraft[] = [
                {
                    label: "Affectation du résultat de l'exercice",
                    lines: [
                        line("120", "Résultat de l'exercice - bénéfice", result),
                        ...(legalReserve > 0
                            ? [
                                  line("1061", "Réserve légale", 0, legalReserve),
                              ]
                            : []),
                        ...(retained > 0
                            ? [
                                  line("1068", "Autres réserves", 0, retained),
                              ]
                            : []),
                        ...(dividends > 0
                            ? [
                                  line("457", "Associés - Dividendes à payer", 0, dividends),
                              ]
                            : []),
                        ...(result - legalReserve - retained - dividends > 0
                            ? [
                                  line("110", "Report à nouveau", 0, result - legalReserve - retained - dividends),
                              ]
                            : []),
                    ],
                },
            ]
            if (params.payDividendsNow === true && dividends > 0) {
                drafts.push({
                    label: "Paiement des dividendes",
                    lines: [
                        line("457", "Associés - Dividendes à payer", dividends),
                        line("512", "Banques", 0, dividends),
                    ],
                })
            }
            return drafts
        },
    }),
    "cession-immobilisation": defineScenario({
        slug: "cession-immobilisation",
        title: "Cession d'une immobilisation",
        description:
            "La sortie d'une immobilisation du bilan lors de sa vente génère deux opérations distinctes : l'enregistrement du produit de cession (compte 775 ou 77) et la sortie nette de l'actif (solde du compte d'immobilisation par son amortissement cumulé et la valeur nette comptable résiduelle en charge au compte 675 ou 67). La plus ou moins-value comptable est la différence entre le prix de cession et la valeur nette comptable.",
        paramsSchema: v.object({
            assetAccount: optionalString("2183"),
            originalValue: amountSchema,
            accumulatedDepreciation: optionalString("0"),
            salePrice: amountSchema,
        }),
        docExamples: [
            {
                description:
                    "Encaissement du prix de cession de l'ordinateur (800 € d'origine, revendu 400 €) par virement bancaire",
                params: {
                    originalValue: "800",
                    accumulatedDepreciation: "533",
                    salePrice: "400",
                },
            },
        ],
        buildEntries: (params) => {
            const original = Number(params.originalValue)
            const accumulated = Number(params.accumulatedDepreciation ?? "0")
            const salePrice = Number(params.salePrice)
            const vnc = original - accumulated
            const asset = params.assetAccount as string
            const drafts: ScenarioEntryDraft[] = [
                {
                    label: "Encaissement du prix de cession",
                    lines: [
                        line("512", "Banques", salePrice),
                        line("77", "Produits exceptionnels", 0, salePrice),
                    ],
                },
            ]
            if (original > 0) {
                drafts.push({
                    label: "Sortie de l'immobilisation",
                    lines: [
                        ...(accumulated > 0
                            ? [
                                  line("281", "Amortissements des immobilisations corporelles", accumulated),
                              ]
                            : []),
                        ...(vnc > 0
                            ? [
                                  line("67", "Charges exceptionnelles", vnc),
                              ]
                            : []),
                        line(asset, "Immobilisation corporelle", 0, original),
                    ],
                })
            }
            return drafts
        },
    }),
    "note-de-frais": defineScenario({
        slug: "note-de-frais",
        title: "Remboursement de note de frais",
        description:
            "Les frais professionnels avancés par un salarié (transport, repas, hébergement) sont remboursés sur présentation de justificatifs. Ils sont comptabilisés dans les comptes de charges correspondants (625, 6251, 6256…) avec la TVA récupérable le cas échéant. La dette envers le salarié transite par le compte 421 jusqu'au virement de remboursement. Les remboursements au réel sont exonérés de cotisations sociales si les justificatifs sont produits.",
        paramsSchema: v.object({
            amount: amountSchema,
            expenseAccount: optionalString("625"),
            reimburse: v.optional(v.boolean(), false),
        }),
        docExamples: [
            {
                description:
                    "Enregistrement de la note de frais : déplacements professionnels 150 € (billets de train, justificatifs fournis)",
                params: {
                    amount: "150",
                },
            },
            {
                description:
                    "Remboursement de la note de frais au salarié : virement de 150 € sur son compte personnel",
                params: {
                    amount: "150",
                    reimburse: true,
                },
            },
        ],
        buildEntries: (params) => {
            const amount = Number(params.amount)
            if (params.reimburse === true) {
                return [
                    {
                        label: "Remboursement de note de frais",
                        lines: [
                            line("421", "Personnel - Rémunérations dues", amount),
                            line("512", "Banques", 0, amount),
                        ],
                    },
                ]
            }
            return [
                {
                    label: "Note de frais",
                    lines: [
                        line(params.expenseAccount as string, "Frais professionnels", amount),
                        line("421", "Personnel - Rémunérations dues", 0, amount),
                    ],
                },
            ]
        },
    }),
    "achat-fournitures-consommables": defineScenario({
        slug: "achat-fournitures-consommables",
        title: "Achat de fournitures et consommables",
        description:
            "Les achats non stockés (fournitures de bureau, cartouches, petits consommables) sont comptabilisés directement en charges au compte 606, sans passer par un compte de stock. Ce traitement simplifié est approprié pour les articles de faible valeur à rotation rapide. Si l'entreprise choisit de les passer en stock, elle utiliserait le compte 321 avec variation de stock en fin d'exercice.",
        paramsSchema: v.object({
            amountHT: amountSchema,
            vatRate: vatRateSchema,
            paymentMode: paymentModeSchema(),
        }),
        docExamples: [
            {
                description: "Facture de fournitures de bureau : 200 € HT, TVA 20 % - règlement fournisseur à 30 jours",
                params: {
                    amountHT: "200",
                    vatRate: 20,
                    paymentMode: "credit",
                },
            },
            {
                description:
                    "Achat de consommables informatiques 80 € HT, TVA 20 % - payés immédiatement par carte bancaire",
                params: {
                    amountHT: "80",
                    vatRate: 20,
                    paymentMode: "bank",
                },
            },
        ],
        buildEntries: (params) => {
            const ht = Number(params.amountHT)
            const tva = vat(ht, params.vatRate as number)
            const third = params.paymentMode === "credit" ? "401" : "512"
            const thirdLabel = params.paymentMode === "credit" ? "Fournisseurs" : "Banques"
            return [
                {
                    label: "Achat de fournitures et consommables",
                    lines: [
                        line("606", "Achats non stockés de matière et fournitures", ht),
                        line("44566", "TVA sur autres biens et services", tva),
                        line(third, thirdLabel, 0, ht + tva),
                    ],
                },
            ]
        },
    }),
    "cloture-exercice": defineBalancesScenario({
        slug: "cloture-exercice",
        title: "Clôture des comptes de gestion",
        description:
            "En fin d'exercice, les comptes de gestion (classes 6 et 7) sont soldés pour déterminer le résultat : chaque compte de charge au solde débiteur est crédité, chaque compte de produit au solde créditeur est débité. Le solde net — bénéfice ou perte — est porté au compte 120 (bénéfice) ou 129 (perte). Cette écriture ne clôture pas l'exercice lui-même : la clôture définitive relève de l'endpoint dédié (POST /years/:idYear/close).",
        balancesSource: "year",
        paramsSchema: v.object({
            profitAccount: optionalString("120"),
            lossAccount: optionalString("129"),
        }),
        docExamples: [
            {
                description:
                    "Exercice bénéficiaire : charges 10 000 € (solde débiteur du 607), produits 15 000 € (solde créditeur du 707) — résultat de 5 000 € crédité au compte 120",
                params: {},
                balances: [
                    {
                        number: "607",
                        label: "Achats de marchandises",
                        balance: 10000,
                    },
                    {
                        number: "707",
                        label: "Ventes de marchandises",
                        balance: -15000,
                    },
                ],
            },
            {
                description:
                    "Exercice déficitaire : charges 8 000 € (solde débiteur du 607), produits 6 500 € (solde créditeur du 706) — perte de 1 500 € débitée au compte 129",
                params: {},
                balances: [
                    {
                        number: "607",
                        label: "Achats de marchandises",
                        balance: 8000,
                    },
                    {
                        number: "706",
                        label: "Prestations de services",
                        balance: -6500,
                    },
                ],
            },
        ],
        buildEntriesFromBalances: (balances, params) => {
            const closingLines: ScenarioLine[] = []
            for (const balance of balances) {
                if (Math.abs(balance.balance) < 0.005) continue
                // Un compte au solde débiteur (charge) est crédité ; un compte
                // au solde créditeur (produit) est débité.
                closingLines.push(
                    balance.balance > 0
                        ? line(balance.number, "Solde du compte", 0, balance.balance)
                        : line(balance.number, "Solde du compte", -balance.balance, 0),
                )
            }
            if (closingLines.length === 0) {
                return []
            }
            const totalDebit = closingLines.reduce((sum, l) => sum + Number(l.debit), 0)
            const totalCredit = closingLines.reduce((sum, l) => sum + Number(l.credit), 0)
            const algebraicResult = totalDebit - totalCredit
            const profitAccount = String(params.profitAccount ?? "120")
            const lossAccount = String(params.lossAccount ?? "129")
            const closingFlags = {
                isComputedForIncomeStatementReport: false,
            }
            return [
                {
                    label: "Solde des comptes de gestion",
                    lines: [
                        ...closingLines.map((closingLine) => ({
                            ...closingLine,
                            reportFlags: closingFlags,
                        })),
                        ...(algebraicResult > 0
                            ? [
                                  {
                                      ...line(profitAccount, "Résultat de l'exercice - bénéfice", 0, algebraicResult),
                                      reportFlags: closingFlags,
                                  },
                              ]
                            : algebraicResult < 0
                              ? [
                                    {
                                        ...line(lossAccount, "Résultat de l'exercice - perte", -algebraicResult, 0),
                                        reportFlags: closingFlags,
                                    },
                                ]
                              : []),
                    ],
                },
            ]
        },
    }),
    "ouverture-exercice": defineBalancesScenario({
        slug: "ouverture-exercice",
        title: "À-nouveaux (ouverture du nouvel exercice)",
        description:
            "À l'ouverture d'un nouvel exercice, les soldes de bilan de l'exercice précédent sont reportés à l'identique : les comptes d'actif au solde débiteur sont débités, les comptes de passif au solde créditeur sont crédités. Le compte de résultat de l'exercice précédent (120/129) doit avoir été soldé au préalable (clôture des comptes de gestion), faute de quoi l'écriture est refusée. L'écriture est passée dans le journal À-nouveaux (AN) à la date d'ouverture de l'exercice.",
        balancesSource: "previousYear",
        paramsSchema: v.object({}),
        docExamples: [
            {
                description:
                    "Report du bilan précédent : banque 10 000 € (débit), capital 5 000 € (crédit), emprunt 5 000 € (crédit)",
                params: {},
                balances: [
                    {
                        number: "512",
                        label: "Banques",
                        balance: 10000,
                    },
                    {
                        number: "101",
                        label: "Capital",
                        balance: -5000,
                    },
                    {
                        number: "164",
                        label: "Emprunts auprès des établissements de crédit",
                        balance: -5000,
                    },
                ],
            },
        ],
        buildEntriesFromBalances: (balances) => {
            const openingLines: ScenarioLine[] = []
            for (const balance of balances) {
                if (Math.abs(balance.balance) < 0.005) continue
                // Un solde débiteur est rétabli au débit, un solde créditeur au
                // crédit : les soldes de bilan sont reportés à l'identique.
                openingLines.push(
                    balance.balance > 0
                        ? line(balance.number, "Report du compte", balance.balance, 0)
                        : line(balance.number, "Report du compte", 0, -balance.balance),
                )
            }
            if (openingLines.length === 0) {
                return []
            }
            return [
                {
                    label: "Report du bilan de l'exercice précédent",
                    lines: openingLines.map((openingLine) => ({
                        ...openingLine,
                        reportFlags: {
                            isComputedForIncomeStatementReport: false,
                        },
                    })),
                },
            ]
        },
    }),
}

export function getScenarioDefinition(slug: string): ScenarioDefinition | undefined {
    return scenarioCatalog[slug]
}

export function listScenarioDefinitions(): ScenarioDefinition[] {
    return Object.values(scenarioCatalog)
}
