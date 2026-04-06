# Claude Toolkit

Reusable skills, agents, commands, hooks, and settings for Claude Code.

## Quick Install

```bash
# Clone the repo
git clone https://github.com/craigdossantos/claude-toolkit.git
cd claude-toolkit

# Interactive install
./install.sh

# Or install everything to current project
./install.sh --all

# Or install globally (available in all projects)
./install.sh --global --all
```

## Available Components

### Skills

| Skill             | Description                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `insight-harness` | A superset of `/insights` — generates a comprehensive profile with token usage, tool breakdowns, skill inventory, hooks, and more. Upload to insightharness.com to share. |
| `init`            | Bootstrap new projects with frontend design and skill creation capabilities                                                                                               |
| `testing-webapps` | Test web apps with Claude for Chrome (visual/interactive) or Playwright (automated/CI)                                                                                    |
| `frontend-design` | Create distinctive, production-grade frontend interfaces that avoid generic AI aesthetics                                                                                 |

### Quick Install: Insight Harness

A superset of `/insights` — everything you get from `/insights` plus token usage, tool breakdowns, skill inventory, hooks, and more. Upload to [insightharness.com](https://insightharness.com) to share your profile:

```bash
mkdir -p ~/.claude/skills/insight-harness/scripts && \
curl -sL https://raw.githubusercontent.com/craigdossantos/claude-toolkit/main/skills/insight-harness/SKILL.md \
  -o ~/.claude/skills/insight-harness/SKILL.md && \
curl -sL https://raw.githubusercontent.com/craigdossantos/claude-toolkit/main/skills/insight-harness/scripts/extract.py \
  -o ~/.claude/skills/insight-harness/scripts/extract.py && \
open "$(python3 ~/.claude/skills/insight-harness/scripts/extract.py)"
```

This installs the skill and immediately generates your report. The report saves to `~/.claude/usage-data/insight-harness.html` (alongside the `/insights` report). After installing, you can also run it anytime in Claude Code with `/insight-harness`.

### Agents

_Coming soon_

### Commands

_Coming soon_

### Hooks

_Coming soon_

## Usage

### Install Specific Components

```bash
# Install specific skills
./install.sh --skills testing-webapps frontend-design

# Install all skills
./install.sh --skills

# Install to global ~/.claude
./install.sh --global --skills testing-webapps
```

### List Available Components

```bash
./install.sh --list
```

### Full Options

```
./install.sh                    Interactive menu
./install.sh --list             List available components
./install.sh --all              Install everything
./install.sh --global           Install to ~/.claude (global)
./install.sh --skills           Install all skills
./install.sh --skills NAME...   Install specific skills
./install.sh --agents           Install all agents
./install.sh --commands         Install all commands
./install.sh --hooks            Install all hooks
```

## Directory Structure

```
claude-toolkit/
├── install.sh          # Installer script
├── README.md
├── skills/             # Claude Code skills
│   ├── init/
│   │   └── SKILL.md
│   ├── testing-webapps/
│   │   ├── SKILL.md
│   │   ├── playwright-patterns.md
│   │   ├── ci-cd-integration.md
│   │   ├── test_template.py
│   │   └── with_server.py
│   └── frontend-design/
│       └── SKILL.md
├── agents/             # Subagent definitions
├── commands/           # Slash commands
├── hooks/              # Pre/post tool hooks
├── settings/           # Settings presets
└── plugins/            # Full plugin bundles
```

## Adding Your Own Components

### Skills

Create a directory in `skills/` with a `SKILL.md`:

```markdown
---
name: my-skill-name
description: "What it does. When to use it."
---

# My Skill

Instructions for Claude...
```

### Commands

Create a `.md` file in `commands/`:

```markdown
# /my-command

Instructions for what this command does...
```

### Hooks

Add Python or shell scripts to `hooks/`:

```python
#!/usr/bin/env python3
# hooks/my_hook.py
# Pre-tool hook that validates something
```

## Contributing

1. Add your component to the appropriate directory
2. Test with `./install.sh --list` to verify it's detected
3. Install and test in a project
4. Submit a PR

## License

MIT
