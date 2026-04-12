---
name: skill-showcase
description: Build a single-file public HTML showcase of a collection of Claude Code skills — table of contents, grouped categories, per-skill README with hero image, custom-vs-plugin labeling, and PII scrubbing. Use when you want to share or publish an overview of your skills without exposing personal identifying information. Triggers on "showcase my skills", "build skill showcase", "skill gallery", "public skills page", "skill catalog", "portfolio of skills".
---

# Skill Showcase

Assemble a single self-contained HTML page that presents a collection of skill READMEs as a public-facing gallery. The output is static, offline-capable, and sanitized of personal identifying information — suitable for publishing, sharing as a portfolio, or embedding in documentation.

This skill **drafts human-facing READMEs in memory** for any skill that lacks one (see "Drafting READMEs" below) — the runtime skill folders are never modified. It does **not** generate hero images. Skills without an `assets/hero.png` still render cleanly, just without the hero panel; generate heroes separately with an image-gen skill if you want them.

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

3. **Draft READMEs for skills that lack one** — see "Drafting READMEs" below. A showcase built against a user's `~/.claude/skills/` often finds most skills have no public README (the SKILL.md is written for Claude, not humans). For each such skill, draft a README in memory, then pass the drafts to the build script via `--readme-overrides`. Skills that already have a README are left alone — the author's words win.

4. **Categorize** — group skills by the category hints in their READMEs or by user-provided grouping. Common categories: Design & UX, Testing & QA, Multi-agent thinking, Planning & documents, Reporting & setup, Meta / Infrastructure. If a skill doesn't fit, put it in "Uncategorized" and ask the user to confirm.

5. **Scrub PII** — scan README content and replace personal identifiers (see PII Scrubbing below).

6. **Assemble the HTML page** — use `assets/showcase-shell.html` as the structural template. The shell provides the sticky nav, table of contents, section layout, and styles. Inject rendered README content and hero images.

7. **Write output** — save to `~/.claude/showcase/skills-<YYYY-MM-DD>.html` by default. Never dump files into the user's current working directory. If the user is running this skill from an unrelated repo, we do not want to create `docs/showcase/` folders they didn't ask for. Only write to cwd when the user explicitly passes `--output <path>`.

8. **Open in browser** — run `open <path>` so the user can review.

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

## Drafting READMEs for skills that lack one

Most skills in `~/.claude/skills/` only have a `SKILL.md` — written for Claude, not humans. Rendered in the showcase raw, that content looks like technical instructions, not a description. To give third-party users a decent showcase without requiring them to author READMEs first, **draft a human-facing README from each skill's full SKILL.md in memory** before invoking the build script.

### When to draft

For each skill:

1. If `README.md` exists on disk → **use it as-is**, do not draft. The author's words always win.
2. If no `README.md` → draft one in memory from the full SKILL.md. Do **not** write it to the skill folder. The showcase should not modify the user's skills directory.

If the user passes `--no-draft-missing` (via a user-facing instruction like "don't generate READMEs, just show what's there"), skip drafting entirely and let those skills render with the "No public README yet" stub.

### What to use as input

Read the **entire** SKILL.md (frontmatter + body), not just the frontmatter. Frontmatter alone produces generic boilerplate. The SKILL.md body has the actual workflow, examples, rules, and tone that make for a useful README.

Also glance at the skill folder for grounding details:

- `scripts/` filenames — hint at what commands the skill runs
- `fixtures/` or `examples/` — source of example prompts
- Any sibling `*.md` files worth referencing

### Target style

Match the style of the existing well-authored READMEs in `~/Coding/claude-toolkit/skills/` (use one as a reference if accessible). The shape is:

```markdown
# <skill-id>

> One-sentence tagline — what the skill does and why it matters in one line.

## Use this when...

- Specific situation 1 where the skill applies (bold the keyword, explain the pain)
- Specific situation 2
- 3–5 bullets total; each names a concrete scenario

## What you say to Claude

\`\`\`
Example of a natural-language invocation that would trigger this skill.
Include a realistic constraint or input so the example feels grounded.
\`\`\`

Short paragraph explaining what happens next — which tools or sub-skills Claude runs, what output the user gets.

## What you get back

Description of the output artifact(s), with a specific, concrete example.
```

Optional sections if the SKILL.md supports them: **Install**, **Requirements**, **Limits**, **See also**.

### Rules

- **Length:** 40–80 lines of markdown. Shorter than SKILL.md (which is 150–300 lines). A README is a marketing distillation, not a re-paste.
- **Tagline voice:** active, specific, no hedging. Good: "Spawn 10 parallel agents with distinct framings and surface the Mode plus Outliers." Bad: "A flexible skill that can help you with various brainstorming tasks."
- **No generic filler:** never write "This powerful skill helps you..." or "Designed to be easy to use." If you can't say something specific, omit the section.
- **Preserve technical accuracy:** if SKILL.md says "runs 10 agents," the README says 10, not "several." If it mentions a specific API or tool, name it.
- **No fabrications:** if SKILL.md doesn't say how install works, don't invent an Install section.

### How to pass drafts to the build script

1. Build a JSON object `{ "<skill-id>": "<markdown text>", ... }` containing only the skills you drafted (skills with existing READMEs stay out of the map).
2. Write it to a temp file — e.g. `/tmp/skill-showcase-drafts-<timestamp>.json`.
3. Pass `--readme-overrides /tmp/skill-showcase-drafts-<timestamp>.json` to `build-showcase.js`.
4. The script fills in any skill whose `README.md` is missing with the draft text. Skills that already have a README ignore the override.

Example invocation:

```bash
node ~/.claude/skills/skill-showcase/scripts/build-showcase.js \
  --skills-dir ~/.claude/skills \
  --readme-overrides /tmp/skill-showcase-drafts.json
```

The script reports how many READMEs were drafted vs on-disk so the user knows the split.

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

- **One HTML file, truly portable** — all CSS inline, all JS inline, **hero images and README body images inlined as base64 data URIs by default**. The output is a single file a user can email, drop in Slack, or open from `file://` on a machine that has never seen the source skills. No sibling `skills/` folder required.
- **Image size cap** — any individual image larger than ~600 kB is skipped rather than inlined, so one giant screenshot in a README can't balloon the showcase past emailable size. Tell the user which images were skipped if any. Users who want oversize heroes can compress them or opt into the non-inlined mode.
- **No feedback UI** — this is read-only. No textareas, no copy buttons, no forms
- **No external CDNs except Google Fonts** — fonts via `<link>` in `<head>` are fine
- **Responsive** — legible at 375px mobile and comfortable at 1400px desktop
- **Accessible** — semantic HTML, sufficient color contrast, alt text on hero images

**When to use `--no-inline-images`:** the original use case was a repo-hosted showcase at `<repo>/docs/showcase/skills.html` sitting next to a `<repo>/skills/` tree. In that case, passing `--no-inline-images` alongside an explicit `--output` writes relative paths (`../../skills/<name>/assets/hero.png`) instead of data URIs, keeping the HTML small and letting the committed asset files serve the images. Only use this mode when the user is publishing a showcase into a repo they own.

## Invocation

A typical user request looks like:

```
Use skill-showcase to build a public page for all the custom skills in this repo.
```

Or with a specific target:

```
Build a skill showcase from ~/.claude/skills/ and write it to ./public/skills.html
```

Default target directory: `~/.claude/skills/` (the user's global skills collection). Default output path: `~/.claude/showcase/skills-<YYYY-MM-DD>.html`. Images are inlined as base64 data URIs by default so the output is one portable file.

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
