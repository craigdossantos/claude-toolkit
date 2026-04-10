# Claude Toolkit

A collection of reusable skills, agents, commands, hooks, and settings for [Claude Code](https://claude.com/claude-code).

Everything here is designed to be copied into your own `~/.claude/` or project `./.claude/` directory so Claude Code can use it.

---

## What is a skill?

If you're new to Claude Code, here's the one-minute version.

A **skill** is a folder with a `SKILL.md` file inside it. That file contains instructions written _for Claude_ — not for you. When Claude Code is running and detects that your request matches a skill (either by name, trigger phrase, or topic), it loads that skill's instructions into context and follows them.

Skills live in one of two places:

- `~/.claude/skills/<name>/` — **global**, available in every project
- `<your-project>/.claude/skills/<name>/` — **per-project**, only available when Claude is working in that directory

You don't _run_ a skill the way you run a script. You either:

1. **Describe what you want in plain English** — _"mock up a new pricing page"_ — and Claude auto-invokes the matching skill, or
2. **Name the skill explicitly** — _"use the ux-mockup skill to..."_ — when you want to force a specific one, or
3. **Use a slash command** — some skills expose themselves as `/skill-name` (e.g. `/handoff`, `/insight-harness`). Type `/` in Claude Code to see what's available.

After installing a skill, verify it's there by running `ls ~/.claude/skills` (for global) or `ls .claude/skills` (for project-local). Claude Code also loads skills at session start, so restart your conversation if you just installed one.

---

## Quick install

Clone the repo and use the installer:

```bash
git clone https://github.com/craigdossantos/claude-toolkit.git
cd claude-toolkit

./install.sh                                   # interactive menu
./install.sh --all                             # install everything into ./.claude
./install.sh --global --all                    # install everything into ~/.claude
./install.sh --skills ux-mockup qa-checklist   # install specific skills only
./install.sh --list                            # see what's available
```

The installer **copies files** into your target directory — it doesn't symlink, doesn't download anything else, and doesn't touch files outside the target. Read it before running if you want: [`install.sh`](./install.sh). To uninstall, delete the skill's directory under `.claude/skills/`.

### One-line install for insight-harness only

If you just want to try [`insight-harness`](./skills/insight-harness/README.md) without cloning:

```bash
mkdir -p ~/.claude/skills/insight-harness/scripts && \
curl -sL https://raw.githubusercontent.com/craigdossantos/claude-toolkit/main/skills/insight-harness/SKILL.md \
  -o ~/.claude/skills/insight-harness/SKILL.md && \
curl -sL https://raw.githubusercontent.com/craigdossantos/claude-toolkit/main/skills/insight-harness/scripts/extract.py \
  -o ~/.claude/skills/insight-harness/scripts/extract.py && \
open "$(python3 ~/.claude/skills/insight-harness/scripts/extract.py)"
```

---

## Skills

Each skill has its own README with screenshots, usage examples, and an install command. Start with any of these:

### Design & UX

| Skill                                                   | What it does                                                                                                                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`ux-mockup`](./skills/ux-mockup/README.md)             | Generate self-contained HTML mockups with per-section feedback textareas, version history, and mobile/desktop toggle. For iterating with stakeholders who don't use Figma. |
| [`frontend-design`](./skills/frontend-design/README.md) | Create distinctive, production-grade frontend interfaces that avoid generic AI aesthetics. For when you actually want the design to look like someone chose it.            |

### Testing & QA

| Skill                                                   | What it does                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [`qa-checklist`](./skills/qa-checklist/README.md)       | Generate an interactive manual-QA checklist as an HTML page after creating a PR. Pass/fail/skip buttons, feedback, clipboard export. |
| [`testing-webapps`](./skills/testing-webapps/README.md) | Router skill that picks the right tool for each testing scenario — Claude for Chrome (interactive) or Playwright (automated).        |

### Multi-agent thinking

