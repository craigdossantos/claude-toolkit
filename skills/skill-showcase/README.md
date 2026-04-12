# skill-showcase

> Turn a folder of Claude Code skills into one portable HTML profile — README + hero image per skill, inlined as base64 so the file opens anywhere with no external assets.

![skill-showcase hero — generated showcase page showing hero, stats, and a categorized table of contents](assets/hero.png)

## Use this when...

- You want to **publish a portfolio** of skills you've built so other people can see what's possible with Claude Code
- You want a **single HTML file you can email, drop in Slack, or host anywhere** — no build step, no relative asset paths, opens from `file://` on a machine that has never seen the source skills
- You need to **share your skills externally without leaking personal info** — repo paths, GitHub username, real name, emails, and other identifiers are auto-scrubbed
- You want a **visual inventory** of what's installed in `~/.claude/skills/`, grouped into categories with custom/plugin badges
- Most of your skills have a **SKILL.md but no human-facing README** — the showcase drafts READMEs in memory from SKILL.md so the output looks like a portfolio, not a list of trigger instructions

## What you say to Claude

```
Build a skill showcase for my Claude Code skills.
```

Claude scans `~/.claude/skills/` (the default target — a third party running this against their own machine gets a profile of whatever they have installed), drafts human-facing READMEs for any skill that lacks one by reading its full SKILL.md, scrubs PII from the rendered content, and runs the build script. The output lands at `~/.claude/showcase/skills-<YYYY-MM-DD>.html` — user-level, never in your current working directory — and opens automatically.

For a custom location or title:

```
Build a skill showcase from ./skills and title it "My Workbench"
with output at ./public/workbench.html.
```

Images are embedded as base64 data URIs by default, capped at ~600 kB per image so one oversized screenshot doesn't balloon the showcase past emailable size. Pass `--no-inline-images` only when you're publishing into a repo that also contains the `skills/` tree and want relative image links instead.

## What you get back

- A **single self-contained HTML file** under 1 MB for most collections — opens offline, survives being emailed, has no CDN dependency except Google Fonts
- **Table of contents** grouped by category (Design & UX, Testing & QA, Multi-agent thinking, Planning & documents, Reporting & setup, Meta / infrastructure) with a custom/plugin badge next to each entry
- **One section per skill** with an anchor id, tagline blockquote, hero image if present, and rendered README body
- **Per-skill source link** (opt-in) via `--base-repo <url>` — every skill gets a `source →` link. Frontmatter `repo: none` on a specific skill opts it out.
- **A summary line** like `20 skills (20 custom, 0 plugin) • 7 categories • 619kB • 18 READMEs drafted from SKILL.md • ✓ PII check passed`
- **A terminal report** and `open <path>` so the output loads in your browser immediately

## Design constraints it enforces

- **One file, always.** No sibling images, no CSS folders, no copied assets — base64 data URIs keep it portable.
- **Never writes to your skill folders.** Drafted READMEs live in memory for the render pass only; your source skills are not modified.
- **PII scrubbing runs before every write.** Git name, username, GitHub owner, email, `/Users/<name>/` paths are replaced before render, with a final grep on the output that fails the build if anything leaked through. SVG hero/body images also get scrubbed in-memory before encoding, since the final text grep cannot see inside base64 payloads.
- **The PII grep cannot see into rasterized images.** PNG/JPG/WebP heroes or screenshots are encoded as opaque base64, so PII baked into the pixels (a visible username in a screenshot) or the file's metadata will not be caught. Review hero images manually before publishing, and regenerate any that contain identifying content.
- **Body images are sandboxed to the skill's `assets/` directory.** A README referencing `assets/../../.ssh/config` or any other path that escapes the skill folder is refused and reported in the skipped-images list — never inlined.
- **Skips skills with no SKILL.md** — the showcase enumerates valid skills, not arbitrary folders.

## Limits

- Hero images are optional and author-authored. If you don't have heroes, the showcase still renders — skills without heroes show the README content only. Generate heroes separately with an image-gen skill if you want them.
- README drafting works from SKILL.md; the more substantive your SKILL.md, the better the draft. A 20-line SKILL.md produces a thin README.
- The PII scrubber is a heuristic, not a guarantee. Review the output before publishing if your READMEs contain identifying content beyond common patterns.

## See also

- `scripts/build-showcase.js --self-test` — runs fixtures through the sanitize pipeline to verify newline preservation, fence-block preservation, and absence of PII leaks. Run after modifying the sanitizer.
