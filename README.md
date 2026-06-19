# vibe-git-mcp

MCP adapter for finalizing completed coding tasks through the official
`@igoralbuquerque/vibe-git` CLI.

This package does not contain vibe-git's implementation. It depends on the
official `@igoralbuquerque/vibe-git` package and executes its installed CLI.

## Tool

The server exposes one public tool:

```txt
vibe_git_finalize_delivery
```

## What It Does

- Validates the target project and checks for Git changes.
- Requires the target project to have been initialized manually with `vibe-git init`.
- Creates one delivery entry JSON file under `vibe-git/entry`.
- Runs the installed official `vibe-git run <entry-file>` CLI.
- Finds the generated plan under `vibe-git/exit`.
- Runs the installed official `vibe-git exec <exit-file>` CLI with `--auto-create-pr`
  when `createPullRequest=true`, or `--ignore-pr` when it is false.

## What It Does Not Do

- It does not implement Git or AI provider logic.
- It does not generate prompts.
- It does not create commits or push directly.
- It does not call GitHub directly.
- It does not run `vibe-git init` or create its project structure.

## Installation

```bash
codex mcp add vibe-git -- npx -y @igoralbuquerque/vibe-git-mcp
```

## Requirements

The target project must already have:

- Git initialized with pending changes
- `vibe-git init` executed manually
- `vibe-git.config.json`
- `vibe-git/entry`
- `vibe-git/exit`
- `.env` with the configured AI provider key
- `GITHUB_TOKEN` if `createPullRequest=true`
- `AGENTS.md` authorizing automatic delivery through vibe-git

## Configure AGENTS.md

Installing the MCP server makes the tool available to Codex, but each project
must explicitly describe when automatic delivery is authorized. Add the
appropriate block below to the project's `AGENTS.md` and adapt its commands and
branch conventions to the repository.

### Português

Copie o trecho abaixo para o `AGENTS.md` do projeto. Personalize o comando de
validação e as convenções de branch conforme o repositório.

```md
## Finalização via MCP vibe-git

Quando a tarefa estiver concluída, validada e com `npm test` passando, e houver
autorização explícita para subir as alterações, finalize usando exclusivamente
a tool MCP `vibe_git_finalize_delivery`.

A tool deve ser chamada com:

- `cwd`: caminho absoluto da raiz deste repositório;
- `baseBranch`: valor definido em `PRs.prBase` dentro de
  `vibe-git.config.json`; se o campo não existir ou estiver vazio, use `main`;
- `branchName`: nome passado pelo usuário ou, caso contrário, crie um nome
  curto e descritivo seguindo o tipo da tarefa;
- `taskSummary`: lista objetiva com o que foi implementado, validado e
  documentado;
- `createPullRequest`: `true` quando a entrega deve abrir PR, ou `false` quando
  deve apenas executar commit/push sem PR. Por padrão, sempre use `true` para
  criar PRs, a menos que o usuário avise o contrário na tarefa;
- `requireCleanVibeGitWorkspace`: `true`.
```

> [!WARNING]
> Personalize a branch padrão com uma branch existente neste repositório, como
> `staging` ou `main`. Caso o número da OS não seja informado durante a tarefa,
> a IA usará a convenção de branch padrão descrita acima.

### English

Copy the following block into the project's `AGENTS.md`. Customize the
validation command and branch conventions for the repository.

```md
## Finalization through the vibe-git MCP

When the task is complete and validated, `npm test` is passing, and there is
explicit authorization to publish the changes, finalize it exclusively through
the `vibe_git_finalize_delivery` MCP tool.

Call the tool with:

- `cwd`: absolute path to this repository's root;
- `baseBranch`: the value of `PRs.prBase` in `vibe-git.config.json`; if the
  field does not exist or is empty, use `main`;
- `branchName`: the name provided by the user or, otherwise, a short,
  descriptive name based on the task type;
- `taskSummary`: an objective list of what was implemented, validated, and
  documented;
- `createPullRequest`: `true` when the delivery should open a PR, or `false`
  when it should only commit and push without a PR. Use `true` by default unless
  the user states otherwise in the task;
- `requireCleanVibeGitWorkspace`: `true`.
```

> [!WARNING]
> Customize the default branch with a branch that exists in this repository,
> such as `staging` or `main`. If the OS number is not provided during the task,
> the AI will use the default branch convention described above.