| Skill                                                                 | What it does                                                                                                                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`consensus-brainstormer`](./skills/consensus-brainstormer/README.md) | Spawn 10 parallel agents with distinct cognitive framings (contrarian, pragmatist, risk analyst, etc.) and synthesize convergent recommendations + creative outliers. |
| [`debate-chamber`](./skills/debate-chamber/README.md)                 | 5 agents debate across 3 sequential rounds, seeing each other's responses. For when ideas need to collide and sharpen, not just be collected.                         |
| [`research-orchestrator`](./skills/research-orchestrator/README.md)   | Fan-out/fan-in research with 5 parallel Sonnet agents on 5 axes, synthesized by an Opus agent.                                                                        |

### Planning & documents

| Skill                                   | What it does                                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [`prd`](./skills/prd/README.md)         | Generate a Product Requirements Document through clarifying questions. Output is a clean markdown PRD ready for implementation.          |
| [`handoff`](./skills/handoff/README.md) | End-of-session ritual that writes `HANDOFF.md` and appends to `MEMORY.md`, in a background sub-agent so it doesn't pollute main context. |
| [`ralph`](./skills/ralph/README.md)     | Convert an existing PRD into the `prd.json` format used by the Ralph autonomous agent system.                                            |

### Reporting & setup

| Skill                                                       | What it does                                                                                                                                                          |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`html-report`](./skills/html-report/README.md)             | Convert research or analysis content into a polished NYTimes-editorial-style HTML page.                                                                               |
| [`video-course-site`](./skills/video-course-site/README.md) | Turn a folder of video files into a tabbed static site: transcribe locally with whisper.cpp → blog posts in the teacher's voice → single-page site.                   |
| [`insight-harness`](./skills/insight-harness/README.md)     | Superset of `/insights` — generates a comprehensive profile of your Claude Code harness (token usage, tool breakdowns, skill inventory, hooks) over the last 30 days. |
| [`init`](./skills/init/README.md)                           | Bootstrap a new project with frontend-design and skill-creation capabilities turned on.                                                                               |

### Meta / infrastructure

| Skill                                                 | What it does                                                                                                                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`skill-showcase`](./skills/skill-showcase/README.md) | Build a single-file public HTML showcase of a collection of skills — table of contents, category grouping, custom-vs-plugin badges, and PII scrubbing. For publishing skills without leaking personal info. |

### Agents, commands, hooks

_Coming soon._

---

## Directory structure

```
claude-toolkit/
├── install.sh          # Installer script
├── README.md           # You are here
├── skills/             # Claude Code skills (each with SKILL.md + README.md)
├── agents/             # Subagent definitions
├── commands/           # Slash commands
├── hooks/              # Pre/post tool hooks
├── settings/           # Settings presets
├── statusline/         # Custom statusline scripts
└── plugins/            # Full plugin bundles
```

Each skill folder contains:

- **`SKILL.md`** — the instructions Claude reads when the skill is invoked. Written for Claude, not for humans.
- **`README.md`** — the human-facing docs (what you're reading now is the repo-level one). Every skill has its own.
- **`assets/`** — screenshots, template HTML, or other static files the skill references.
- **`scripts/`** — helper scripts for skills that shell out (e.g. `video-course-site`, `insight-harness`).

---

## Adding your own skill

1. Create a directory under `skills/` with a `SKILL.md` using YAML frontmatter:

   ```markdown
   ---
   name: my-skill
   description: "What it does. When Claude should invoke it. Include trigger phrases."
   ---

   # My Skill

   Instructions Claude will follow when this skill is invoked...
   ```

2. (Recommended) Add a `README.md` alongside it for humans, following the pattern used by the skills listed above — hero image, "Use this when...", "What you say to Claude", "Install", "What you'll see".

3. Run `./install.sh --list` to verify your skill is detected, then `./install.sh --skills my-skill` to install it locally.

4. Open a PR.

---

## License

MIT
