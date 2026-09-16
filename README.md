# TS JSON Parser

A hand-written JSON parser implemented in TypeScript, built from scratch without using `JSON.parse`. It's split into two stages, matching classic parser design: a **lexer** that tokenizes raw JSON text, and a **parser** that turns those tokens into an in-memory JavaScript object using an explicit (non-recursive) stack.

## Table of Contents

- [Overview](#overview)
- [Usage](#usage)
- [Architecture](#architecture)
  - [1. `typeResolver`](#1-typeresolver)
  - [2. `lexer`](#2-lexer)
  - [3. `parser`](#3-parser)
  - [4. `json` (entry point)](#4-json-entry-point)
- [How Parsing Works](#how-parsing-works)
- [Design Notes](#design-notes)
- [Known Limitations](#known-limitations)
- [Possible Improvements](#possible-improvements)

## Overview

This project reimplements JSON parsing (`{}`, `[]`, strings, numbers, `true`/`false`/`null`) as a two-phase pipeline:

```
raw JSON string --> lexer() --> token list --> parser() --> JS object
```

Unlike a typical hand-written parser, this one uses an **explicit stack** to track nesting instead of recursive descent — meaning nesting depth is managed manually via a `stack: Array<[key, container]>` rather than relying on the call stack (see [Design Notes](#design-notes) for the tradeoffs of this choice).

## Usage

```ts
import { json } from "./parser";

const result = json(`{
  "glossary": {
    "title": "example glossary",
    "GlossDiv": {
      "title": "S"
    }
  }
}`);

console.log(result);
```

`json(raw: string): Object` is the single exported entry point. It throws a `SyntaxError` on malformed input (mismatched brackets or unterminated strings).

## Architecture

### 1. `typeResolver`

```ts
function typeResolver(token: string): any
```

Takes a raw, un-typed token string (e.g. `"42"`, `"true"`, `"null"`) and converts it to its actual JS type:

- Numeric strings → `Number(token)`
- `"true"` / `"false"` → boolean `true` / `false`
- `"null"` → `null`
- Anything else → returned as-is (used for already-extracted string literals, which bypass this function entirely — see below)

This is where **type resolution** happens — not in the lexer's character-scanning loop, and not in the parser's structural logic. It's called once per primitive literal token as the lexer finishes accumulating it.

### 2. `lexer`

```ts
function lexer(raw: string): Array<any>
```

Converts the raw JSON string into a flat array of tokens. Tokens are one of:

- A string value (already unquoted — pushed directly when a closing `"` is found)
- A structural character: `{`, `}`, `[`, `]`, `:`, `,`
- A resolved primitive: a `number`, `boolean`, or `null` (via `typeResolver`)

**How it works, character by character:**

1. **Quote handling** — `"` toggles an `isQuote` flag. While inside quotes, every character (including whitespace, `:`, `,`, etc.) is accumulated literally into `word` rather than being interpreted structurally. On the closing `"`, the accumulated string is pushed as a token.
2. **Whitespace** outside of strings is skipped.
3. **Bracket validation** — every `{ } [ ]` (and `(` `)`, though JSON doesn't use those) is checked against a `stack` of open brackets using a `closeToOpen` lookup, throwing `SyntaxError("Invalid JSON: Mismatched brackets")` on mismatch. Valid brackets are pushed as tokens regardless.
4. **Structural separators** (`:` and `,`) are pushed directly as tokens.
5. **Primitive accumulation** — any other character (digits, `-`, `.`, letters of `true`/`false`/`null`) is appended to `word`. The lexer **peeks at the next character** to decide if the literal is complete (next char is whitespace, a bracket, a structural separator, a quote, or end-of-input). Once complete, `word` is passed through `typeResolver` and pushed as a token.
6. After the full scan, if `isQuote` is still `true` or the bracket `stack` isn't empty, the input was malformed (unterminated string or unclosed bracket) and a `SyntaxError` is thrown.

This bracket-validation stack in the lexer is **separate** from the object-construction stack used later in the parser — it only exists to catch malformed bracket nesting early.

### 3. `parser`

```ts
function parser(tokens: Array<any>): Object
```

Consumes the token array and builds the actual JS value. It maintains:

- `stack: Array<[key, container]>` — each frame pairs a *container currently being built* (an object `{}` or array `[]`) with the *key it will be assigned to in its parent* once it's finished.
- `key: any` — the most recently seen object key (the string token immediately before a `:`).

**Per-token behavior:**

- `{` / `[` — pushes a new `[key, {}]` or `[key, []]` frame onto the stack, capturing the current `key` as "where this new container belongs in its parent."
- `}` — finalizes the current object's last property, pops the frame, and merges the popped container into its parent under the key that was captured when it was opened.
- `]` — same idea, but pushes the last accumulated value into the array instead of adding a key/value pair.
- `:` — records the token immediately before it as the current `key`.
- `,` — depending on whether the current top-of-stack container is an array or object, either pushes the previous value onto the array, or adds a key/value entry to the object using the current `key`.

`createNewEntry` is a small helper used for the object case:

```ts
function createNewEntry(currObj: Object, mykey: any, value: any): Object {
  return { ...currObj, [mykey]: value };
}
```

It returns a **new** object via spread rather than mutating `currObj` — so every call site that uses it must reassign the result back into the stack frame (`stack[top][1] = createNewEntry(...)`). Array construction, by contrast, mutates the array in place with `.push()`.

### 4. `json` (entry point)

```ts
export function json(raw: string): Object {
  let tokens: Array<any> = lexer(raw);
  return parser(tokens);
}
```

Just wires the two phases together: lex, then parse.

## How Parsing Works

For input like:

```json
{ "a": 1, "b": { "c": 2 } }
```

Roughly:

1. Lexer produces: `["{", "a", ":", 1, ",", "b", ":", "{", "c", ":", 2, "}", "}"]`
2. Parser sees `{` → pushes `[null, {}]` (outer object frame)
3. Sees `"a"`, then `:` → sets `key = "a"`
4. Sees `,` → adds `{a: 1}` into the outer frame using `key` and the token before the comma
5. Sees `"b"`, then `:` → sets `key = "b"`
6. Sees `{` → pushes `["b", {}]` (inner object frame, remembering it belongs under `"b"`)
7. Sees `"c"`, then `:` → sets `key = "c"`
8. Sees `}` → finalizes `{c: 2}` in the inner frame, pops it, merges it into the outer frame under `"b"`
9. Final `}` completes the outer object → `{ a: 1, b: { c: 2 } }`

## Design Notes

- **Iterative, not recursive descent.** Most hand-written JSON parsers use [recursive descent](https://en.wikipedia.org/wiki/Recursive_descent_parser) (`parseValue` calling `parseObject`/`parseArray`, which call `parseValue` again for nested values), letting the call stack track nesting automatically. This parser instead tracks nesting manually with an explicit `stack` array, trading simplicity for direct control over parsing state.
- **Type resolution happens at the lexer/token level**, not as a separate pass — a token is already a `number`, `boolean`, `null`, or `string` (never a raw un-typed string requiring later interpretation), except for structural tokens (`{`, `}`, `[`, `]`, `:`, `,`) which remain characters.
- **Two separate "stacks" exist** and shouldn't be confused: the bracket-matching stack inside `lexer()` (pure validation, discarded after lexing) and the container-building stack inside `parser()` (drives actual object/array construction).

## Known Limitations

This implementation is a work in progress. Current known issues:

- **Shared `key` variable across nesting levels.** `key` is a single variable, not scoped per stack frame. Parsing keys inside a nested object/array can overwrite `key` before the outer level is done using it, since only the *parent-attachment* key is preserved per-frame (via the stack), not the *in-progress* key at each level.
- **The main parser loop stops one token early** (`i < tokens.length - 1`), with a separate special case for the final token. This special case only covers the object branch, so a top-level array literal (e.g. `[1, 2, 3]` with no wrapping object) isn't handled correctly, and it assumes the final value is a raw primitive rather than a nested structure.
- **Comma-handling assumes the previous token is always the literal value**, which breaks down when a property's value is itself a nested object/array — this is partially compensated for via an `i++` skip when a `}`/`]` is immediately followed by `,`, but the coupling between these two code paths is fragile.
- **No handling for a bare top-level primitive, string, or array** as the entire JSON document (only object-rooted documents are exercised so far).
- **No escape sequence handling** inside strings (e.g. `\"`, `\\`, `\n`, `\uXXXX` are not unescaped — they'd currently pass through literally or break quote-toggling).
- **No handling of `+`/scientific notation edge cases** in numbers beyond what `Number()` itself accepts loosely (e.g. `Number("")` behavior, leading `+`, etc. aren't explicitly validated).

## Possible Improvements

- Rewrite `parser` as recursive descent to avoid manual stack/key bookkeeping entirely.
- Scope `key` per stack frame instead of using one shared variable.
- Add string escape sequence handling in the lexer.
- Add tests covering: empty objects/arrays, deeply nested structures, top-level arrays, top-level primitives, trailing/leading whitespace, and malformed input (unterminated strings, mismatched brackets, trailing commas).
