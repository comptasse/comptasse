import { beforeAll, describe, expect, it } from "vitest"
import { verifyApiIsRunning } from "../api/helpers/setup.js"
import { createLoggedInCliEnv, parseJson, runCli } from "./helpers.js"

let env: NodeJS.ProcessEnv
let orgId: string
let idYear: string
let idEntry: string

beforeAll(async () => {
    await verifyApiIsRunning()
    const session = await createLoggedInCliEnv()
    env = session.env
    orgId = session.orgId

    const years = parseJson<
        Array<{
            id: string
        }>
    >(
        await runCli(
            [
                "years",
                "list",
            ],
            env,
        ),
    )
    idYear = years[0]!.id

    const entries = parseJson<
        Array<{
            id: string
        }>
    >(
        await runCli(
            [
                "entries",
                "list",
                "--year",
                idYear,
            ],
            env,
        ),
    )
    idEntry = entries[0]!.id
})

describe("cli: help & errors", () => {
    it("--help prints usage", async () => {
        const result = await runCli(
            [
                "--help",
            ],
            env,
        )
        expect(result.code).toBe(0)
        expect(result.stdout).toContain("Usage: comptasse")
        expect(result.stdout).toContain("entries")
    })

    it("--version prints a version", async () => {
        const result = await runCli(
            [
                "--version",
            ],
            env,
        )
        expect(result.code).toBe(0)
        expect(result.stdout).toMatch(/comptasse\s+\S+/)
    })

    it("an unknown command fails", async () => {
        const result = await runCli(
            [
                "definitely-not-a-command",
            ],
            env,
        )
        expect(result.code).not.toBe(0)
    })
})

describe("cli: org & auth", () => {
    it("org get returns the organization", async () => {
        const org = parseJson<{
            id: string
        }>(
            await runCli(
                [
                    "org",
                    "get",
                ],
                env,
            ),
        )
        expect(org.id).toBe(orgId)
    })

    it("whoami is reachable", async () => {
        const result = await runCli(
            [
                "whoami",
            ],
            env,
        )
        expect(result.code).toBe(0)
    })
})

describe("cli: years", () => {
    it("years list returns an array", async () => {
        const years = parseJson<unknown[]>(
            await runCli(
                [
                    "years",
                    "list",
                ],
                env,
            ),
        )
        expect(Array.isArray(years)).toBe(true)
        expect(years.length).toBeGreaterThan(0)
    })

    it("years get returns the year", async () => {
        const year = parseJson<{
            id: string
        }>(
            await runCli(
                [
                    "years",
                    "get",
                    idYear,
                ],
                env,
            ),
        )
        expect(year.id).toBe(idYear)
    })
})

describe("cli: journals / accounts / tags", () => {
    it("journals list", async () => {
        expect(
            Array.isArray(
                parseJson(
                    await runCli(
                        [
                            "journals",
                            "list",
                            "--year",
                            idYear,
                        ],
                        env,
                    ),
                ),
            ),
        ).toBe(true)
    })

    it("accounts list", async () => {
        expect(
            Array.isArray(
                parseJson(
                    await runCli(
                        [
                            "accounts",
                            "list",
                            "--year",
                            idYear,
                        ],
                        env,
                    ),
                ),
            ),
        ).toBe(true)
    })

    it("tags list", async () => {
        expect(
            Array.isArray(
                parseJson(
                    await runCli(
                        [
                            "tags",
                            "list",
                            "--year",
                            idYear,
                        ],
                        env,
                    ),
                ),
            ),
        ).toBe(true)
    })

    it("tags create / update / delete", async () => {
        const label = `CLI test tag ${Date.now()}`
        const created = parseJson<{
            id: string
        }>(
            await runCli(
                [
                    "tags",
                    "create",
                    "--year",
                    idYear,
                    "--label",
                    label,
                ],
                env,
            ),
        )
        expect(created.id).toBeTruthy()

        const updated = parseJson<{
            label: string
        }>(
            await runCli(
                [
                    "tags",
                    "update",
                    created.id,
                    "--year",
                    idYear,
                    "--label",
                    `${label} (updated)`,
                ],
                env,
            ),
        )
        expect(updated.label).toBe(`${label} (updated)`)

        const deleted = await runCli(
            [
                "tags",
                "delete",
                created.id,
                "--year",
                idYear,
            ],
            env,
        )
        expect(deleted.code).toBe(0)
    })
})

