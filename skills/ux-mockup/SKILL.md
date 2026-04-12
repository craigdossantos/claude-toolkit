---
name: ux-mockup
description: Create interactive HTML mockups for UX design review with built-in feedback collection, version history, viewport toggle (mobile/desktop), and clipboard export. Supports two modes — (1) from-scratch mockups for new designs, and (2) live-capture mockups that embed the actual existing site UI and iterate on it. Use when designing UI flows, page layouts, or component states that need visual review and iterative feedback. Triggers on "mockup", "UX design", "design review", "visual design", "UI mockup", "mock up the flow", "show me what it looks like", "mockup changes to the live site", "iterate on the existing page", "redesign this page", or any request to create visual designs for review before implementation.
---

# UX Mockup

Create self-contained HTML mockup pages for iterative UX design review. The mockup includes per-section feedback textareas, version history navigation, mobile/desktop viewport toggle, and one-click JSON clipboard export.

Supports two modes:

- **From scratch** — design new pages/components with no existing reference
- **Live capture** — start from the actual existing site UI and iterate on it

## Workflow

1. **Understand scope** — identify what states, pages, or components to mock up
2. **Determine mode** — from-scratch or live-capture (see below)
3. **Generate mockup** — create a single HTML file using the shell template
4. **Open in browser** — `open <path>` so the user can review
5. **Collect feedback** — user fills in feedback textareas and copies JSON to clipboard
6. **Iterate in place** — update the same file, wrapping old content as a prior version
7. **Repeat** until approved

## Live Capture Mode

Use this mode when reviewing an existing live site or local dev server page. **The goal is pixel-perfect reproduction of the actual site UI, not an approximation.**

### Critical rule: use the real UI

**NEVER re-create or approximate an existing site's UI.** The whole point of live-capture is that the user sees exactly what their users see. A hand-drawn mockup that looks "similar" defeats the purpose.

### Live capture strategies (in priority order)

#### Strategy 1: iframe embedding (preferred for live/staging URLs)

Embed the actual page in an iframe. This gives 100% fidelity with zero reconstruction effort:

```html
<div class="iframe-frame">
  <iframe src="https://example.com/page" style="height:800px"></iframe>
</div>
```

The `.iframe-frame` wrapper responds to the viewport toggle — mobile view constrains it to 375px with device chrome, desktop shows full width.

**When to use:** When the page is publicly accessible (production, staging, or user can run `npm run dev` on localhost).

**Limitations:** Cross-origin restrictions may block some interactions. The user cannot modify the iframe content for iteration. Use this for the "current state" v1, then switch to inline HTML for v2+ iterations.

#### Strategy 2: inline verbatim HTML (preferred for auth-protected or dynamic pages)

Use this when iframes won't work — auth-protected pages (dashboard, admin), dynamic pages that need a specific slug/ID, or pages with third-party auth (Google OAuth buttons that won't function in iframes).

When working within a project repo, extract the **actual rendered HTML and CSS** and inline it:

1. Read the page's component source files and the project's CSS/Tailwind config
2. Build the section using the **exact same HTML structure, class names, and styles** from source
3. Include all project CSS — either inline the relevant Tailwind output or include `<style>` blocks with the project's design tokens and utility classes
4. Populate with **realistic sample data** — real-looking names, counts, statuses — not lorem ipsum or empty states (unless reviewing the empty state specifically)
5. For pages with multiple states (e.g. draft vs active), show the most representative state with design-note callouts explaining other states

**The output should be indistinguishable from the live site at a glance.** This means:

- Use the project's actual fonts (include Google Fonts `<link>` tags)
- Use the project's exact color values from CSS/Tailwind config
- Replicate the exact component hierarchy and class structure
- Match spacing, border-radius, shadows, and typography exactly

**When to choose Strategy 2 over Strategy 1:**

- Page requires authentication (login redirects in iframe)
- Page requires dynamic data (project IDs, slugs) that the reviewer may not have
- Third-party auth buttons (Google, GitHub) that break in iframe sandboxing
- Mockup needs to be shareable via a static URL (no login required to view)

#### Strategy 3: WebFetch + reconstruction

When no codebase access exists:

1. Use `WebFetch` to retrieve the full page HTML
2. Extract the complete `<style>` blocks, `<link>` tags, and inline styles
3. Preserve the exact DOM structure — do not simplify, rearrange, or "clean up" the HTML
4. Convert relative URLs to absolute URLs
5. Include CDN fonts via `<link>` in the mockup `<head>`

#### When all strategies fail

- **Ask the user** to paste rendered HTML from DevTools (right-click → Copy → Copy outerHTML)
- **Ask for a screenshot** and reconstruct manually (this is the only case where approximation is acceptable — and must be clearly labeled as such)

