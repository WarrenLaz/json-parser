# Known Limitations

The parser follows the JSON grammar (RFC 7159 per `package.json`) for typical documents, but it deviates from the spec in the cases below.

## Rejects or mis-parses valid JSON

- **No escape sequences.** Inside strings, `\"`, `\\`, `\n`, `\uXXXX`, and others are not interpreted. A backslash is kept literally, and an escaped quote `\"` *ends* the string, which usually leads to a `SyntaxError`.
- **Strings that equal a punctuation character.** The lexer drops the quotes, so the parser cannot tell the string `":"` apart from the token `:`. Any string value or key that is exactly `{`, `}`, `[`, `]`, `:`, or `,` is misread. For example, `{"a": ","}` throws, and `{"a": "{"}` is treated as an opening brace. Longer strings that merely contain these characters, such as `"a,b"`, work fine.

## Accepts invalid JSON (lenient)

- **Unquoted barewords become strings.** `typeResolver` returns unrecognized literals unchanged, so `{abc: def}` parses to `{ abc: "def" }`.
- **Numbers use `Number()` semantics.** Anything `Number()` accepts is treated as a number, including `0x1F` (31), `Infinity`, `.5`, `5.`, `01`, and `+1`. `NaN` becomes the string `"NaN"`.
- **Parentheses count as brackets in the lexer.** Mismatched `(`/`)` raise `Mismatched brackets`. Balanced parentheses outside strings pass the lexer, but the parser then rejects them.

## Other notes

- **Error positions are token indices.** The `N` in `... at token N` counts tokens, not characters or lines.
- **Objects are copied on every insertion.** `createNewEntry` copies the whole object with spread for each new key, which makes building an object with *n* keys O(n²).
- **The return type is too narrow.** `json()` is typed as returning `Object`, but it can also return primitives and `null`.

## Possible improvements

- Tag string tokens, for example as `{ type: "string", value }`, so they can't be confused with punctuation.
- Handle escape sequences in the lexer.
- Validate number literals against the JSON number grammar, and reject unquoted barewords.
- Mutate objects in place, as the parser already does for arrays.
- Report character offsets, or line and column, in error messages.
- Widen the return type, for example to `unknown` or a `JSONValue` union.
- Fix the test-suite issues described in [Testing](testing.md).
