---
sidebar_position: 2
title: Embedding Claude Code and Codex in the same workspace
description: Running Claude Code and OpenAI Codex CLI side by side on the same project -- setup, isolation, and avoiding stepping on each other.
draft: false
---

# Embedding Claude Code and Codex in the same workspace

> **Status**: Work in progress. Notes from my own experiments -- expect revisions.

Both Claude Code (Anthropic) and OpenAI Codex CLI are useful AI coding tools, and they're not mutually exclusive. This is a working doc on running them side by side in the same project directory.

## Why both

- **Different model strengths**. Sometimes one nails a problem the other muddles.
- **Different ecosystems**. Codex integrates with OpenAI Agents SDK; Claude Code has the Agent SDK and a richer skills/memory system.
- **Diversification**. If one platform has an outage or limit hit, the other keeps you working.

## Installation

Both are installed independently:

```bash
# Claude Code
npm install -g @anthropic-ai/claude-code

# OpenAI Codex CLI
npm install -g @openai/codex
```

Each has its own auth flow and config directory:

| Tool | Config dir |
|---|---|
| Claude Code | `~/.claude/` |
| Codex | `~/.codex/` |

No conflicts at the system level.

## Pointing both at the same project

Just open two terminals in the project folder:

```bash
# Terminal 1
cd ~/code/myproject && claude

# Terminal 2
cd ~/code/myproject && codex
```

Both read and write the same files. The conflict surface is the **filesystem**, not the tools themselves.

## Avoiding stepping on each other

The real risk is both tools editing the same file in the same session and one overwriting the other's work. A few patterns:

- **Single-active-tool rule**. Only one tool actively makes edits at a time. Use the other for read-only Q&A.
- **Git as the reconciliation layer**. Commit frequently. If both tools touch overlapping code, you see the conflict on the next commit.
- **Different branches per tool**. Spin up worktrees: `claude` on `feature/x-claude`, `codex` on `feature/x-codex`. Compare and merge manually.

## Configuration files: separate or shared?

`CLAUDE.md` is read by Claude Code. Codex looks for `AGENTS.md` or `.codex/instructions.md`.

You can either:

1. **Keep them separate**. Different files, different audiences (each tool gets its own personality).
2. **Symlink one to the other** (or a shared `AGENTS.md` that both reference). Single source of truth, but you lose tool-specific instructions.

I'm currently running them separate, with about 80% content overlap that I copy-paste when something general changes. Not ideal -- looking for a better pattern.

## Open questions (things I haven't figured out yet)

- Best workflow for handing off context between the two tools mid-task.
- Whether to share or isolate session memory (Claude Code has explicit memory; Codex has more session-local state).
- How to make MCP servers configured for one available to the other.

If you've solved any of these, [open an issue or PR](https://github.com/Roshiejj95/knowledge) -- I'll update this page.
