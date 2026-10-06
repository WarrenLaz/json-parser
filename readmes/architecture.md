# Architecture

Everything lives in `index.ts`. There are four functions, plus a `PUNCT` constant:

```
json(raw)
  └─ lexer(raw)        → token array          (uses typeResolver)
  └─ parser(tokens)    → JS value             (uses createNewEntry)
```

## 1. `typeResolver`

```ts
function typeResolver(token: string): any
```

Converts a raw, unquoted literal (a token that was *not* inside quotes) into a typed value:

- If `Number(token)` is not `NaN` and the token isn't blank, it returns `Number(token)`
- `"null"` → `null`
- `"true"` / `"false"` → `true` / `false`
- Anything else is returned unchanged, as a string

Quoted strings never pass through `typeResolver`. The lexer pushes them as-is, so `"123"` stays the string `"123"`.

## 2. `lexer`

```ts
function lexer(raw: string): Array<any>
```

The lexer scans the input one character at a time and produces a flat token array. Each token is one of:

- a string value, already unquoted
- a structural character: `{`, `}`, `[`, `]`, `:`, `,`
- a primitive resolved by `typeResolver`: a `number`, `boolean`, or `null`

For each character, it does the following:

1. **Quotes.** A `"` toggles `isQuote`. On the closing quote, the accumulated `word` is pushed as a token.
2. **Inside a string,** every character is appended to `word` literally.
3. **Whitespace** outside strings is skipped.
4. **Brackets** (`{ } [ ]`, plus `( )`) are checked against a bracket stack using a `closeToOpen` map. A mismatch throws `SyntaxError("Invalid JSON: Mismatched brackets")`. Every bracket is also pushed as a token.
5. **Separators** `:` and `,` are pushed as tokens.
6. **Any other character** is appended to `word`. The lexer peeks at the next character. If that character is whitespace, a bracket, a separator, a quote, or the end of input, the literal is complete: it goes through `typeResolver` and is pushed as a token.

At the end, an open string or a non-empty bracket stack throws `SyntaxError("Invalid JSON: Unclosed structure")`.

The bracket stack only validates the input. It is discarded after lexing and is separate from the parser's container stack.

## 3. `parser`

```ts
function parser(tokens: Array<any>): Object
```

The parser builds the value iteratively, without recursion. It keeps this state:

| State | Meaning |
| --- | --- |
| `stack: Array<[key, container]>` | Open containers. Each frame pairs the object `{}` or array `[]` being built with the key it will be stored under in its parent. The top frame is the current container. |
| `key` | The most recently read object key |
| `result` | The finished top-level value |
| `expect` | Which token is allowed next: `"value"`, `"valueOrClose"`, `"key"`, `"keyOrClose"`, `"colon"`, `"commaOrClose"`, or `"end"` |

### Helpers

- **`addValue(k, value)`** places a finished value. With an empty stack, the value becomes `result` and `expect = "end"`. Otherwise the value is pushed onto the top array, or stored on the top object under `k` via `createNewEntry`. Then `expect = "commaOrClose"`.
- **`close()`** pops the top frame and calls `addValue(frameKey, container)`, which attaches the finished container to its parent (or makes it the result).
- **`createNewEntry(obj, key, value)`** returns `{ ...obj, [key]: value }`. It creates a new object rather than mutating, so the caller reassigns it into the stack frame. Arrays, by contrast, are mutated in place with `.push()`.

### State transitions

| `expect` | Accepted token | Action → next `expect` |
| --- | --- | --- |
| `value` / `valueOrClose` | `{` | push `[key, {}]` → `keyOrClose` |
| | `[` | push `[key, []]` → `valueOrClose` |
| | `]` (only `valueOrClose`) | empty array: `close()` |
| | primitive or string | `addValue(key, token)` |
| | other punctuation | throws `Unexpected "X"` |
| `key` / `keyOrClose` | `}` (only `keyOrClose`) | empty object: `close()` |
| | non-punctuation string | `key = token` → `colon` |
| `colon` | `:` | → `value` |
| `commaOrClose` | `,` | → `value` in arrays, `key` in objects |
| | matching `]` / `}` | `close()` |
| `end` | anything | throws `Unexpected trailing token` |

If the loop ends while `expect !== "end"`, the parser throws `Unexpected end of input`.

## 4. `json` (entry point)

```ts
export function json(raw: string): Object {
  let tokens: Array<any> = lexer(raw);
  return parser(tokens);
}
```

## Worked example

Input: `{ "a": 1, "b": { "c": 2 } }`

Tokens: `["{", "a", ":", 1, ",", "b", ":", "{", "c", ":", 2, "}", "}"]`

| Token | Action | Stack (container part) | `expect` after |
| --- | --- | --- | --- |
| `{` | push `[null, {}]` | `[{}]` | keyOrClose |
| `"a"` | key = `a` | | colon |
| `:` | | | value |
| `1` | `a: 1` | `[{a:1}]` | commaOrClose |
| `,` | | | key |
| `"b"` | key = `b` | | colon |
| `:` | | | value |
| `{` | push `["b", {}]` | `[{a:1}, {}]` | keyOrClose |
| `"c"` `:` `2` | `c: 2` | `[{a:1}, {c:2}]` | commaOrClose |
| `}` | pop, attach under `b` | `[{a:1, b:{c:2}}]` | commaOrClose |
| `}` | pop, becomes `result` | `[]` | end |

Result: `{ a: 1, b: { c: 2 } }`

## Design notes

- **Iterative instead of recursive descent.** Nesting is tracked with an explicit stack, so deeply nested input cannot overflow the call stack.
- **Each frame keeps its parent key.** Each frame stores the key it belongs under, so an inner object's keys can overwrite `key` without breaking where the inner container attaches to its parent. (An earlier version of the project had a shared-`key` bug; this design avoids it.)
- **The `expect` state machine validates grammar.** It rejects trailing commas, missing colons, missing separators, non-string keys, and trailing tokens.
- **Typing happens in the lexer.** Tokens arrive at the parser already typed.