describe("cli: entries", () => {
    it("entries list", async () => {
        expect(
            Array.isArray(
                parseJson(
                    await runCli(
                        [
                            "entries",
                            "list",
                            "--year",
                            idYear,
                        ],
                        env,
                    ),
                ),
            ),
        ).toBe(true)
    })

    it("entries get", async () => {
        const entry = parseJson<{
            id: string
        }>(
            await runCli(
                [
                    "entries",
                    "get",
                    idEntry,
                    "--year",
                    idYear,
                ],
                env,
            ),
        )
        expect(entry.id).toBe(idEntry)
    })

    it("entries lines list (year-wide)", async () => {
        const lines = parseJson(
            await runCli(
                [
                    "entries",
                    "lines",
                    "list",
                    "--year",
                    idYear,
                ],
                env,
            ),
        )
        expect(Array.isArray(lines)).toBe(true)
    })

    it("entries lines list (per entry)", async () => {
        const lines = parseJson<
            Array<{
                idEntry: string
            }>
        >(
            await runCli(
                [
                    "entries",
                    "lines",
                    "list",
                    idEntry,
                    "--year",
                    idYear,
                ],
                env,
            ),
        )
        expect(Array.isArray(lines)).toBe(true)
        for (const line of lines) expect(line.idEntry).toBe(idEntry)
    })

    it("entries non-balanced audit", async () => {
        const result = await runCli(
            [
                "entries",
                "non-balanced",
                "--year",
                idYear,
            ],
            env,
        )
        expect(Array.isArray(parseJson(result))).toBe(true)
    })

    it("entries missing-attachments audit", async () => {
        const result = await runCli(
            [
                "entries",
                "missing-attachments",
                "--year",
                idYear,
            ],
            env,
        )
        expect(Array.isArray(parseJson(result))).toBe(true)
    })
})

describe("cli: matchings & pointage", () => {
    it("creates, lists, gets, connects and deletes a matching, and toggles pointage", async () => {
        const journals = parseJson<
            Array<{
                id: string
            }>
        >(
            await runCli(
                [
                    "journals",
                    "list",
                    "--year",
                    idYear,
                ],
                env,
            ),
        )
        const accounts = parseJson<
            Array<{
                id: string
                isSelectable: boolean
            }>
        >(
            await runCli(
                [
                    "accounts",
                    "list",
                    "--year",
                    idYear,
                ],
                env,
            ),
        )
        const account = accounts.find((candidate) => candidate.isSelectable === true) ?? accounts[0]!
        expect(account.id).toBeTruthy()

        // A fresh entry with two lines on the same account.
        const entry = parseJson<{
            id: string
        }>(
            await runCli(
                [
                    "entries",
                    "create",
                    "--year",
                    idYear,
                    "--journal",
                    journals[0]!.id,
                    "--label",
                    "Matching test",
                    "--date",
                    "2024-01-15T00:00:00.000Z",
                ],
                env,
            ),
        )
        expect(entry.id).toBeTruthy()

        const createLine = async (debit: string, credit: string) =>
            parseJson<{
                id: string
                idAccount: string
            }>(
                await runCli(
                    [
                        "entries",
                        "lines",
                        "create",
                        entry.id,
                        "--year",
                        idYear,
                        "--account",
                        account.id,
                        "--debit",
                        debit,
                        "--credit",
                        credit,
                        "--manual",
                    ],
                    env,
                ),
            )
        const line1 = await createLine("10", "0")
        const line2 = await createLine("0", "10")

        // Create a matching on the account with the first line.
        const matching = parseJson<{
            id: string
            code: string
            idAccount: string
        }>(
            await runCli(
                [
                    "matchings",
                    "create",
                    "--year",
                    idYear,
                    "--account",
                    account.id,
                    "--lines",
                    line1.id,
                    "--code",
                    "ZZ",
                ],
                env,
            ),
        )
        expect(matching.id).toBeTruthy()
        expect(matching.code).toBe("ZZ")
        expect(matching.idAccount).toBe(account.id)

        // It can be listed and read back.
        const list = parseJson<
            Array<{
                id: string
            }>
        >(
            await runCli(
                [
                    "matchings",
                    "list",
                    "--year",
                    idYear,
                ],
                env,
            ),
        )
        expect(list.some((item) => item.id === matching.id)).toBe(true)
        const fetched = parseJson<{
            id: string
        }>(
            await runCli(
                [
                    "matchings",
                    "get",
                    matching.id,
                    "--year",
                    idYear,
                ],
                env,
            ),
        )
        expect(fetched.id).toBe(matching.id)

        // Connecting a second line links it to the matching.
        const connected = parseJson<
            Array<{
                id: string
                idMatching: string | null
            }>
        >(
            await runCli(
                [
                    "matchings",
                    "connect",
                    matching.id,
                    "--year",
                    idYear,
                    "--lines",
                    line2.id,
                ],
                env,
            ),
        )
        expect(connected.some((line) => line.id === line2.id && line.idMatching === matching.id)).toBe(true)

        // The code can be renamed.
        const renamed = parseJson<{
            id: string
            code: string
        }>(
            await runCli(
                [
                    "matchings",
                    "update",
                    matching.id,
                    "--year",
                    idYear,
                    "--code",
                    "ZZ2",
                ],
                env,
            ),
        )
        expect(renamed.code).toBe("ZZ2")

        // Pointage: mark the entry cleared, then uncleared.
        const cleared = parseJson<{
            isCleared: boolean
        }>(
            await runCli(
                [
                    "entries",
                    "update",
                    entry.id,
                    "--year",
                    idYear,
                    "--cleared",
                ],
                env,
            ),
        )
        expect(cleared.isCleared).toBe(true)
        const uncleared = parseJson<{
            isCleared: boolean
        }>(
            await runCli(
                [
                    "entries",
                    "update",
                    entry.id,
                    "--year",
                    idYear,
                    "--uncleared",
                ],
                env,
            ),
        )
        expect(uncleared.isCleared).toBe(false)

        // Deleting the matching also unlinks its lines.
        const deleted = await runCli(
            [
                "matchings",
                "delete",
                matching.id,
                "--year",
                idYear,
            ],
            env,
        )
        expect(deleted.code).toBe(0)

        const after = parseJson<
            Array<{
                id: string
            }>
        >(
            await runCli(
                [
                    "matchings",
                    "list",
                    "--year",
                    idYear,
                ],
                env,
            ),
        )
        expect(after.some((item) => item.id === matching.id)).toBe(false)

        const linesAfter = parseJson<
            Array<{
                id: string
                idMatching: string | null
            }>
        >(
            await runCli(
                [
                    "entries",
                    "lines",
                    "list",
                    entry.id,
                    "--year",
                    idYear,
                ],
                env,
            ),
        )
        for (const line of linesAfter) expect(line.idMatching ?? null).toBeNull()
    })
})

