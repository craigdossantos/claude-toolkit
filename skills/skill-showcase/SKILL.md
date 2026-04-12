---
name: skill-showcase
description: Build a single-file public HTML showcase of a collection of Claude Code skills — table of contents, grouped categories, per-skill README with hero image, custom-vs-plugin labeling, and PII scrubbing. Use when you want to share or publish an overview of your skills without exposing personal identifying information. Triggers on "showcase my skills", "build skill showcase", "skill gallery", "public skills page", "skill catalog", "portfolio of skills".
---

# Skill Showcase

Assemble a single self-contained HTML page that presents a collection of skill READMEs as a public-facing gallery. The output is static, offline-capable, and sanitized of personal identifying information — suitable for publishing, sharing as a portfolio, or embedding in documentation.

This skill does **not** generate README content or screenshots. It assumes each skill already has a `README.md` and (optionally) an `assets/hero.png` or `assets/hero.jpg`. If READMEs don't exist yet, tell the user to create them first.

## Workflow

1. **Identify the target skills directory** — usually one of:
   - A repo's `skills/` folder (default when invoked inside a toolkit-style repo)
   - `~/.claude/skills/` (global user skills)
   - `~/.claude/plugins/cache/*/skills/` (plugin skills)
   - Any directory the user specifies

2. **Enumerate skills** — for each subdirectory that contains a `SKILL.md`:
   - Read the `SKILL.md` frontmatter (name, description, version, source if present)
   - Read `README.md` if it exists
   - Check for `assets/hero.png` or `assets/hero.jpg`
   - Classify as **custom** or **plugin** based on path (see below)

3. **Categorize** — group skills by the category hints in their READMEs or by user-provided grouping. Common categories: Design & UX, Testing & QA, Multi-agent thinking, Planning & documents, Reporting & setup, Meta / Infrastructure. If a skill doesn't fit, put it in "Uncategorized" and ask the user to confirm.

4. **Scrub PII** — scan README content and replace personal identifiers (see PII Scrubbing below).

5. **Assemble the HTML page** — use `assets/showcase-shell.html` as the structural template. The shell provides the sticky nav, table of contents, section layout, and styles. Inject rendered README content and hero images.

6. **Write output** — save to `docs/showcase/skills.html` by default (or a user-specified path).

7. **Open in browser** — run `open <path>` so the user can review.

## Custom vs plugin classification

Mark a skill as **plugin** if its path contains any of:

- `/plugins/cache/`
- `/plugins/installed/`
- `/.claude/plugins/`

Otherwise mark it as **custom** (user-authored or repo-local).

Show the distinction in the showcase: custom skills get a `● Custom` badge, plugin skills get a `◆ Plugin` badge with the plugin name if determinable (from the parent directory name in the plugins cache).

If a skill's `SKILL.md` frontmatter has an explicit `source:` or `origin:` field, honor that over the path-based classification.

## PII scrubbing

The showcase is intended for public sharing. Before rendering each README, apply these substitutions in memory (do NOT modify the original files):

| Pattern                                                                                     | Replacement                                                     |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `github.com/<username>/` (when username matches `git config user.name` or repo owner)       | `github.com/<your-username>/`                                   |
| `raw.githubusercontent.com/<username>/`                                                     | `raw.githubusercontent.com/<your-username>/`                    |
| `/Users/<username>/`                                                                        | `~/`                                                            |
| `/home/<username>/`                                                                         | `~/`                                                            |
| First name or full name of the current user (from `git config user.name` or `~/.gitconfig`) | Remove or replace with a neutral pronoun                        |
| Real email addresses                                                                        | `<your-email>`                                                  |
| Company/employer name (if obvious from repo or user context)                                | `<your-company>`                                                |
| Specific project names in sample content that look personal                                 | leave alone unless clearly identifying — ask the user if unsure |

