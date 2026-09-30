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
