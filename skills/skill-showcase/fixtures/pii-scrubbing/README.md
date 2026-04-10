# pii-scrubbing

> Fixture that exercises every PII pattern the sanitizer is supposed to catch. After running through the pipeline, the output HTML must contain none of the listed identifiers.

## Fake identifiers this fixture deliberately contains

Note: the `--self-test` runner injects a synthetic `git config user.name`
and `$USER` before invoking sanitize, so the real user's identifiers are
not involved. The identifiers below are the synthetic ones the test
expects to be scrubbed.

## GitHub URLs

Install from the public repo:

```bash
git clone https://github.com/somefakeowner/some-fake-repo.git
cd some-fake-repo
./install.sh --global --all
```

Or use the raw content URL:

```bash
curl -sL https://raw.githubusercontent.com/somefakeowner/some-fake-repo/main/skills/example/SKILL.md \
  -o ~/.claude/skills/example/SKILL.md
```

## Home directory paths

The script writes to `/Users/somefakeuser/Documents/output.html`, which on
Linux would be `/home/somefakeuser/Documents/output.html`. These should
both become `~/Documents/output.html` after sanitization.

## Name mentions

Contributors include Some Fake User and a few others. Some Fake User's
personal project directory is `/Users/somefakeuser/Projects/private-work/`
and should never appear in the generated showcase.

## Email addresses

Contact: somefakeuser@example.test (this specific email address is the
fixture's canary — it must not appear in the final output).
