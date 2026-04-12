#!/usr/bin/env node
/**
 * build-showcase.js — Assemble a single-file HTML showcase of a collection of Claude Code skills.
 *
 * Usage:
 *   node build-showcase.js [--skills-dir <path>] [--output <path>] [--title <string>]
 *                          [--exclude <name>,<name>] [--group-map <json-path>]
 *
 * Defaults:
 *   --skills-dir  ./skills
 *   --output      ./docs/showcase/skills.html
 *   --title       "Claude Code Skills"
 *
 * Behavior:
 *   1. Enumerates subdirectories of <skills-dir> that contain a SKILL.md
 *   2. For each skill, loads README.md (if present), hero image, and SKILL.md frontmatter
 *   3. Classifies each as custom or plugin based on path
 *   4. Scrubs PII from rendered content (github usernames, /Users/ paths, real names from git config)
 *   5. Groups by category (from --group-map JSON, README blockquote, or "Uncategorized")
 *   6. Renders into assets/showcase-shell.html and writes to --output
 *   7. Greps the output for known PII as a final safety check
 *
 * Requires: marked (npm install marked)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ─────────────────────────────────────────────
// Arg parsing
// ─────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    skillsDir: "./skills",
    output: "./docs/showcase/skills.html",
    title: "Claude Code Skills",
    exclude: [],
    groupMap: null,
    baseRepo: null,
    selfTest: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--skills-dir") args.skillsDir = argv[++i];
    else if (a === "--output") args.output = argv[++i];
    else if (a === "--title") args.title = argv[++i];
    else if (a === "--exclude")
      args.exclude = argv[++i].split(",").map((s) => s.trim());
    else if (a === "--group-map") args.groupMap = argv[++i];
    else if (a === "--base-repo") args.baseRepo = argv[++i];
    else if (a === "--self-test") args.selfTest = true;
  }
  return args;
}

/**
 * Given a skill and an optional base repo URL, return the public source URL
 * for this skill, or null if no link should be rendered.
 *
 * Precedence:
 *   1. Frontmatter `repo: none` or `repo: private` → null (opt-out)
 *   2. Frontmatter `repo: <url>` → that URL verbatim
 *   3. --base-repo provided → `<baseRepo>/<skill.id>`
 *   4. Otherwise → null (no link)
 */
