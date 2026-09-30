import {
    createOneAccountRouteDefinition,
    createOneEntryFromTemplateRouteDefinition,
    createOneJournalRouteDefinition,
    readAllAccountsRouteDefinition,
    readAllEntriesRouteDefinition,
    readAllEntryLinesRouteDefinition,
    readAllJournalsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonPlainContent, InputFile, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconFileImport } from "@tabler/icons-react"
import { useMemo, useState } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"

type FecLine = {
    accountLabel: string
    accountNumber: string
    credit: number
    debit: number
    entryDate: string
    entryLabel: string
    journalCode: string
    journalLabel: string
}

type FecEntry = {
    date: string
    journalCode: string
    journalLabel: string
    key: string
    label: string
    lines: FecLine[]
}

const REQUIRED_HEADERS = [
    "JournalCode",
    "JournalLib",
    "EcritureNum",
    "EcritureDate",
    "CompteNum",
    "CompteLib",
    "EcritureLib",
    "Debit",
    "Credit",
] as const

function parseFecDate(rawValue: string, lineIndex: number): string {
    const value = rawValue.trim()
    if (/^\d{8}$/.test(value)) {
        const year = value.slice(0, 4)
        const month = value.slice(4, 6)
        const day = value.slice(6, 8)
        return `${year}-${month}-${day}T00:00:00.000Z`
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Date invalide sur la ligne ${lineIndex}`)
    }

    return date.toISOString()
}

function parseFecAmount(rawValue: string, lineIndex: number): number {
    const normalized = rawValue.replaceAll(" ", "").replaceAll(",", ".").trim()
    if (normalized === "") {
        return 0
    }

    const parsed = Number(normalized)
    if (Number.isNaN(parsed)) {
        throw new Error(`Montant invalide sur la ligne ${lineIndex}`)
    }

    return parsed
}

function detectSeparator(headerLine: string): "\t" | "|" {
    if (headerLine.includes("\t")) {
        return "\t"
    }
    if (headerLine.includes("|")) {
        return "|"
    }
    throw new Error("Séparateur FEC non reconnu (attendu: tabulation ou '|')")
}

function getAccountType(accountNumber: string): "balance-sheet" | "income-statement" | "special" {
    const firstDigit = accountNumber.trim().slice(0, 1)
    if (firstDigit === "6" || firstDigit === "7") {
        return "income-statement"
    }
    if (firstDigit === "8") {
        return "special"
    }
    return "balance-sheet"
}

function getAccountParentId(parameters: {
    accountNumber: string
    accountsByNumber: Map<string, v.InferOutput<typeof returnedSchemas.account>>
}): string | null {
    const number = parameters.accountNumber.trim()

    for (let i = number.length - 1; i > 0; i--) {
        const parentNumber = number.slice(0, i)
        const parent = parameters.accountsByNumber.get(parentNumber)
        if (parent !== undefined) {
            return parent.id
        }
    }

    return null
}

function parseFecFile(content: string): FecEntry[] {
    const normalizedContent = content.replace(/^\uFEFF/, "")
    const lines = normalizedContent
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line) => line !== "")

    if (lines.length < 2) {
        throw new Error("Le fichier FEC ne contient aucune écriture")
    }

    const separator = detectSeparator(lines[0])
    const headers = lines[0].split(separator).map((value) => value.trim())
    const indexByHeader = new Map(
        headers.map((header, index) => [
            header,
            index,
        ]),
    )

    for (const requiredHeader of REQUIRED_HEADERS) {
        if (!indexByHeader.has(requiredHeader)) {
            throw new Error(`Colonne manquante: ${requiredHeader}`)
        }
    }

    const entriesByKey = new Map<string, FecEntry>()

    for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
        const line = lines[rowIndex]
        const cells = line.split(separator)
        const lineNumber = rowIndex + 1

        const getCell = (header: string) => {
            const index = indexByHeader.get(header)
            if (index === undefined) {
                return ""
            }
            return (cells[index] ?? "").trim()
        }

        const journalCode = getCell("JournalCode").slice(0, 32)
        const journalLabel = getCell("JournalLib").slice(0, 256)
        const entryNumber = getCell("EcritureNum")
        const entryDate = parseFecDate(getCell("EcritureDate"), lineNumber)
        const accountNumber = getCell("CompteNum").slice(0, 32)
        const accountLabel = getCell("CompteLib").slice(0, 256)
        const pieceReference = getCell("PieceRef")
        const entryLabel = (pieceReference || getCell("EcritureLib") || `Ecriture ${entryNumber}`).slice(0, 256)
        const lineLabel = (getCell("EcritureLib") || entryLabel).slice(0, 256)
        const debit = parseFecAmount(getCell("Debit"), lineNumber)
        const credit = parseFecAmount(getCell("Credit"), lineNumber)

        if (journalCode === "" || entryNumber === "" || accountNumber === "") {
            throw new Error(`Ligne ${lineNumber} invalide: champs obligatoires manquants`)
        }

        if (debit < 0 || credit < 0) {
            throw new Error(`Ligne ${lineNumber} invalide: montants négatifs non supportés`)
        }

        const key = `${journalCode}__${entryNumber}__${entryDate}`
        const existingEntry = entriesByKey.get(key)
        const fecLine: FecLine = {
            accountLabel,
            accountNumber,
            credit,
            debit,
            entryDate,
            entryLabel: lineLabel,
            journalCode,
            journalLabel,
        }

        if (existingEntry === undefined) {
            entriesByKey.set(key, {
                date: entryDate,
                journalCode,
                journalLabel,
                key,
                label: entryLabel,
                lines: [
                    fecLine,
                ],
            })
            continue
        }

        existingEntry.lines.push(fecLine)
    }

    const entries = [
        ...entriesByKey.values(),
    ].sort((left, right) => {
        const dateCompare = left.date.localeCompare(right.date)
        if (dateCompare !== 0) {
            return dateCompare
        }
        return left.key.localeCompare(right.key)
    })

    for (const entry of entries) {
        const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0)
        const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0)
        const delta = Math.abs(totalDebit - totalCredit)

        if (delta > 0.01) {
            throw new Error(`Ecriture non équilibrée: ${entry.label}`)
        }
    }

    return entries
}

export function ImportFecFile(props: {
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
    journals: v.InferOutput<typeof readAllJournalsRouteDefinition.schemas.return>
    accounts: v.InferOutput<typeof readAllAccountsRouteDefinition.schemas.return>
}) {
    const { closePanel } = useRightPanel()
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const selectedFileLabel = useMemo(() => {
        if (selectedFile === null) {
            return "Aucun fichier sélectionné"
        }
        return selectedFile.name
    }, [
        selectedFile,
    ])

    async function handleImport() {
        if (selectedFile === null) {
            toast({
                title: "Sélectionnez un fichier FEC",
                variant: "warning",
            })
            return
        }

        const fileContent = await selectedFile.text()

        let entries: FecEntry[]
        try {
            entries = parseFecFile(fileContent)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Fichier FEC invalide"
            toast({
                title: message,
                variant: "error",
            })
            return
        }

        const journalsByCode = new Map(
            props.journals.map((journal) => [
                journal.code,
                journal,
            ]),
        )
        const accountsByNumber = new Map(
            props.accounts.map((account) => [
                account.number,
                account,
            ]),
        )

        let createdJournalsCount = 0
        let createdAccountsCount = 0
        let createdEntriesCount = 0
        let createdEntryLinesCount = 0

        for (const entry of entries) {
            let journal = journalsByCode.get(entry.journalCode)
            if (journal === undefined) {
                const createJournalResponse = await getResponseBodyFromAPI({
                    routeDefinition: createOneJournalRouteDefinition,
                    body: {
                        idYear: props.idYear,
                        code: entry.journalCode,
                        label: entry.journalLabel || entry.journalCode,
                    },
                })

                if (createJournalResponse.ok === false) {
                    toast({
                        title: `Impossible de créer le journal ${entry.journalCode}`,
                        variant: "error",
                    })
                    return
                }

                journal = createJournalResponse.data
                journalsByCode.set(journal.code, journal)
                createdJournalsCount += 1
            }

            const entryLinesPayload: Array<{
                credit: string
                debit: string
                idAccount: string
                isComputedForBalanceReport: boolean
                isComputedForBalanceSheetReport: boolean
                isComputedForIncomeStatementReport: boolean
                isComputedForJournalReport: boolean
                isComputedForLedgerReport: boolean
            }> = []

            for (const line of entry.lines) {
                let account = accountsByNumber.get(line.accountNumber)
                if (account === undefined) {
                    const createAccountResponse = await getResponseBodyFromAPI({
                        routeDefinition: createOneAccountRouteDefinition,
                        body: {
                            idYear: props.idYear,
                            idAccountParent: getAccountParentId({
                                accountNumber: line.accountNumber,
                                accountsByNumber,
                            }),
                            isSelectable: true,
                            label: line.accountLabel || `Compte ${line.accountNumber}`,
                            number: line.accountNumber,
                            type: getAccountType(line.accountNumber),
                        },
                    })

                    if (createAccountResponse.ok === false) {
                        toast({
                            title: `Impossible de créer le compte ${line.accountNumber}`,
                            variant: "error",
                        })
                        return
                    }

                    account = createAccountResponse.data
                    accountsByNumber.set(account.number, account)
                    createdAccountsCount += 1
                }

                entryLinesPayload.push({
                    credit: line.credit.toFixed(2),
                    debit: line.debit.toFixed(2),
                    idAccount: account.id,
                    isComputedForBalanceReport: true,
                    isComputedForBalanceSheetReport: true,
                    isComputedForIncomeStatementReport: true,
                    isComputedForJournalReport: true,
                    isComputedForLedgerReport: true,
                })
            }

            const createEntryResponse = await getResponseBodyFromAPI({
                routeDefinition: createOneEntryFromTemplateRouteDefinition,
                body: {
                    date: entry.date,
                    entryLines: entryLinesPayload,
                    idFile: null,
                    idJournal: journal.id,
                    idYear: props.idYear,
                    label: entry.label,
                },
            })

            if (createEntryResponse.ok === false) {
                toast({
                    title: `Impossible de créer l'écriture ${entry.label}`,
                    variant: "error",
                })
                return
            }

            createdEntriesCount += 1
            createdEntryLinesCount += entryLinesPayload.length
        }

        await Promise.all([
            invalidateData({
                routeDefinition: readAllEntriesRouteDefinition,
                body: {
                    idYear: props.idYear,
                },
            }),
            invalidateData({
                routeDefinition: readAllEntryLinesRouteDefinition,
                body: {
                    idYear: props.idYear,
                },
            }),
            invalidateData({
                routeDefinition: readAllJournalsRouteDefinition,
                body: {
                    idYear: props.idYear,
                },
            }),
            invalidateData({
                routeDefinition: readAllAccountsRouteDefinition,
                body: {
                    idYear: props.idYear,
                },
            }),
        ])

        toast({
            title: `${createdEntriesCount} écritures importées (${createdEntryLinesCount} mouvements, ${createdJournalsCount} journaux, ${createdAccountsCount} comptes créés)`,
            variant: "success",
        })

        setSelectedFile(null)
        closePanel()
    }

    return (
        <Fragment>
            <p
                className={css({
                    fontSize: "sm",
                    color: "neutral/70",
                    lineHeight: "relaxed",
                })}
            >
                Importez un FEC pour créer automatiquement les journaux, comptes, écritures et mouvements manquants de
                l'exercice.
            </p>
            <p
                className={css({
                    fontSize: "sm",
                    color: "neutral/70",
                    lineHeight: "relaxed",
                })}
            >
                Nous avons créé également un outil de validation de conformité du FEC, disponible gratuitement en ligne
                sur{" "}
                <a
                    href="https://fec.comptasse.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={css({
                        color: "primary",
                        fontWeight: "medium",
                        textDecoration: "underline",
                        textDecorationColor: "primary/30",
                        textUnderlineOffset: "2px",
                        _hover: {
                            textDecorationColor: "primary",
                        },
                        transition: "all 0.15s",
                    })}
                >
                    fec.comptasse.com
                </a>
                .
            </p>
            <InputFile
                accept=".txt,.csv,text/plain"
                onChange={(file) => {
                    if (file === undefined) {
                        setSelectedFile(null)
                        return
                    }
                    setSelectedFile(file)
                }}
            />
            <p
                className={css({
                    fontSize: "sm",
                    color: "neutral/60",
                })}
            >
                Format supporté: fichier texte FEC avec séparateur tabulation ou "|".
            </p>
            <p
                className={css({
                    fontSize: "xs",
                    color: "neutral/50",
                })}
            >
                {selectedFileLabel}
            </p>
            <Button
                hasLoader
                onClick={handleImport}
            >
                <ButtonPlainContent
                    leftIcon={<IconFileImport />}
                    text="Importer le FEC"
                />
            </Button>
            <p
                className={css({
                    fontSize: "xs",
                    color: "neutral/50",
                })}
            >
                Le contrôle de compatibilité vérifie les colonnes requises et l'équilibre débit/crédit de chaque
                écriture.
            </p>
        </Fragment>
    )
}
