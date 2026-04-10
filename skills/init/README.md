# init

> One-shot project bootstrap that wires up the frontend-design skill, the skill-creation tools, and an `/agent/` scaffold — a setup ritual, not an artifact generator.

**What this sets up:**

1. **Frontend-design skill enabled** for distinctive, production-grade UI work with a real aesthetic point of view
2. **Skill-creation tools wired up** so you can author project-specific skills in `.claude/skills/` without Googling the frontmatter
3. **`/agent/` scaffold** for the HANDOFF / MEMORY / WORKFLOWS pattern used by other toolkit skills
4. **Optional extras** — additional toolkit skills, hooks, project-specific slash commands, all offered interactively

## Use this when...

- You're **starting a new project** and want AI-powered dev tooling available from commit #1 instead of bolting it on later
- You just **cloned a repo that doesn't have `.claude/`** yet and want the standard setup applied in one step
- You want **frontend-design active by default** so "build me a landing page" produces real design, not generic AI slop
- You need the **`/agent/` directory pattern** (HANDOFF.md, MEMORY.md, WORKFLOWS.md) ready to go before your first session
- You're onboarding a teammate and want them running **the same setup you have**, not a guess-and-check approximation

## What you say to Claude

```
/init
```

Claude asks a few questions — _"What kind of project is this? Do you need frontend design capabilities? Do you want to create custom skills?"_ — and then enables the relevant skills, creates the `.claude/` directory structure, and tells you what was installed. Re-running `/init` later is safe and only adds new capabilities.

## Install

```bash
# From the claude-toolkit repo
./install.sh --skills init             # into current project
./install.sh --global --skills init    # into ~/.claude (all projects)
```

After install, `/init` is available as a slash command. Unlike most skills, init is rarely auto-invoked — it's deliberately a user-triggered ritual you run once at project start.

New to skills? See the [main README](../../README.md#what-is-a-skill) for a one-minute primer.

## What you'll see

Init is a **setup ritual with no artifact** — no file gets "generated" the way `prd` or `handoff` produce a markdown file. Instead:

- **`.claude/` directory** created with the requested skills wired in
- **`/agent/` scaffold** ready for the HANDOFF / MEMORY / WORKFLOWS pattern
- **Confirmation of what's enabled** — a short summary of skills active in this project
- **Recommended next steps** — "try `create a landing page for X`" or "run `/handoff` at the end of your session"

The goal is that after `/init`, you can immediately say _"build me the dashboard"_ or _"create a PRD for notifications"_ and everything just works.

## Why no hero image

Every other skill in the toolkit produces something visual you can screenshot — a mockup, a PRD, a QA checklist. Init produces a **project setup**, which is invisible by design. The whole point is that when you're done, nothing changed in the UI — you just have more tools available in the chat. A screenshot of an empty `.claude/` directory would be misleading.

## See also

- [`prd`](../prd/README.md) — the first thing to reach for after init when starting a new feature
- [`handoff`](../handoff/README.md) — pairs with init's `/agent/` scaffold to write the end-of-session snapshot