function repoUrlFor(skill, baseRepo) {
  const fmRepo = skill.frontmatter && skill.frontmatter.repo;
  if (fmRepo === "none" || fmRepo === "private") return null;
  if (fmRepo && /^https?:\/\//.test(fmRepo)) return fmRepo;
  if (baseRepo) return baseRepo.replace(/\/+$/, "") + "/" + skill.id;
  return null;
}

// ─────────────────────────────────────────────
// Marked loader — tries common locations
// ─────────────────────────────────────────────
function loadMarked() {
  const tries = [
    "marked",
    path.join(process.cwd(), "node_modules/marked"),
    "/tmp/claude-toolkit-playwright/node_modules/marked",
    path.join(process.env.HOME || "", ".claude/node_modules/marked"),
  ];
  for (const p of tries) {
    try {
      return require(p).marked;
    } catch (_) {}
  }
  console.error("marked is not installed. Run: npm install marked");
  process.exit(1);
}

// ─────────────────────────────────────────────
// YAML frontmatter parser (minimal)
// ─────────────────────────────────────────────
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  const raw = match[1];
  const body = match[2];
  const data = {};
  // Single-line keys only; multi-line values collapse to one line.
  const lines = raw.split("\n");
  let currentKey = null;
  let currentVal = "";
  for (const line of lines) {
    const kv = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kv) {
      if (currentKey)
        data[currentKey] = currentVal.trim().replace(/^["']|["']$/g, "");
      currentKey = kv[1];
      currentVal = kv[2];
    } else if (currentKey) {
      currentVal += " " + line.trim();
    }
  }
  if (currentKey)
    data[currentKey] = currentVal.trim().replace(/^["']|["']$/g, "");
  return { data, body };
}

// ─────────────────────────────────────────────
// PII detection — auto-pulls identifiers from git config and the user's environment
// ─────────────────────────────────────────────
function detectPii() {
  const identifiers = new Set();
  const replacements = [];

  const add = (needle, replacement) => {
    if (!needle || needle.length < 2) return;
    identifiers.add(needle);
    replacements.push([new RegExp(escapeRegExp(needle), "g"), replacement]);
  };

  // Git config name and email
  try {
    const gitName = execSync("git config user.name", {
      encoding: "utf8",
    }).trim();
    const gitEmail = execSync("git config user.email", {
      encoding: "utf8",
    }).trim();
    if (gitName) {
      add(gitName, "");
      // Also handle first name only and possessive forms
      const first = gitName.split(/\s+/)[0];
      if (first && first.length > 2) {
        add(first + "'s", "Your");
        add(first + "'", "Your");
        add(first, "You");
      }
    }
    if (gitEmail) add(gitEmail, "<your-email>");
  } catch (_) {}

  // macOS username from $USER / $HOME
  const username = process.env.USER || process.env.USERNAME;
  if (username) {
    add(`/Users/${username}`, "~");
    add(`/home/${username}`, "~");
    add(`/Users/${username}/`, "~/");
    add(`/home/${username}/`, "~/");
    // GitHub username often matches local username; check if any github.com/<user>/ URL appears
    // and if the local username is likely the owner
    add(`github.com/${username}/`, "github.com/<your-username>/");
    add(
      `githubusercontent.com/${username}/`,
      "githubusercontent.com/<your-username>/",
    );
  }

  return { identifiers: [...identifiers], replacements };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Additional GitHub owner detection — scan for github.com/<owner>/<repo> patterns
// and if an owner appears in 3+ places, treat it as identifying and replace it
function detectGithubOwners(combinedContent) {
  const rx = /github(?:usercontent)?\.com\/([a-zA-Z0-9][a-zA-Z0-9-]{0,38})\//g;
  const counts = {};
  let m;
  while ((m = rx.exec(combinedContent)) !== null) {
    const owner = m[1];
    if (owner === "<your-username>") continue;
    counts[owner] = (counts[owner] || 0) + 1;
  }
  const owners = Object.entries(counts)
    .filter(([, n]) => n >= 1)
    .map(([owner]) => owner);
  return owners;
}

/**
 * sanitize — run PII replacements on markdown text, then enforce structural invariants.
 *
 * This function is the most dangerous part of the script: it rewrites raw markdown
 * text before marked parses it. Any regex that accidentally matches across a newline
 * or fenced-code-block boundary will silently corrupt the output (real incident — see
 * the "Known pitfalls" section in SKILL.md).
 *
 * Two invariants run AFTER every sanitize call and throw SanitizeError if they fail:
 *
 *   1. Newline preservation — none of our replacements are supposed to touch \n,
 *      so the output must have the same number of newlines as the input.
 *
 *   2. Fenced-block preservation — the count of lines that begin with ``` must
 *      be unchanged, so fence opening/closing pairs stay intact.
 *
 * A transform that breaks either invariant is a bug, not a subtle issue. Fail loud.
 */
class SanitizeError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "SanitizeError";
    this.details = details;
  }
}

function countNewlines(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++;
  return n;
}

function countFenceLines(s) {
  const m = s.match(/^```/gm);
  return m ? m.length : 0;
}

function sanitize(text, replacements, context = "<unknown>") {
  const inputNewlines = countNewlines(text);
  const inputFences = countFenceLines(text);

  let out = text;
  for (const [rx, rep] of replacements) {
    out = out.replace(rx, rep);
  }

  // Clean up double-spaces introduced by empty replacements (e.g. name removal).
  // Use a LITERAL space class here, not \s — \s matches newlines and would
  // collapse fenced code blocks into single lines, breaking marked's parser.
  // This is the specific bug that shipped in v1; the invariants below catch it.
  out = out.replace(/ {2,}/g, " ");

  // ─── Invariant 1: newline count preserved ───
  const outputNewlines = countNewlines(out);
  if (outputNewlines !== inputNewlines) {
    throw new SanitizeError(
      `sanitize() changed newline count in ${context}: ${inputNewlines} → ${outputNewlines}. ` +
        `A replacement regex ate or inserted a newline. Check any pattern using \\s, \\W, or \\S.`,
      { context, inputNewlines, outputNewlines },
    );
  }

  // ─── Invariant 2: fenced code block boundaries preserved ───
  const outputFences = countFenceLines(out);
  if (outputFences !== inputFences) {
    throw new SanitizeError(
      `sanitize() changed fenced-code-block count in ${context}: ${inputFences} → ${outputFences}. ` +
        `A replacement regex damaged a \`\`\` fence line. Check replacements that touch backticks or line starts.`,
      { context, inputFences, outputFences },
    );
  }

  return out;
}

// ─────────────────────────────────────────────
// Skill discovery
// ─────────────────────────────────────────────
function discoverSkills(skillsDir, exclude) {
  const absDir = path.resolve(skillsDir);
  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
    console.error(`Skills directory not found: ${absDir}`);
    process.exit(1);
  }
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (exclude.includes(entry.name)) continue;
    const skillDir = path.join(absDir, entry.name);
    const skillMdPath = path.join(skillDir, "SKILL.md");
    if (!fs.existsSync(skillMdPath)) continue;

    const readmePath = path.join(skillDir, "README.md");
    const hasReadme = fs.existsSync(readmePath);
    const readme = hasReadme ? fs.readFileSync(readmePath, "utf8") : null;
    const skillMd = fs.readFileSync(skillMdPath, "utf8");
    const frontmatter = parseFrontmatter(skillMd);

    // Hero image lookup
    const assetsDir = path.join(skillDir, "assets");
    let heroRelPath = null;
    if (fs.existsSync(assetsDir)) {
      for (const ext of ["png", "jpg", "jpeg", "webp"]) {
        const candidate = path.join(assetsDir, "hero." + ext);
        if (fs.existsSync(candidate)) {
          heroRelPath = `../../skills/${entry.name}/assets/hero.${ext}`;
          break;
        }
      }
    }

    // Classify custom vs plugin
    const absPath = skillDir;
    const isPlugin =
      /\/plugins\/cache\//.test(absPath) ||
      /\/plugins\/installed\//.test(absPath) ||
      (frontmatter.data.source && /plugin/i.test(frontmatter.data.source));

    // Tagline: prefer README blockquote, fall back to SKILL.md description
    let tagline = "";
    if (readme) {
      const blockquoteMatch = readme.match(/^>\s+(.+)$/m);
      if (blockquoteMatch) tagline = blockquoteMatch[1].trim();
    }
    if (!tagline && frontmatter.data.description) {
      // Take the first sentence of the description
      tagline =
        frontmatter.data.description.split(/\.\s/)[0].replace(/\.$/, "") + ".";
    }

    skills.push({
      id: entry.name,
      name: frontmatter.data.name || entry.name,
      tagline,
      description: frontmatter.data.description || "",
      readme,
      hasReadme,
      heroRelPath,
      isPlugin: !!isPlugin,
      pluginName: isPlugin ? inferPluginName(absPath) : null,
      frontmatter: frontmatter.data,
    });
  }
  return skills.sort((a, b) => a.id.localeCompare(b.id));
}