describe("cli: files / folders", () => {
    it("files list", async () => {
        expect(
            Array.isArray(
                parseJson(
                    await runCli(
                        [
                            "files",
                            "list",
                            "--year",
                            idYear,
                        ],
                        env,
                    ),
                ),
            ),
        ).toBe(true)
    })

    it("files folders list", async () => {
        expect(
            Array.isArray(
                parseJson(
                    await runCli(
                        [
                            "files",
                            "folders",
                            "list",
                            "--year",
                            idYear,
                        ],
                        env,
                    ),
                ),
            ),
        ).toBe(true)
    })
})

describe("cli: scenarios / members / statements / exports", () => {
    it("scenarios list", async () => {
        expect(
            Array.isArray(
                parseJson(
                    await runCli(
                        [
                            "scenarios",
                            "list",
                            "--year",
                            idYear,
                        ],
                        env,
                    ),
                ),
            ),
        ).toBe(true)
    })

    it("matchings list", async () => {
        expect(
            Array.isArray(
                parseJson(
                    await runCli(
                        [
                            "matchings",
                            "list",
                            "--year",
                            idYear,
                        ],
                        env,
                    ),
                ),
            ),
        ).toBe(true)
    })

    it("members list", async () => {
        const result = await runCli(
            [
                "members",
                "list",
            ],
            env,
        )
        expect(result.code).toBe(0)
        expect(Array.isArray(parseJson(result))).toBe(true)
    })

    it("balance-sheets list", async () => {
        const result = await runCli(
            [
                "balance-sheets",
                "list",
                idYear,
            ],
            env,
        )
        expect(Array.isArray(parseJson(result))).toBe(true)
    })

    it("income-statements list", async () => {
        const result = await runCli(
            [
                "income-statements",
                "list",
                idYear,
            ],
            env,
        )
        expect(Array.isArray(parseJson(result))).toBe(true)
    })

    it("exports fec returns a URL", async () => {
        const result = await runCli(
            [
                "exports",
                "fec",
                "--year",
                idYear,
            ],
            env,
        )
        expect(result.code).toBe(0)
        expect(result.stdout.trim().length).toBeGreaterThan(0)
    })
})
