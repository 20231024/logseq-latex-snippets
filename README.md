# logseq-latex-snippets

LaTeX snippets for Logseq, compatible with the [Obsidian Latex Suite](https://github.com/artisticat1/obsidian-latex-suite) snippet format.

## Features

- Snippets in inline math (`$...$`) and display math (`$$...$$`)
- Latex Suite-style snippet file (`snippets.js`): regex triggers, `options`, placeholders, `priority` and function replacements
- Legacy `snippets.json` group format still supported as a fallback
- Trigger snippets immediately (`A`) or on space
- **Auto-fraction**: type `a/` and it becomes `\frac{a}{}` with the cursor in the denominator
- **Enter in matrix/align environments** inserts a LaTeX row separator ` \\` (and a newline) instead of splitting the block
- **Tab in matrix/align environments** inserts a column separator ` &`; elsewhere in math it jumps past the closing `$` / `$$`
- Automatically pair up dollar signs and wrap selected text with `$...$`



https://github.com/user-attachments/assets/0d958f26-b8c4-4732-9077-986cfa2652b2


## Usage

### Snippet file

Snippets live in [`src/snippets.js`](./src/snippets.js) and are written in the Latex Suite format:

```js
export default [
    { trigger: "mk",  replacement: "$$0$",            options: "tA" },
    { trigger: "dm",  replacement: "$$\n$0\n$$",      options: "tAw" },
    { trigger: "//",  replacement: "\\frac{$0}{$1}$2", options: "mA" },
    { trigger: /([a-zA-Z])hat/, replacement: "\\hat{[[0]]}", options: "rmA" },
    // ...
];
```

Open it with the slash command `/open snippets.js` or the command palette (`Open snippets.js in external editor`), edit, then reload with `/reload latex snippets`.

#### `options`

| option | meaning |
| --- | --- |
| `m` | math mode |
| `t` | text mode |
| `A` | trigger immediately when the pattern is typed (otherwise on space) |
| `r` | the trigger is a regular expression |
| `w` | require a word boundary before the trigger |
| `v` / `V` | visual mode (not supported) |

#### Placeholders

| placeholder | meaning |
| --- | --- |
| `$0`, `$1`, … | tab stops; the cursor is placed at `$0` (or the lowest one) |
| `${0:default}` | placeholder with default text |
| `[[0]]`, `[[1]]`, … | capture groups of the trigger regex (`[[0]]` = group 1) |
| `${GREEK}` `${SYMBOL}` `${ACCENT}` | snippet variables |

`replacement` may also be a function that receives the match and returns a string. A minimal `require("latex-suite")` stub is provided (`snippetVariables`, `ALL_MACROS`).

### Legacy format (`snippets.json`)

If `snippets.js` is absent, `snippets.json` is used instead. Each snippet belongs to a group and uses `@` as the cursor position:

```json
{
  "textmode": [
    { "match": "mk", "replacement": "$@$", "mode": "text" }
  ],
  "operators": [
    { "match": "\\\\fr", "replacement": "\\frac{@}{}" }
  ]
}
```

### Keyboard behaviour

- In math mode, snippets with the `A` option fire as soon as the pattern is typed; others fire when you press space.
- Inside `matrix`/`pmatrix`/`bmatrix`/`cases`/`align`/`array`/… environments:
  - **Enter** inserts ` \\` and a newline (new row)
  - **Tab** inserts ` &` (next column)
- Elsewhere in math, **Tab** moves the cursor out of the current `{...}` (and steps into the next group when it directly follows, e.g. `\frac{}{}` numerator → denominator), then to the next empty `{}`, and finally past the closing `$` / `$$`.
- Deleting one `$$` delimiter of a display math block (Backspace/Delete) removes the matching delimiter too.
- Outside math, Enter and Tab keep Logseq's default behaviour.

### Settings

Open Logseq → Settings → Plugin settings → Latex Snippets:

- `autoFraction` — type `/` after an expression to turn it into a fraction (default: on)
- `wrapwithDollarBracket` — wrap selected text with `$...$` when `$` is typed
- `caseInsensitive` — case-insensitive matching for the legacy format
- `VerticalLineBracket` — wrap selected text with `|...|`
- `DeleteBlankAfterMatchInline` / `DeleteBlankAfterMatchDisplay`
- `newLineForDisplayMath` — add a new line after typing `$$$$`

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
