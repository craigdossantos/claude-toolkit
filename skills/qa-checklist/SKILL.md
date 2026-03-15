---
name: qa-checklist
description: Generate an interactive QA testing checklist as a self-contained HTML page after creating a PR. Analyzes the PR diff and existing automated tests to identify what needs manual testing, then produces a checklist with pass/fail/skip buttons, feedback textareas, and clipboard export. Triggers on "qa checklist", "test checklist", "manual testing", "QA review", "what should I test", or after PR creation when manual verification is needed.
---

# QA Checklist

Generate an interactive HTML checklist for manual QA testing. Analyze the PR to determine what automated tests don't cover, then produce a testable checklist with per-item results and feedback collection.

## Workflow

1. **Identify the deployment URL** — find the Vercel preview URL from the PR
2. **Analyze the PR** — read the diff, identify changed files and features
3. **Check automated coverage** — read existing tests to find gaps
4. **Generate checklist** — create a single HTML file with test items
5. **Open in browser** — `open <path>` so the user can work through it
6. **Collect results** — user marks pass/fail/skip, adds notes, copies JSON

## Finding the Deployment URL

Run `gh pr view --json url,number` to get the PR number, then check for a Vercel preview deployment:

```bash
gh pr checks --json name,link,state | grep -i vercel
```

If a Vercel preview URL is found, use it. If not (e.g., testing locally), use `http://localhost:3000`. Include the URL prominently in the checklist summary banner.

## Analyzing What to Test

### 1. Read the PR diff

```bash
git diff main...HEAD --stat
git diff main...HEAD
```

### 2. Categorize changes

- **UI changes** — new/modified components, pages, layouts, styles
- **API changes** — new/modified endpoints, request/response shapes
- **Data changes** — schema migrations, seed data, validations
- **Logic changes** — business rules, calculations, state management
- **Config changes** — env vars, build config, dependencies

### 3. Check existing test coverage

Read test files (`e2e/`, `__tests__/`, `*.test.*`, `*.spec.*`) to understand what's already covered by automated tests. Focus the manual checklist on gaps:

- User flows that cross multiple pages
- Visual/layout correctness
- Edge cases in form inputs
- Error states and empty states
- Responsive behavior
- Accessibility (keyboard nav, screen reader)
- Real API integration behavior (vs mocked)

## Generating the Checklist

Use `assets/qa-shell.html` as the structural reference. Create a single self-contained HTML file at `docs/qa/<pr-number>-<short-name>.html` with:

- **Sticky nav** — title + anchor links to categories + "Copy All Feedback" button
- **Summary banner** — PR title, deployment link, progress bar
- **Test sections** — grouped by category, each with numbered test items
- **All CSS/JS inline** — no external dependencies

### Test section structure

```html
<div class="category-label" id="category-id">
  <span>Category Name</span>
</div>

<div class="test-section" data-test-id="test-1">
  <div class="test-card">
    <div class="test-header">
      <span class="test-number">1</span>
      <span class="test-title">Brief description of what to test</span>
    </div>

    <div class="test-steps">
      <ol>
        <li>Navigate to <code>/some-page</code></li>
        <li>Click the "Submit" button</li>
        <li>Observe the result</li>
      </ol>
    </div>

    <div class="test-expect">
      <strong>Expected:</strong> The form submits and a success toast appears.
    </div>

    <div class="test-result">
      <button class="result-btn" data-result="pass">Pass</button>
      <button class="result-btn" data-result="fail">Fail</button>
      <button class="result-btn" data-result="skip">Skip</button>
    </div>

    <div class="feedback-area">
      <label for="fb-test-1">Notes</label>
      <textarea
        id="fb-test-1"
        placeholder="Describe what you observed..."
      ></textarea>
      <div class="char-count"></div>
    </div>
  </div>
</div>
```

### Writing good test items

- **Title**: One line describing what's being verified (not how)
- **Steps**: Numbered, concrete actions. Use `<code>` for URLs, button labels, field names
- **Expected**: What the user should see if the feature works correctly
- Keep steps to 3-5 per test. Split complex flows into multiple test items
- Order tests by user flow (happy path first, then edge cases)

### Summary banner meta

Include in the `{{QA_META}}` section:

```html
<strong>PR:</strong>
<a href="{{PR_URL}}" target="_blank">#{{PR_NUMBER}} — {{PR_TITLE}}</a><br />
<strong>Test against:</strong>
<a href="{{DEPLOY_URL}}" target="_blank">{{DEPLOY_URL}}</a><br />
<strong>Branch:</strong> {{BRANCH_NAME}}
```

## Feedback JSON Format

When the user clicks "Copy All Feedback", this JSON is copied to clipboard:

```json
{
  "qa_checklist": "QA: PR #42 — Add user profile page",
  "timestamp": "2026-03-11T...",
  "summary": { "passed": 5, "failed": 1, "skipped": 1, "total": 7 },
  "tests": {
    "test-1": {
      "title": "Profile page loads with user data",
      "result": "pass"
    },
    "test-3": {
      "title": "Edit profile form validation",
      "result": "fail",
      "feedback": "Email field accepts invalid format 'foo@' without error"
    }
  }
}
```

Parse this to understand which tests failed and what the user observed.

## Key Rules

- **One file per PR** — `docs/qa/<pr-number>-<short-name>.html`
- **Self-contained** — all CSS/JS inline, no external dependencies
- **Open after generating** — always run `open <path>` after creating
- **Focus on gaps** — don't duplicate what automated tests already cover
- **Actionable steps** — every test must have concrete steps, not vague instructions
- **Include the deployment URL** — make it clickable in the summary banner