function inferPluginName(skillPath) {
  const match = skillPath.match(/\/plugins\/cache\/([^/]+)\//);
  return match ? match[1] : null;
}

// ─────────────────────────────────────────────
// Default category mapping (used only when no --group-map provided)
// ─────────────────────────────────────────────
const DEFAULT_GROUPS = {
  "Design & UX": ["ux-mockup", "frontend-design"],
  "Testing & QA": ["qa-checklist", "testing-webapps"],
  "Multi-agent thinking": [
    "consensus-brainstormer",
    "debate-chamber",
    "research-orchestrator",
  ],
  "Planning & documents": ["prd", "handoff", "ralph"],
  "Reporting & setup": [
    "html-report",
    "video-course-site",
    "insight-harness",
    "init",
  ],
  "Meta / infrastructure": ["skill-showcase"],
};

function groupSkills(skills, groupMapPath) {
  const groupMap =
    groupMapPath && fs.existsSync(groupMapPath)
      ? JSON.parse(fs.readFileSync(groupMapPath, "utf8"))
      : DEFAULT_GROUPS;

  const groups = {};
  const skillToGroup = {};
  for (const [groupName, skillIds] of Object.entries(groupMap)) {
    groups[groupName] = [];
    for (const id of skillIds) skillToGroup[id] = groupName;
  }
  const uncategorized = [];
  for (const skill of skills) {
    const g = skillToGroup[skill.id];
    if (g && groups[g] !== undefined) {
      groups[g].push(skill);
    } else {
      uncategorized.push(skill);
    }
  }
  if (uncategorized.length) groups["Uncategorized"] = uncategorized;

  // Remove empty groups
  for (const k of Object.keys(groups)) {
    if (groups[k].length === 0) delete groups[k];
  }
  return groups;
}

// ─────────────────────────────────────────────
// Strip H1 and its immediate blockquote tagline from a README so we don't duplicate
// them in the section header.
// ─────────────────────────────────────────────
function stripHeader(readme) {
  let out = readme;
  // Remove first H1
  out = out.replace(/^#\s+.+\n+/, "");
  // Remove leading blockquote
  out = out.replace(/^>\s+.+\n+/, "");
  // Remove leading hero image line
  out = out.replace(/^!\[[^\]]*\]\([^)]+\)\n+/, "");
  return out;
}

