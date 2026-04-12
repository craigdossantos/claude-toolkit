# edge-cases

> Markdown oddities that have historically broken text transforms — tables, nested lists, emphasis inside headings, Unicode, and long URLs.

## A table with code cells

| Command                                      | Does                         |
| -------------------------------------------- | ---------------------------- |
| `ls -la`                                     | List files                   |
| `grep -r foo .`                              | Search for `foo` recursively |
| `curl -sL https://example.test/path \| bash` | Pipe to shell                |

## Nested list with code spans

- Top level item
  - Nested with `inline code`
  - Nested with **bold** and _italic_
    - Triple-nested with a [link to somewhere](https://example.test)
- Another top level
  - And `another code span` here

## Headings with emphasis

### An _italicized_ phrase in a heading

### A `code span` in a heading

## Unicode and smart quotes

Text with curly quotes: "this is quoted" and 'single-quoted'. Em dash — like this.
Also bullets like • and arrows like → should pass through unchanged.

Non-ASCII names: Müller, Łukasz, Søren, 田中. Each is a legitimate string the
sanitizer should not mangle.

## A long URL that might wrap

See https://example.test/very/long/path/that/goes/on/and/on/and/includes/query?param=value&other=123 for details.

## An image reference

![A descriptive alt text for the image](assets/nonexistent.png)

The image above does not exist in this fixture — the test only verifies that
the markdown parses and the `<img>` tag is generated. It does not verify the
actual pixels.