Also inspect hero image filenames and paths. **Do not OCR-scrub hero images** — the skill cannot edit rasterized pixels. Instead, when a skill has a known-PII hero (detected by scanning the skill's sample HTML source if one exists), warn the user and suggest regenerating that specific hero before running the showcase.

Before writing the final HTML, do a sanity grep of the assembled output for the detected identifiers and warn if any slipped through.

## Table of contents

The showcase page has a two-level TOC at the top:

1. **Category headings** (e.g. "Design & UX", "Testing & QA")
2. **Skill entries** under each category, each with:
   - Skill name (linked to its anchor)
   - One-line tagline from the README's blockquote (if present) or from SKILL.md `description`
   - Custom/Plugin badge

The TOC is sticky-optional — stays visible at the top of the page but scrolls away naturally. It is NOT duplicated in a side rail. A side rail adds complexity for marginal navigation value on a single-page doc.

## Section structure per skill

Each skill gets one section with:

- **Anchor id** matching its skill name (`id="ux-mockup"`)
- **Skill name** as H2
- **Custom/Plugin badge** next to the name
- **Tagline** as an italicized blockquote under the heading
- **Hero image** (if present) — max-width the column
- **Rendered README body** — the full README minus the H1 and tagline (those are already shown above), with markdown converted to clean HTML
- **Section divider** at the end

Skills with no README get a minimal card: name, badge, tagline from SKILL.md description, and a muted "No public README yet" note. Still include them — the showcase is an inventory.

## Design constraints for the output page

- **One HTML file**, all CSS inline, all JS inline, no build step, works offline when opened from `file://`
- **No feedback UI** — this is read-only. No textareas, no copy buttons, no forms
- **No external CDNs except Google Fonts** — fonts via `<link>` in `<head>` are fine
- **Responsive** — legible at 375px mobile and comfortable at 1400px desktop
- **Images referenced by relative path** — from `docs/showcase/skills.html`, hero images are at `../../skills/<name>/assets/hero.png`. Do not inline as data URIs (bloats file, slows load)
- **Accessible** — semantic HTML, sufficient color contrast, alt text on hero images

## Invocation

A typical user request looks like:

```
Use skill-showcase to build a public page for all the custom skills in this repo.
```

Or with a specific target:

```
Build a skill showcase from ~/.claude/skills/ and write it to ./public/skills.html
```

Default target directory: `./skills/` relative to the current working directory. Default output path: `docs/showcase/skills.html`.

After building, always run `open <output-path>` so the user can review.

## Linking to the public source (opt-in)

Skills can optionally link to their public source repository. This is **opt-in** — nothing is linked unless the user explicitly provides a base URL or sets frontmatter.

Precedence, highest first:

1. **Frontmatter `repo: none`** or **`repo: private`** in a skill's `SKILL.md` → no link, even if `--base-repo` is set. Use this to exclude a specific skill from public linking.
2. **Frontmatter `repo: <full-url>`** → link to that URL verbatim. Use this when a skill's source lives outside the current repo.
3. **`--base-repo <url>`** CLI flag → each skill gets a link to `<base-repo>/<skill-id>`. This is the common case when all skills live in one public repo.
4. **Neither** → no link rendered anywhere.

Example:

```bash
node scripts/build-showcase.js \
  --skills-dir ./skills \
  --output ./docs/showcase/skills.html \
  --base-repo https://github.com/myuser/claude-toolkit/tree/main/skills
```

With that flag, every skill in the showcase gets a small `source →` link next to its badge, pointing to `github.com/myuser/claude-toolkit/tree/main/skills/<skill-id>`. Skills that set `repo: none` in their frontmatter are skipped.

**Important:** the `--base-repo` URL is **not scrubbed**. The sanitizer protects against accidental leaks in README content; passing a `--base-repo` flag is an intentional opt-in to expose that URL. If you pass a URL containing your GitHub username, it will appear in the output. That's by design — for users who want to share their work, the repo URL is the payoff.

## The build script

A reference implementation lives at `scripts/build-showcase.js`. It uses `marked` for markdown rendering and reads the shell template from `assets/showcase-shell.html`. The script is an example — you can reimplement the logic inline if preferred, but the shell template must be followed so all showcases have consistent visual identity.

To run the reference script:

```bash
node skills/skill-showcase/scripts/build-showcase.js \
  --skills-dir ./skills \
  --output ./docs/showcase/skills.html
```

Install `marked` first if it's not available:

```bash
npm install marked
```

## Self-test — run before publishing

The script ships with a `--self-test` flag that runs fixtures from `skills/skill-showcase/fixtures/` through the full sanitize → marked pipeline and asserts three invariants:

1. **Newline preservation** — `sanitize()` must not change the count of `\n` characters in its input. No replacement regex is allowed to touch newlines.
2. **Fenced-block preservation** — the count of ` ``` ` fence lines must be unchanged after sanitization.
3. **No PII leaks** — the fixtures embed synthetic canary identifiers (`somefakeowner`, `Some Fake User`, `/Users/somefakeuser`, `somefakeuser@example.test`) and the rendered HTML must contain none of them.

Run it:

```bash
node skills/skill-showcase/scripts/build-showcase.js --self-test
```

You should run this:

- **Before publishing a showcase for the first time** — confirms the pipeline is sound on your machine
- **After modifying `sanitize()` or the replacements list** — proves your changes didn't introduce a regression
- **In CI**, if you're adding this skill to a maintained toolkit

The self-test exits with code `0` on success, code `2` on any failure. It prints per-fixture results and the specific invariant that failed.

## Known pitfalls when modifying the sanitizer

The sanitize pass runs on **raw markdown text**, not parsed HTML. This is fast and simple but has one sharp edge worth understanding:

**Never use `\s` in a replacement regex unless you specifically want to match newlines and tabs.** `\s` matches `[ \t\n\r\f\v]` — it will happily eat the newlines inside a fenced code block and collapse a multi-line command into a single line, which marked then renders as an inline fragment with broken structure. Use literal space classes like `[ ]+` or ` {2,}` when you mean "runs of spaces."

This is the exact bug that shipped in v0 of this skill. The newline-preservation invariant in `sanitize()` catches it and throws `SanitizeError` on violation, so the bug cannot regress silently. If you're adding a new replacement pattern, think about whether it could ever match a newline. If the answer is "no, by construction" you're fine. If the answer is "well, technically…" you're about to break something.

Other pitfalls for anyone extending the transform:

- **Replacements that touch backticks** — a regex that matches ` ``` ` will damage fence lines. The second invariant (fence-line count) catches this.
- **Replacements inside URLs** — the PII detector finds GitHub owners via regex scanning. If a legitimate URL happens to contain a string that looks like a username, the replacement will fire. For now this is acceptable because `<your-username>` is a valid placeholder, but if you extend the detector to match other patterns, be specific.
- **HTML inside markdown** — marked allows raw HTML. The sanitizer runs before markdown parsing, so it could theoretically modify HTML attributes. In practice our replacements only match plain text patterns, but don't add a regex that modifies `href="..."` attributes without thinking about whether it could also match visible prose.

If you add a new pattern to the replacement list, **add a corresponding fixture entry to `fixtures/pii-scrubbing/README.md`** and a canary string to the `--self-test` canary list in `runSelfTest()`. That closes the loop: the pattern is tested, the canary verifies it, and the next contributor inherits the guardrail.

## Key rules

- **One file, always** — the output is a single HTML file. Never multi-page.
- **Read-only** — no feedback, no forms, no state. Pure presentation.
- **Sanitize before writing** — never write PII to the output file. Grep the final HTML for known identifiers and fail loudly if anything slipped through.
- **Run `--self-test` after touching the sanitizer** — the invariants exist because the bug they catch is easy to reintroduce.
- **Skip skills without SKILL.md** — the showcase enumerates valid skills, not arbitrary folders.
- **Preserve the shell** — do not rewrite `assets/showcase-shell.html` per invocation; it's a stable template.
- **Open after writing** — always `open <path>` so the user sees the result.
