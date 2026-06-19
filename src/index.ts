#!/usr/bin/env node

import { config as loadDotEnv } from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerFinalizeDeliveryTool } from "./tools/finalize-delivery.tool.js";

loadDotEnv({ quiet: true });

const server = new McpServer(
  {
    name: "vibe-git-mcp",
    version: "0.2.0",
    description: "Finalize completed coding tasks through the official vibe-git CLI."
  },
  {
    instructions: `
Use this MCP server only to finalize completed coding tasks through vibe-git.

This server exposes one tool: vibe_git_finalize_delivery.

Before using it, the agent must read AGENTS.md and confirm that automatic commit, push and Pull Request creation through vibe-git is allowed.

The target project must already have been initialized manually with vibe-git init.

Do not use this server for arbitrary Git commands.
Do not call this server when the user did not authorize automatic delivery.
`.trim()
  }
);

registerFinalizeDeliveryTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);