### Labeling live-captured content

v1 of a live-captured section always gets this callout:

```html
<div class="design-note info">
  <strong>Source:</strong> Captured from <code>{{URL_OR_SOURCE}}</code> — this
  is the current live state.
</div>
```

If forced to approximate (e.g. from a screenshot), use a warning callout instead:

```html
<div class="design-note">
  <strong>Warning:</strong> Approximated from screenshot — not pixel-perfect.
  Verify against live site.
</div>
```

## Viewport Toggle

The mockup shell includes a **Mobile / Desktop** toggle in the sticky nav bar:

- **Desktop** (default) — sections use full width (900px / 1200px for `.wide`)
- **Mobile** — sections constrain to 600px, iframe frames show at 375px with device chrome

The toggle:

- Adds `viewport-mobile` or `viewport-desktop` class to `<body>`
- Automatically constrains `.iframe-frame` elements to mobile width
- Includes the current viewport in the exported feedback JSON

### Designing for both viewports

When creating mockup sections, ensure content works at both widths:

- Use responsive CSS within version content (flex-wrap, max-width, etc.)
- For iframe embeds, the responsive behavior comes from the site itself
- For inline HTML, replicate the project's responsive breakpoints

## Journey States

Pages often have multiple states. Use the version nav (prev/next) to let reviewers flip between them. But don't show every possible permutation — focus on the **journey states** a user passes through:

1. **Entry** (v1, always) — what the user sees when they first arrive. This is the most important state and must always be version 1.
2. **Primary action** — the page doing its main job (e.g. actively recording, form half-filled)
3. **Completion** — what success looks like (e.g. all prompts recorded, order confirmed)
4. **Error/empty** — only include if there's a specific UX concern worth reviewing (e.g. empty dashboard for onboarding flow)

### How many states per page?

| Page type          | Typical states | Example                                            |
| ------------------ | -------------- | -------------------------------------------------- |
| Static/info page   | 1              | Homepage, about, pricing                           |
| Form/single action | 1–2            | Create page, sign-in                               |
| Multi-step flow    | 2–4            | Contributor recording (entry → recording → finish) |
| Data display       | 1–2            | Dashboard (populated, maybe empty)                 |
| Playback/viewer    | 1              | Gift page                                          |

Most pages need just 1 state. Multi-step flows are the exception.

### Label each state clearly

Each version should have a design-note at the top explaining what the user is seeing:

```html
<div class="design-note info">
  <strong>State — Entry:</strong> First visit, no recordings yet. Contributor
  sees hero + "Start Recording" CTA.
</div>
```

### Version nav defaults to the NEWEST version

The newest version (highest `data-version` number) must always have the `active` class. When a user opens the mockup, they see the latest iteration immediately — not v1. Old versions are preserved but hidden, accessible via prev/next buttons. For journey states (entry/action/completion), each state is its own section — version navigation is for _iterations_ of the same state, not for flipping between different states.

## Generating a Mockup

Use `assets/mockup-shell.html` as the structural reference. Build a single self-contained HTML file at `docs/mockups/<name>.html` with:

- **Sticky nav bar** — title + anchor links + viewport toggle + "Copy All Feedback" button
- **Sections** — one per state/page/component, each wrapped in `.mockup-section[data-section-id]`
- **Version containers** — design content inside `.version[data-version="1"]`
- **Feedback area** — textarea under each section
- **Version nav** — prev/next buttons (hidden until v2+ exists)
- **All CSS/JS inline** — no external dependencies except fonts

### Section structure

Each screen/state gets ONE `.mockup-section`. Multiple iterations of that screen go inside the SAME section as `.version` divs — NEVER as separate sections stacked vertically on the page.

```html
<div class="mockup-section" data-section-id="state1" id="state1">
  <span class="section-label">State 1 — Description</span>
  <p class="section-desc">What this state shows and why.</p>

  <div class="version-container">
    <!-- ALL versions of this screen live here, inside ONE container -->
    <!-- Only .version.active is visible; others are hidden via CSS -->
    <div class="version" data-version="1">
      <!-- original design (hidden — no "active" class) -->
    </div>
    <div class="version" data-version="2">
      <!-- second iteration (hidden) -->
    </div>
    <div class="version active" data-version="3">
      <!-- NEWEST iteration — this one is active/visible by default -->
    </div>
  </div>

  <div class="version-nav">
    <button data-dir="prev">&larr; Prev</button>
    <span class="version-label">v3 of 3</span>
    <button data-dir="next" disabled>Next &rarr;</button>
  </div>

  <div class="feedback-area">
    <label for="fb-state1">Feedback</label>
    <textarea
      id="fb-state1"
      placeholder="Voice transcribe or type feedback for this section..."
    ></textarea>
    <div class="char-count"></div>
  </div>
</div>

<div class="section-divider"></div>
```