// ─────────────────────────────────────────────
// Rewrite relative image paths so they resolve from the output location
// ─────────────────────────────────────────────
function rewriteImagePaths(html, skillId) {
  return html.replace(
    /(src|href)="assets\//g,
    `$1="../../skills/${skillId}/assets/`,
  );
}

// ─────────────────────────────────────────────
// HTML escape for text interpolation
// ─────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────
// Main build
// ─────────────────────────────────────────────
// Self-test
//
// Runs the sanitize → marked pipeline against the fixtures in `../fixtures/`
// using a synthetic PII replacement list that matches the identifiers those
// fixtures deliberately embed. Asserts:
//
//   1. Every sanitize() call succeeds (no SanitizeError thrown)
//   2. The rendered HTML contains none of the synthetic PII canaries
//   3. The number of <pre> blocks in the rendered HTML matches the number
//      of fenced code blocks in the input markdown (fence lines / 2)
//   4. Each <pre> block's line count is >= 1 (no empty collapsed blocks)
//
// Run with:  node build-showcase.js --self-test
//
// New contributors modifying the sanitizer should run this before publishing.
// ─────────────────────────────────────────────
function runSelfTest() {
  const marked = loadMarked();

  // Fixture directory is a sibling of scripts/ (../fixtures/)
  const fixturesDir = path.resolve(__dirname, "../fixtures");
  if (!fs.existsSync(fixturesDir)) {
    console.error("Self-test fixtures not found at " + fixturesDir);
    process.exit(1);
  }

  // Synthetic PII replacement list — these identifiers are embedded in
  // the fixtures/pii-scrubbing README and must be scrubbed by the pipeline.
  const syntheticReplacements = [
    [/Some Fake User's/g, "Your"],
    [/Some Fake User/g, "You"],
    [/somefakeowner/g, "<your-username>"],
    [/somefakeuser/g, "<your-username>"],
    [/\/Users\/somefakeuser/g, "~"],
    [/\/home\/somefakeuser/g, "~"],
    [/somefakeuser@example\.test/g, "<your-email>"],
  ];

  // Canaries — if any of these strings appear in the rendered output, the
  // sanitizer failed and the self-test fails loudly.
  const piiCanaries = [
    "Some Fake User",
    "somefakeowner",
    "somefakeuser",
    "somefakeuser@example.test",
    "/Users/somefakeuser",
    "/home/somefakeuser",
  ];

  const fixtures = fs
    .readdirSync(fixturesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  if (fixtures.length === 0) {
    console.error("No fixtures found in " + fixturesDir);
    process.exit(1);
  }

  let allPassed = true;
  const results = [];

  for (const name of fixtures) {
    const readmePath = path.join(fixturesDir, name, "README.md");
    if (!fs.existsSync(readmePath)) {
      results.push({ name, status: "skip", reason: "no README.md" });
      continue;
    }
    const readme = fs.readFileSync(readmePath, "utf8");
    const fenceLinesInput = countFenceLines(readme);
    const expectedPreBlocks = fenceLinesInput / 2;

    const failures = [];

    // Run the sanitize pipeline. Catches SanitizeError (invariant violations).
    let sanitized;
    try {
      sanitized = sanitize(readme, syntheticReplacements, `fixture:${name}`);
    } catch (e) {
      failures.push(`sanitize threw: ${e.message}`);
      results.push({ name, status: "fail", failures });
      allPassed = false;
      continue;
    }

    // Render with marked
    let html;
    try {
      html = marked.parse(sanitized);
    } catch (e) {
      failures.push(`marked.parse threw: ${e.message}`);
      results.push({ name, status: "fail", failures });
      allPassed = false;
      continue;
    }

    // Check 1: no PII canaries in output
    for (const canary of piiCanaries) {
      if (html.includes(canary)) {
        failures.push(`PII canary leaked to output: "${canary}"`);
      }
    }

    // Check 2: <pre> block count matches expected
    const preOpenMatches = html.match(/<pre>/g) || [];
    const actualPreBlocks = preOpenMatches.length;
    if (actualPreBlocks !== expectedPreBlocks) {
      failures.push(
        `<pre> block count mismatch: expected ${expectedPreBlocks} (from ${fenceLinesInput} fence lines), got ${actualPreBlocks}`,
      );
    }

    // Check 3: each <pre> block has content (no collapsed-to-empty blocks)
    const preContentMatches =
      html.match(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g) || [];
    for (let i = 0; i < preContentMatches.length; i++) {
      const inner = preContentMatches[i]
        .replace(/<pre><code[^>]*>/, "")
        .replace(/<\/code><\/pre>$/, "");
      if (inner.trim().length === 0) {
        failures.push(`<pre> block ${i + 1} is empty (content collapsed?)`);
      }
    }

    if (failures.length > 0) {
      results.push({ name, status: "fail", failures });
      allPassed = false;
    } else {
      results.push({ name, status: "pass", preBlocks: actualPreBlocks });
    }
  }

  // Report
  console.log("");
  console.log("skill-showcase self-test");
  console.log("────────────────────────");
  for (const r of results) {
    if (r.status === "pass") {
      console.log(`  ✓ ${r.name} (${r.preBlocks} code blocks verified)`);
    } else if (r.status === "skip") {
      console.log(`  ~ ${r.name} (skipped: ${r.reason})`);
    } else {
      console.log(`  ✗ ${r.name}`);
      for (const f of r.failures) console.log(`      - ${f}`);
    }
  }
  console.log("");

  if (allPassed) {
    console.log(
      "All fixtures passed. The sanitize → marked pipeline is sound.",
    );
    process.exit(0);
  } else {
    console.error("Self-test failed. Do not publish showcases until fixed.");
    process.exit(2);
  }
}

// ─────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv);

  if (args.selfTest) {
    runSelfTest();
    return;
  }

  const marked = loadMarked();

  // Discover and group
  const skills = discoverSkills(args.skillsDir, args.exclude);
  if (skills.length === 0) {
    console.error("No skills found in " + args.skillsDir);
    process.exit(1);
  }
  const groups = groupSkills(skills, args.groupMap);

  // Build combined content for PII detection (scan everything before sanitizing)
  const combinedContent = skills
    .map((s) => (s.readme || "") + "\n" + s.description)
    .join("\n");

  const { replacements } = detectPii();

  // Auto-detect GitHub owners from combined content
  const owners = detectGithubOwners(combinedContent);
  for (const owner of owners) {
    const rx = new RegExp(
      `github(usercontent)?\\.com/${escapeRegExp(owner)}/`,
      "g",
    );
    replacements.push([rx, "github$1.com/<your-username>/"]);
    // Also scrub bare owner mentions that look like `user/repo` in raw URLs
  }

  // Known identifiers for final grep check.
  // Anything that appears here but also in the user-provided --base-repo URL
  // (or in a skill's frontmatter repo: override) is an INTENTIONAL share,
  // not a leak, and gets exempted below.
  const piiToVerify = [];
  try {
    const gitName = execSync("git config user.name", {
      encoding: "utf8",
    }).trim();
    if (gitName) {
      piiToVerify.push(gitName);
      piiToVerify.push(gitName.split(/\s+/)[0]);
    }
  } catch (_) {}
  if (process.env.USER) {
    piiToVerify.push(`/Users/${process.env.USER}`);
    piiToVerify.push(`github.com/${process.env.USER}/`);
  }
  for (const owner of owners) piiToVerify.push(`github.com/${owner}/`);

  // Build the exemption set from user opt-ins.
  const intentionallyShared = new Set();
  if (args.baseRepo) intentionallyShared.add(args.baseRepo);
  for (const skill of skills) {
    const fmRepo = skill.frontmatter && skill.frontmatter.repo;
    if (fmRepo && /^https?:\/\//.test(fmRepo)) intentionallyShared.add(fmRepo);
  }
  // An identifier is exempt if it's a substring of ANY intentionally-shared URL.
  // e.g. "github.com/craigdossantos/" is a substring of the base-repo URL → OK.
  const isExempt = (needle) => {
    for (const url of intentionallyShared) {
      if (url.includes(needle)) return true;
    }
    return false;
  };

  // Render each skill
  const renderedSections = [];
  const tocGroupBlocks = [];
  const navLinks = [];

  for (const [groupName, groupSkillsList] of Object.entries(groups)) {
    if (groupSkillsList.length === 0) continue;
    const tocItems = groupSkillsList
      .map((skill) => {
        const cleanTagline = sanitize(
          skill.tagline || "",
          replacements,
          `${skill.id} (toc tagline)`,
        );
        const badge = skill.isPlugin
          ? `<span class="badge plugin">${skill.pluginName ? `Plugin: ${esc(skill.pluginName)}` : "Plugin"}</span>`
          : `<span class="badge custom">Custom</span>`;
        const repoUrl = repoUrlFor(skill, args.baseRepo);
        const sourceLink = repoUrl
          ? ` <span class="toc-source"><a href="${esc(repoUrl)}" target="_blank" rel="noopener">source →</a></span>`
          : "";
        return `<a class="toc-item" href="#${esc(skill.id)}">
          <div class="toc-item-head">
            <span class="toc-item-name">${esc(skill.id)}</span>
            ${badge}${sourceLink}
          </div>
          <div class="toc-item-tag">${esc(cleanTagline)}</div>
        </a>`;
      })
      .join("\n");

    tocGroupBlocks.push(`<div class="toc-group">
      <div class="toc-group-label">${esc(groupName)}</div>
      <div class="toc-items">${tocItems}</div>
    </div>`);
  }

  for (const [groupName, groupSkillsList] of Object.entries(groups)) {
    for (const skill of groupSkillsList) {
      navLinks.push(
        `<a class="jump" href="#${esc(skill.id)}">${esc(skill.id)}</a>`,
      );

      const badge = skill.isPlugin
        ? `<span class="badge plugin">${skill.pluginName ? `Plugin: ${esc(skill.pluginName)}` : "Plugin"}</span>`
        : `<span class="badge custom">Custom</span>`;

      const tagline = esc(
        sanitize(
          skill.tagline || "",
          replacements,
          `${skill.id} (section tagline)`,
        ),
      );

      let bodyHtml = "";
      if (skill.readme) {
        const sanitized = sanitize(
          stripHeader(skill.readme),
          replacements,
          `${skill.id} (README body)`,
        );
        bodyHtml = marked.parse(sanitized);
        bodyHtml = rewriteImagePaths(bodyHtml, skill.id);
      } else {
        bodyHtml = `<div class="no-readme">This skill does not have a public README yet. The instructions inside <code>SKILL.md</code> are written for Claude rather than humans.</div>`;
      }

      const heroHtml = skill.heroRelPath
        ? `<div class="hero-img-wrap"><img src="${esc(skill.heroRelPath)}" alt="${esc(skill.id)} hero" loading="lazy" /></div>`
        : "";

      const repoUrl = repoUrlFor(skill, args.baseRepo);
      const sourceLinkHtml = repoUrl
        ? `<a class="source-link" href="${esc(repoUrl)}" target="_blank" rel="noopener" title="View source on GitHub">source →</a>`
        : "";

      renderedSections.push(`<section class="skill-section" id="${esc(skill.id)}">
        <div class="section-header">
          <h2>${esc(skill.id)}</h2>
          ${badge}
          ${sourceLinkHtml}
        </div>
        ${tagline ? `<blockquote class="tagline">${tagline}</blockquote>` : ""}
        ${heroHtml}
        <div class="readme">${bodyHtml}</div>
        <a class="back-to-top" href="#toc">↑ Back to top</a>
      </section>`);
    }
  }

  // Counts
  const totalCount = skills.length;
  const customCount = skills.filter((s) => !s.isPlugin).length;
  const pluginCount = totalCount - customCount;

  // Load shell template — try several locations so the script works from different cwds
  const shellCandidates = [
    path.resolve(__dirname, "../assets/showcase-shell.html"),
    path.resolve(
      process.cwd(),
      "skills/skill-showcase/assets/showcase-shell.html",
    ),
    path.resolve(
      process.cwd(),
      args.skillsDir,
      "skill-showcase/assets/showcase-shell.html",
    ),
  ];
  let shellPath = null;
  for (const c of shellCandidates) {
    if (fs.existsSync(c)) {
      shellPath = c;
      break;
    }
  }
  if (!shellPath) {
    console.error(
      "Could not find showcase-shell.html. Looked in:\n  " +
        shellCandidates.join("\n  "),
    );
    process.exit(1);
  }
  let shell = fs.readFileSync(shellPath, "utf8");

  // Top nav links: keep this compact (first 6 or so) to avoid a wall of links
  const navLinksLimited = navLinks.slice(0, 8).join("\n  ");

  const dateStr = new Date().toISOString().slice(0, 10);
  const brand = args.title;
  const headline = args.title.replace("&", "<em>&amp;</em>");

  shell = shell
    .replace(/{{PAGE_TITLE}}/g, esc(args.title))
    .replace(
      /{{PAGE_DESCRIPTION}}/g,
      esc(`A public showcase of ${totalCount} Claude Code skills.`),
    )
    .replace(/{{PAGE_BRAND}}/g, esc(brand))
    .replace(/{{PAGE_EYEBROW}}/g, esc("Claude Code"))
    .replace(/{{PAGE_HEADLINE}}/g, headline)
    .replace(
      /{{PAGE_LEDE}}/g,
      `A catalog of ${totalCount} skills that extend Claude Code — from UX mockups and QA checklists to multi-agent orchestration and report generators. Each skill is a folder you drop into <code>~/.claude/skills/</code> (or your project) and invoke through natural language.`,
    )
    .replace(/{{NAV_LINKS}}/g, navLinksLimited)
    .replace(/{{TOTAL_COUNT}}/g, String(totalCount))
    .replace(/{{CUSTOM_COUNT}}/g, String(customCount))
    .replace(/{{PLUGIN_COUNT}}/g, String(pluginCount))
    .replace(/{{TOC_GROUPS}}/g, tocGroupBlocks.join("\n"))
    .replace(/{{SKILL_SECTIONS}}/g, renderedSections.join("\n"))
    .replace(/{{GENERATED_DATE}}/g, dateStr);

  // Write output
  const outPath = path.resolve(args.output);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, shell);

  // ─────────────────────────────────────────────
  // Final PII safety grep.
  //
  // We exempt identifiers that are substrings of any intentionally-shared URL
  // (i.e. the --base-repo flag or a frontmatter repo: override). Those are
  // deliberate opt-ins, not leaks. Strip those URLs from the content before
  // grepping so we catch any OTHER place the identifier might have appeared.
  // ─────────────────────────────────────────────
  let finalContent = fs.readFileSync(outPath, "utf8");
  let scrubbedForCheck = finalContent;
  for (const sharedUrl of intentionallyShared) {
    // Remove every occurrence of the intentionally-shared URL from the
    // content we check. What's left must be clean.
    scrubbedForCheck = scrubbedForCheck.split(sharedUrl).join("");
  }
  const leaks = [];
  for (const needle of piiToVerify) {
    if (!needle) continue;
    if (isExempt(needle)) continue; // identifier lives inside an opt-in URL
    if (scrubbedForCheck.includes(needle)) {
      leaks.push(needle);
    }
  }

  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`✓ ${outPath}`);
  console.log(
    `  ${totalCount} skills (${customCount} custom, ${pluginCount} plugin)`,
  );
  console.log(`  ${Object.keys(groups).length} categories`);
  console.log(`  ${sizeKb}kB`);

  if (leaks.length) {
    console.error("");
    console.error(
      "⚠ PII CHECK FAILED — the following identifiers are still present in the output:",
    );
    for (const l of leaks) console.error("  • " + l);
    console.error("");
    console.error(
      "Fix the source READMEs or regenerate hero images, then rerun.",
    );
    process.exit(2);
  } else {
    console.log("  ✓ PII check passed");
  }
}

main();
