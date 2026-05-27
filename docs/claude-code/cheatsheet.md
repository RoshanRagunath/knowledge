---
sidebar_position: 1
title: Claude Code cheatsheet
description: The slash commands, file references and configuration patterns I reach for daily when working with Claude Code.
---

# Claude Code cheatsheet

The commands and patterns I actually use day to day. Not exhaustive -- just what earns its keep.

## Slash commands

| Command | What it does |
|---|---|
| `/clear` | Clear the conversation. Start fresh without restarting the CLI. |
| `/init` | Generate a `CLAUDE.md` for the current repo by scanning the codebase. |
| `/help` | Show available commands. |
| `/memory` | View and manage persistent memory. |
| `/config` | Open settings (theme, model, etc.). |
| `/loop <interval> <prompt>` | Run a prompt on a recurring interval (e.g. `/loop 5m /check-deploys`). |
| `/run` | Launch the project and verify a change works in the real app. |
| `/verify` | Run the code and observe behavior to confirm a fix. |
| `/security-review` | Security review of pending changes on the current branch. |
| `/review` | Review a pull request. |

## File references

- `@<path>` -- reference a file in your message (e.g. `@src/app.ts please explain`). Claude reads it directly instead of you pasting.
- `@<folder>/` -- reference a folder; useful when you want Claude to scan a small directory.

## Project configuration

| File | Purpose |
|---|---|
| `CLAUDE.md` | Project instructions checked into the repo. Loaded into every session. |
| `CLAUDE.local.md` | Local-only instructions, not checked in. Good for personal preferences and secrets-free overrides. |
| `.claude/settings.json` | Permissions, environment variables, hooks. Checked in. |
| `.claude/settings.local.json` | Same as above but local-only, gitignored. |
| `.claude/skills/<name>/SKILL.md` | A reusable workflow Claude can invoke. Built up as recurring patterns emerge. |
| `.claude/rules/*.md` | Auto-loaded instruction files (e.g. communication style, testing rules). |

## Permissions cheatsheet

In `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Edit(src/**)",
      "Write(docs/**)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force*)"
    ]
  }
}
```

Patterns use glob-style wildcards. `Bash(npm run *)` allows any `npm run` subcommand without prompting.

## Hooks (automated behaviors)

Settings.json hooks run shell commands on events (Stop, PreToolUse, PostToolUse, etc.). Use them when you need a behavior to fire deterministically -- memory and CLAUDE.md instructions are advisory, hooks are not.

```json
{
  "hooks": {
    "Stop": [
      {"matcher": "", "hooks": [{"type": "command", "command": "notify-send 'Claude done'"}]}
    ]
  }
}
```

## Plan mode

Useful when the change is non-trivial. Claude explores, writes a plan to a file, asks clarifying questions and waits for approval before touching code.

- Toggle: `shift+tab` (or whatever your keybind is set to)
- Plan file lives at `~/.claude/plans/<slug>.md`
- Exit plan mode = approval to start coding

## Subagents

Spawn specialized agents for parallel or isolated work:

- `Explore` -- fast read-only search, returns excerpts. Good for "where is X defined."
- `Plan` -- software-architect-style implementation planning.
- `general-purpose` -- broad multi-step work.

Custom agents go in `.claude/agents/<name>.md` with a `description` field. Trigger by description match or via `Agent(subagent_type: "<name>")`.

## Memory

Memory persists across conversations and lives outside the project:

```
~/.claude/projects/<encoded-cwd>/memory/
  MEMORY.md          ← index, always loaded
  user_role.md       ← who you are
  feedback_*.md      ← how you like to work
  project_*.md       ← project context
```

Trigger phrases:
- "remember that I always want X" -- saves a feedback memory
- "forget that" -- finds and removes the relevant entry

## Useful Bash patterns

```bash
# Resume a previous session
claude --continue

# Run a one-off prompt non-interactively
claude --print "show git status and summarize"

# Use a specific model
claude --model claude-sonnet-4-6
```

## Tips that compound

- **Start with `/init`** on a new repo. Generated `CLAUDE.md` is a solid baseline.
- **Use plan mode for anything non-trivial.** Cheap insurance.
- **Build skills the second time you do something**, not the first. Speculative skills go stale.
- **Permissions allowlist > confirming every command.** Lower friction = you actually use the tool.
- **Trust but verify subagent output.** Their summaries describe intent, not results.