**WRONG** — do NOT do this (separate sections per version):

```html
<!-- WRONG: creates vertical scrolling through old versions -->
<div class="mockup-section" data-section-id="light-v1">...</div>
<div class="mockup-section" data-section-id="light-v2">...</div>
<div class="mockup-section" data-section-id="light-v3">...</div>
```

**RIGHT** — one section, multiple `.version` divs inside it:

```html
<!-- RIGHT: one section with version-container holding all iterations -->
<div class="mockup-section" data-section-id="light-mode">
  <div class="version-container">
    <div class="version" data-version="1">...</div>
    <div class="version" data-version="2">...</div>
    <div class="version active" data-version="3">...</div>
  </div>
</div>
```

### Design note callouts

```html
<div class="design-note">
  <strong>Change:</strong> Description of what changed.
</div>
<div class="design-note future">
  <strong>Future:</strong> Planned but not in scope.
</div>
<div class="design-note info">
  <strong>Note:</strong> Context for reviewers.
</div>
```

## Iterating on Feedback

When the user provides feedback (either pasted JSON or verbal), update the SAME HTML file:

1. **For each section with changes**, add a new `.version` div with incremented `data-version` INSIDE the existing `.version-container`
2. **Remove `active` from ALL old versions**, set `active` ONLY on the new (highest-numbered) version
3. **Do NOT create a new file** — always edit in place so the user can refresh
4. **Do NOT create a new section** — add the new version div inside the existing section's `.version-container`
5. The version-nav JS auto-detects multiple versions and shows prev/next buttons
6. Update the version-label text to reflect the new count (e.g., "v3 of 3")

**The newest version is always active.** The user sees the latest iteration when they open/refresh the page. They use prev/next buttons to review older versions if needed.

### Version iteration example

Before (v1 only):

```html
<div class="version-container">
  <div class="version active" data-version="1">
    <!-- original design -->
  </div>
</div>
```

After first iteration (v1 + v2 — v2 is active):

```html
<div class="version-container">
  <div class="version" data-version="1">
    <!-- original design preserved but HIDDEN -->
  </div>
  <div class="version active" data-version="2">
    <!-- updated design — VISIBLE by default -->
  </div>
</div>
```

After second iteration (v1 + v2 + v3 — v3 is active):

```html
<div class="version-container">
  <div class="version" data-version="1">
    <!-- original design preserved but HIDDEN -->
  </div>
  <div class="version" data-version="2">
    <!-- first iteration preserved but HIDDEN -->
  </div>
  <div class="version active" data-version="3">
    <!-- latest design — VISIBLE by default -->
  </div>
</div>
```

The required CSS for version visibility:

```css
.version {
  display: none;
}
.version.active {
  display: block;
}
```

## Feedback JSON Format

When the user clicks "Copy All Feedback", this JSON is copied to clipboard:

```json
{
  "mockup": "Page Title",
  "timestamp": "2026-02-18T...",
  "viewport": "mobile",
  "sections": {
    "state1": {
      "feedback": "The button should be larger...",
      "viewing_version": 2,
      "total_versions": 2,
      "viewport": "mobile"
    }
  }
}
```

Parse this to understand which sections have feedback, which version was viewed, and whether feedback was given while viewing mobile or desktop.

## Styling Guidelines

- **Live capture:** use the exact project styles — never substitute your own
- **From scratch:** match the project's visual style when possible (read existing CSS/Tailwind config)
- Use project colors and fonts if available
- Fall back to clean, neutral styling from the shell template
- Keep mockups realistic — use real-looking content, not lorem ipsum
- Use `.wide` class on sections that need more horizontal space (dashboards, tables)

## Key Rules

- **One file, always** — never create multiple mockup files for the same feature
- **Edit in place** — user refreshes browser to see changes, no new pages
- **Preserve versions** — never delete old version content, wrap it
- **Self-contained** — all CSS and JS inline, no CDN dependencies except fonts
- **Feedback areas always present** — every section gets a textarea
- **Open after generating** — always run `open <path>` after creating or updating
- **Print clickable URL** — after creating or updating a mockup, always print the full `file://` URL (e.g., `file:///Users/.../docs/mockups/name.html`) so the user can click it directly, in addition to running `open <path>`
- **Never approximate when you can embed** — iframe or verbatim HTML over hand-drawn mockups
- **Version navigation over vertical stacking** — NEVER list versions as separate sections stacked vertically on the page. Always use the `.version-container` + prev/next nav pattern. The newest version (highest `data-version`) must have the `active` class so it displays by default. Old versions are hidden (`display: none`) and accessible only via prev/next buttons. One `.mockup-section` per screen, one `.version-container` per section, multiple `.version` divs inside it.
