import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { finalizeDeliverySchema } from "../schemas/finalize-delivery.schema.js";
import { finalizeDeliveryWithVibeGitCli } from "../services/vibe-git-cli.service.js";
import { jsonText } from "../utils/response.js";

export function registerFinalizeDeliveryTool(server: McpServer) {
  server.tool(
    "vibe_git_finalize_delivery",
    "Finalize a completed coding task using the official vibe-git CLI. Use only when AGENTS.md explicitly allows automatic commit and push through vibe-git.",
    finalizeDeliverySchema,
    async input => {
      const result = await finalizeDeliveryWithVibeGitCli({
        cwd: input.cwd,
        branchName: input.branchName,
        baseBranch: input.baseBranch,
        taskSummary: input.taskSummary,
        branchDescription: input.branchDescription,
        entryName: input.entryName,
        exitName: input.exitName,
        createPullRequest: input.createPullRequest,
        requireCleanVibeGitWorkspace: input.requireCleanVibeGitWorkspace
      });

      return jsonText(result);
    }
  );
}
