import { execFile } from "node:child_process"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import { getDemoOrganizationId, signInAsDemo } from "../api/helpers/auth.js"

const execFileAsync = promisify(execFile)

export const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000"

/** Absolute path to the CLI entry point (works from packages/api and the api container). */
export function cliPath(): string {
    return path.resolve(process.cwd(), "../../packages/cli/comptasse.sh")
}

export type CliResult = {
    code: number
    stdout: string
    stderr: string
}

/** Runs the comptasse CLI with the given arguments in an isolated COMPTASSE_DIR. */
export async function runCli(args: string[], environment: NodeJS.ProcessEnv): Promise<CliResult> {
    try {
        const { stdout, stderr } = await execFileAsync(
            "sh",
            [
                cliPath(),
                ...args,
            ],
            {
                env: environment,
                maxBuffer: 64 * 1024 * 1024,
            },
        )
        return {
            code: 0,
            stdout,
            stderr,
        }
    } catch (error) {
        const execError = error as {
            code?: number
            stdout?: string
            stderr?: string
        }
        return {
            code: typeof execError.code === "number" ? execError.code : 1,
            stdout: execError.stdout ?? "",
            stderr: execError.stderr ?? "",
        }
    }
}

/** Creates an isolated CLI config + cookie jar and logs in as the demo user. */
export async function createLoggedInCliEnv(): Promise<{
    env: NodeJS.ProcessEnv
    orgId: string
}> {
    const session = await signInAsDemo()
    const orgId = await getDemoOrganizationId(session)

    const dir = mkdtempSync(path.join(tmpdir(), "comptasse-cli-"))
    const env: NodeJS.ProcessEnv = {
        ...process.env,
        COMPTASSE_DIR: dir,
        COMPTASSE_URL: API_BASE_URL,
        // The CLI's update check compares against the version advertised by
        // production (comptasse.com), which is always older on a version-bump
        // branch. Opt out so the suite does not depend on the released version.
        COMPTASSE_SKIP_VERSION_CHECK: "1",
    }

    const login = await runCli(
        [
            "login",
            "--email",
            "demo@comptasse.com",
            "--password",
            "demo",
            "--url",
            API_BASE_URL,
            "--org",
            orgId,
        ],
        env,
    )
    if (login.code !== 0) {
        throw new Error(`CLI login failed:\n${login.stderr || login.stdout}`)
    }

    return {
        env,
        orgId,
    }
}

export function parseJson<T = unknown>(result: CliResult): T {
    try {
        return JSON.parse(result.stdout) as T
    } catch {
        throw new Error(`CLI output is not valid JSON:\n${result.stdout.slice(0, 500)}\n${result.stderr.slice(0, 500)}`)
    }
}
