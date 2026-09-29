/**
 * Human labels for the scenario parameters exposed by
 * `GET /years/:idYear/scenarios/:scenario` (`describeScenarioParams`).
 * Unknown names fall back to the raw parameter name.
 */
const labels: Record<string, string> = {
    amount: "Montant",
    amountHT: "Montant HT",
    vatRate: "Taux de TVA (%)",
    paymentMode: "Mode de règlement",
    discountRate: "Taux d'escompte (%)",
    capitalAmount: "Montant du capital",
    liberatedAmount: "Montant libéré",
    premiumAmount: "Prime d'émission",
    mode: "Mode",
    assetAccount: "Compte d'immobilisation",
    expenseAccount: "Compte de charge",
    depreciationAccount: "Compte d'amortissement",
    originalValue: "Valeur d'origine",
    accumulatedDepreciation: "Amortissements cumulés",
    salePrice: "Prix de cession",
    grossSalary: "Salaire brut",
    socialSecurityContributions: "Cotisations sociales salariales",
    otherContributions: "Autres cotisations",
    employerSocialSecurity: "Cotisations patronales",
    employerOtherOrganizations: "Autres organismes sociaux",
    payNow: "Payer immédiatement",
    capitalPart: "Part capital",
    interestPart: "Part intérêts",
    collectedVat: "TVA collectée",
    deductibleVat: "TVA déductible",
    result: "Résultat",
    legalReserve: "Réserve légale",
    retainedEarnings: "Report à nouveau",
    dividends: "Dividendes",
    payDividendsNow: "Payer les dividendes immédiatement",
    reimburse: "Rembourser",
    profitAccount: "Compte de bénéfice (120)",
    lossAccount: "Compte de perte (129)",
}

export function scenarioParamLabel(name: string): string {
    return labels[name] ?? name
}

/** Friendly labels for the picklist values used across scenarios. */
const choiceLabels: Record<string, string> = {
    credit: "À crédit",
    bank: "Banque",
    cash: "Espèces",
    reserves: "Incorporation de réserves",
    constitute: "Constitution",
    release: "Reprise",
}

export function scenarioChoiceLabel(choice: string): string {
    return choiceLabels[choice] ?? choice
}
