import { z } from "zod";

const branchNameSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(
    /^[a-zA-Z0-9._/-]+$/,
    "branchName may only contain letters, numbers, dots, underscores, slashes and hyphens"
  );

export const finalizeDeliverySchema = {
  cwd: z
    .string()
    .min(1)
    .describe("Absolute path to the Git repository root."),

  branchName: branchNameSchema
    .describe("Target branch name. This must come from AGENTS.md or explicit user instruction."),

  baseBranch: branchNameSchema
    .describe("Base branch for the Pull Request. This must come from AGENTS.md or explicit user instruction."),

  taskSummary: z
    .array(z.string().min(1).max(500))
    .min(1)
    .max(20)
    .describe("Objective bullet list describing what the agent changed."),

  branchDescription: z
    .string()
    .min(1)
    .max(500)
    .optional()
    .describe("One sentence describing the purpose of the branch."),

  entryName: z
    .string()
    .min(1)
    .max(160)
    .optional()
    .describe("Optional file name to create under vibe-git/entry."),

  exitName: z
    .string()
    .min(1)
    .max(160)
    .optional()
    .describe("Optional output plan name to generate under vibe-git/exit."),

  createPullRequest: z
    .boolean()
    .default(false)
    .describe("Whether vibe-git should create a Pull Request. When true, the MCP runs vibe-git exec with --auto-create-pr. When false, it runs with --ignore-pr."),

  requireCleanVibeGitWorkspace: z
    .boolean()
    .default(true)
    .describe("Whether to fail if generated entry or exit file already exists.")
};
