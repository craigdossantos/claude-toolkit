# fence-preservation

> Fixture that verifies multi-line fenced code blocks survive the sanitize pass without losing their newlines.

## The exact bug this catches

Earlier versions of `build-showcase.js` used `\s{2,}` → space to collapse runs of
whitespace after PII removal. That regex ate newlines inside fenced code blocks
and turned multi-line bash commands into single-line mush, which marked then
rendered as an inline fragment with a stray `</a>` tag in the middle of a URL.

## Multi-line fenced block with continuation backslashes

```bash
mkdir -p ~/tmp/test-output && \
curl -sL https://raw.githubusercontent.com/someowner/somerepo/main/SKILL.md \
  -o ~/tmp/test-output/SKILL.md && \
curl -sL https://raw.githubusercontent.com/someowner/somerepo/main/script.py \
  -o ~/tmp/test-output/script.py && \
open ~/tmp/test-output
```

The code block above has exactly 7 lines of content between the fences. If the
`--self-test` run reports a line-count mismatch, the sanitize invariant caught
a regression.

## A second code block to verify count parity

```js
const result = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: "value" }),
});
```

## Inline code with backticks

This sentence has `inline code` and another `bit of code` on the same line.
Neither should be mistaken for a fence line.

## Code block with an empty first line

```python

def main():
    print("hello")

```

The leading blank line is load-bearing — it tests whether sanitize preserves
intentional whitespace inside fenced blocks.
