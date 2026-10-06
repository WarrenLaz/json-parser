# Usage

## API

`index.ts` exports a single function:

```ts
export function json(raw: string): Object
```

It lexes and parses `raw` and returns the resulting JavaScript value. It throws a `SyntaxError` on malformed input.

> Even though the declared return type is `Object`, the function returns whatever the top-level JSON value is. That can be an object, an array, a string, a number, a boolean, or `null`.

```ts
import { json } from "./index.ts";

json(`{
  "glossary": {
    "title": "example glossary",
    "GlossDiv": { "title": "S", "GlossSeeAlso": ["GML", "XML"] }
  }
}`);
// => { glossary: { title: "example glossary", GlossDiv: { title: "S", GlossSeeAlso: ["GML", "XML"] } } }

json(`[1, 2, 3]`);   // => [1, 2, 3]
json(`{}`);          // => {}
json(`[]`);          // => []
json(`42`);          // => 42
json(`"hi"`);        // => "hi"
json(`null`);        // => null
```

## What is supported

- Objects `{ ... }` and arrays `[ ... ]`, including empty ones and arbitrary nesting
- Any value at the top level (object, array, string, number, `true`, `false`, `null`)
- Strings (quoted with `"`)
- Numbers: anything that JavaScript's `Number()` accepts, such as `-1`, `3.14`, `1e5`
- `true`, `false`, `null`
- Whitespace between tokens, including leading and trailing whitespace
- Duplicate object keys, where the last value wins

## Errors

All errors are thrown as `SyntaxError`. The `N` in the messages below is the **token index**, not the character offset.

| Message | Raised by | Cause |
| --- | --- | --- |
| `Invalid JSON: Mismatched brackets` | lexer | A closing `}`, `]`, or `)` that doesn't match the most recent opener |
| `Invalid JSON: Unclosed structure` | lexer | An unterminated string, or brackets left open at the end of input |
| `Invalid JSON: Expected ":" at token N` | parser | An object key that is not followed by `:` |
| `Invalid JSON: Expected string key at token N` | parser | An object key position holds a number, boolean, `null`, or punctuation |
| `Invalid JSON: Expected "," or "}" at token N` (or `"]"`) | parser | A missing separator between members or elements |
| `Invalid JSON: Unexpected "X" at token N` | parser | Punctuation where a value was expected, such as a trailing comma (`[1,]`) or a leading comma |
| `Invalid JSON: Unexpected trailing token at N` | parser | Extra tokens after a complete top-level value, such as `{} {}` or `1 2` |
| `Invalid JSON: Unexpected end of input` | parser | Empty input, or input that ends before the value is complete |

```ts
try {
  json(`{"a": 1,}`);
} catch (e) {
  // SyntaxError: Invalid JSON: Expected string key at token 5
}
```

## Caveats

The parser is lenient in some places and rejects some valid JSON in others. Examples include unquoted barewords, strings that contain `{`, `:`, or `,`, and escape sequences. See [Known Limitations](known-limitations.md) before relying on it for untrusted or arbitrary input.
