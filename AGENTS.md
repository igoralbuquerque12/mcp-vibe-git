# AGENTS.md

## Project Overview

This repository contains `@igoralbuquerque/vibe-git-mcp`, a small TypeScript
MCP server that exposes one tool for finalizing completed coding tasks through
the official `@igoralbuquerque/vibe-git` CLI.

Keep this adapter focused. Git operations, AI provider logic, prompt generation,
and `vibe-git init` belong to the upstream CLI, not this project.

## Stack

- Node.js 20+
- TypeScript with strict mode and ESM (`NodeNext`)
- Model Context Protocol SDK
- Zod for tool input validation

## Repository Map

- `src/index.ts`: MCP server entry point and server instructions
- `src/tools/`: public MCP tool registration
- `src/schemas/`: Zod input schemas and tool descriptions
- `src/services/`: integration with the official vibe-git CLI
- `src/utils/`: small shared helpers
- `dist/`: generated build output; do not edit manually

## Commands

```bash
npm install
npm run dev
npm run build
npm start
```

There is currently no automated test suite. At minimum, run `npm run build`
after code changes.

## Working Guidelines

- Read `README.md` and the relevant source files before changing behavior.
- Preserve the current small-module structure and existing naming style.
- Keep public tool descriptions, Zod schemas, and runtime behavior aligned.
- Use explicit types and preserve strict TypeScript compatibility.
- Keep changes narrowly scoped; do not add dependencies without a clear need.
- Do not edit generated files in `dist/` or dependencies in `node_modules/`.
- Never expose secrets, `.env` contents, tokens, or provider credentials.
- Do not overwrite unrelated working-tree changes.

## Completion Checklist

Before considering a task complete:

1. Confirm the implementation matches the requested behavior.
2. Run `npm run build`.
3. Review `git diff` for accidental or generated changes.
4. Update `README.md` when public behavior, installation, or requirements change.

## Delivery With vibe-git

Automatic commit, push, and Pull Request creation through the
`vibe_git_finalize_delivery` MCP tool is allowed only when the user explicitly
asks to finalize, publish, push, or create a Pull Request.

- Base branch: `main`
- Branch naming: `codex/<short-task-slug>`
- Create a Pull Request only when explicitly requested.
- Do not invoke vibe-git for ordinary implementation or verification work.
