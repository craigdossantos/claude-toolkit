# testing-webapps

> Route web-app testing to the right tool — Claude for Chrome when judgment matters, Playwright when you need deterministic assertions.

| Scenario                | Tool       | Why                    |
| ----------------------- | ---------- | ---------------------- |
| "Does this look right?" | Chrome     | Visual judgment needed |
| "Check console errors"  | Chrome     | Live debugging         |
| "Why is this broken?"   | Chrome     | Interactive debugging  |
| "Compare to Figma"      | Chrome     | Visual comparison      |
| "Run on every PR"       | Playwright | CI/CD integration      |
| "Test Safari + Firefox" | Playwright | Cross-browser          |
| "Performance testing"   | Playwright | Precise measurements   |

## Use this when...

- You're testing a UI change and **aren't sure whether to click around in Chrome or write a Playwright script** — the table above picks for you
- You need to **visually verify** something ("does this match Figma?", "does the modal feel right?") and want Claude driving a real browser
- You just fixed a bug and want to **lock it in with a regression test** before merging
- You need **cross-browser or headless CI testing** and don't want to reinvent the Playwright setup
- A Playwright test is **failing mysteriously** and you want Claude to jump into Chrome to debug it interactively

## What you say to Claude

```
Test the checkout flow on localhost:3000.
Start in Chrome so I can see it work, then codify the
happy path as a Playwright test I can run in CI.
```

Claude starts in Chrome (visual pass, console check, exploratory clicks), confirms the flow works, then writes a Playwright script using the ready-to-use `test_template.py` and `with_server.py` helpers in the skill. You run it locally, drop it into CI, and the bug can never come back silently.

## Install

```bash
# From the claude-toolkit repo
./install.sh --skills testing-webapps             # into current project
./install.sh --global --skills testing-webapps    # into ~/.claude (all projects)
```

After install, Claude invokes this skill automatically when you mention testing a webapp, checking UI, debugging a page, or writing browser tests. You can also trigger it explicitly with _"use the testing-webapps skill to..."_.

New to skills? See the [main README](../../README.md#what-is-a-skill) for a one-minute primer.

## What you'll see

- **A tool choice, not a tool lecture** — Claude picks Chrome or Playwright based on the scenario and tells you why in one line
- **Chrome sessions** for visual verification, console inspection, and exploratory testing where human judgment matters
- **Playwright scripts** using the bundled `test_template.py` and `with_server.py` (starts a dev server, runs tests, cleans up) for repeatable assertions
- **A build → test → codify → debug loop** — Chrome to discover, Playwright to lock in, Chrome again when tests fail unexpectedly
- **Reference docs bundled** — [playwright-patterns.md](playwright-patterns.md) for auth/forms/mocking and [ci-cd-integration.md](ci-cd-integration.md) for GitHub Actions setup

## See also

- [`manual-qa-collab`](../manual-qa-collab/README.md) — collaborative step-by-step QA walkthroughs when you want a human in the loop per step
- [`qa-checklist`](../qa-checklist/README.md) — generate a post-PR manual QA checklist when automated tests can't cover everything
