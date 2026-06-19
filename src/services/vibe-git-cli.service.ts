import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

type FinalizeDeliveryInput = {
  cwd: string;
  branchName: string;
  baseBranch: string;
  taskSummary: string[];
  branchDescription?: string;
  entryName?: string;
  exitName?: string;
  createPullRequest?: boolean;
  requireCleanVibeGitWorkspace?: boolean;
};

function getVibeGitCliPath(): string {
  return require.resolve("@igoralbuquerque/vibe-git");
}

function normalizeName(value: string): string {
  return value
    .replace(/^refs\/heads\//, "")
    .replace(/\.json$/i, "")
    .replace(/[^a-zA-Z0-9._/-]/g, "-")
    .replace(/[\\/]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function ensureJson(value: string): string {
  return value.toLowerCase().endsWith(".json") ? value : `${value}.json`;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function runCommand(command: string, args: string[], cwd: string) {
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      encoding: "utf8",
      env: process.env,
      windowsHide: true,
      timeout: 1000 * 60 * 10
    });

    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error: any) {
    return {
      success: false,
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      message: error.message,
      exitCode: error.code
    };
  }
}

async function runVibeGit(args: string[], cwd: string) {
  const cliPath = getVibeGitCliPath();
  return runCommand(process.execPath, [cliPath, ...args], cwd);
}

async function assertProjectReady(cwd: string) {
  const stat = await fs.stat(cwd).catch(() => null);

  if (!stat?.isDirectory()) {
    throw new Error(`cwd does not exist or is not a directory: ${cwd}`);
  }

  const configPath = path.join(cwd, "vibe-git.config.json");
  const entryDir = path.join(cwd, "vibe-git", "entry");
  const exitDir = path.join(cwd, "vibe-git", "exit");

  if (!(await exists(configPath))) {
    throw new Error(
      "vibe-git.config.json not found. Run vibe-git init manually before using vibe-git-mcp."
    );
  }

  if (!(await exists(entryDir))) {
    throw new Error(
      "vibe-git/entry not found. Run vibe-git init manually before using vibe-git-mcp."
    );
  }

  if (!(await exists(exitDir))) {
    throw new Error(
      "vibe-git/exit not found. Run vibe-git init manually before using vibe-git-mcp."
    );
  }
}

async function hasGitChanges(cwd: string): Promise<boolean> {
  const result = await runCommand("git", ["status", "--short"], cwd);

  if (!result.success) {
    throw new Error(`cwd must be a Git repository. ${result.message || result.stderr}`);
  }

  return result.stdout.trim().length > 0;
}

async function writeEntryFile(input: Required<Pick<
  FinalizeDeliveryInput,
  "cwd" | "branchName" | "baseBranch" | "taskSummary" | "requireCleanVibeGitWorkspace"
>> & Omit<FinalizeDeliveryInput, "cwd" | "branchName" | "baseBranch" | "taskSummary" | "requireCleanVibeGitWorkspace">) {
  const normalizedEntryName = normalizeName(input.entryName || input.branchName);
  const normalizedExitName = normalizeName(input.exitName || normalizedEntryName);

  if (!normalizedEntryName) {
    throw new Error("entryName could not be normalized.");
  }

  if (!normalizedExitName) {
    throw new Error("exitName could not be normalized.");
  }

  const entryFile = ensureJson(normalizedEntryName);
  const exitFile = ensureJson(normalizedExitName);

  const entryPath = path.join(input.cwd, "vibe-git", "entry", entryFile);
  const exitPath = path.join(input.cwd, "vibe-git", "exit", exitFile);

  if (input.requireCleanVibeGitWorkspace) {
    if (await exists(entryPath)) {
      throw new Error(`Entry file already exists: vibe-git/entry/${entryFile}`);
    }

    if (await exists(exitPath)) {
      throw new Error(`Exit file already exists: vibe-git/exit/${exitFile}`);
    }
  }

  const payload = {
    exitName: normalizedExitName,
    prBase: input.baseBranch,
    userSummary: input.taskSummary,
    branches: [
      {
        branchName: input.branchName,
        description: input.branchDescription || input.taskSummary[0]
      }
    ]
  };

  await fs.writeFile(entryPath, JSON.stringify(payload, null, 2), "utf8");

  return {
    entryFile,
    exitFile,
    entryPath,
    exitPath,
    relativeEntryPath: `vibe-git/entry/${entryFile}`,
    relativeExitPath: `vibe-git/exit/${exitFile}`
  };
}

export async function finalizeDeliveryWithVibeGitCli(input: FinalizeDeliveryInput) {
  const cwd = path.resolve(input.cwd);

  try {
    await assertProjectReady(cwd);

    const hasChanges = await hasGitChanges(cwd);

    if (!hasChanges) {
      return {
        success: true,
        status: "no_changes",
        message: "No changes detected. Nothing to commit.",
        cwd,
        hasChanges: false,
        planGenerated: false,
        planExecuted: false
      };
    }

    const entry = await writeEntryFile({
      cwd,
      branchName: input.branchName,
      baseBranch: input.baseBranch,
      taskSummary: input.taskSummary,
      branchDescription: input.branchDescription,
      entryName: input.entryName,
      exitName: input.exitName,
      createPullRequest: input.createPullRequest,
      requireCleanVibeGitWorkspace: input.requireCleanVibeGitWorkspace ?? true
    });

    const runResult = await runVibeGit(["run", entry.entryFile], cwd);

    if (!runResult.success) {
      return {
        success: false,
        status: "run_failed",
        message: runResult.message || "vibe-git run failed.",
        cwd,
        hasChanges: true,
        entryFile: entry.relativeEntryPath,
        exitFile: entry.relativeExitPath,
        planGenerated: false,
        planExecuted: false,
        stdout: runResult.stdout,
        stderr: runResult.stderr
      };
    }

    if (!(await exists(entry.exitPath))) {
      return {
        success: false,
        status: "exit_file_not_found",
        message: `vibe-git run completed but expected exit file was not found: ${entry.relativeExitPath}`,
        cwd,
        hasChanges: true,
        entryFile: entry.relativeEntryPath,
        exitFile: entry.relativeExitPath,
        planGenerated: false,
        planExecuted: false,
        stdout: runResult.stdout,
        stderr: runResult.stderr
      };
    }

    const execFlag = input.createPullRequest ? "--auto-create-pr" : "--ignore-pr";
    const execResult = await runVibeGit(["exec", entry.exitFile, execFlag], cwd);

    return {
      success: execResult.success,
      status: execResult.success ? "completed" : "exec_failed",
      message: execResult.success
        ? "Delivery finalized through official vibe-git CLI."
        : execResult.message || "vibe-git exec failed.",
      cwd,
      hasChanges: true,
      entryFile: entry.relativeEntryPath,
      exitFile: entry.relativeExitPath,
      planGenerated: true,
      planExecuted: execResult.success,
      createPullRequest: Boolean(input.createPullRequest),
      execFlag,
      stdout: {
        run: runResult.stdout,
        exec: execResult.stdout
      },
      stderr: {
        run: runResult.stderr,
        exec: execResult.stderr
      }
    };
  } catch (error: any) {
    return {
      success: false,
      status: "error",
      message: error.message,
      cwd,
      hasChanges: null,
      planGenerated: false,
      planExecuted: false
    };
  }
}
