# Testing

Run the suite with:

```bash
npm test
```

This runs Jest over `tests/`, with `@swc/jest` transforming the TypeScript. See [Configuration](configuration.md).

## Test suite: `tests/json.test.ts`

- A `beforeAll` hook reads the fixtures `tests/jsons/item001.json` … `item005.json`, resolving paths from `process.cwd()`. **Run the tests from the repository root.** If a fixture is missing, the hook logs `NO FILE EXISTS:` instead of failing.
- **Tests 001–004** check that `json(fixture)` deep-equals `JSON.parse(fixture)`. In other words, the built-in parser is the reference implementation.
- **Test 5** expects `json(item005)` to throw a `SyntaxError`.

## Fixtures (`tests/jsons/`)

| File | Contents | Expectation |
| --- | --- | --- |
| `item001.json` | A flat user record with a nested `address` object, a boolean, a number, and `null` | Matches `JSON.parse` |
| `item002.json` | The classic "glossary" example: deep nesting, a string array, tab indentation | Matches `JSON.parse` |
| `item003.json` | The "widget" example: numbers, and strings containing `(`, `)`, `.`, `;`, `/` | Matches `JSON.parse` |
| `item004.json` | The "menu" example with leading whitespace and an array of objects | Matches `JSON.parse` |
| `item005.json` | The same "menu" document, without leading whitespace | Expected to throw |

## Known issues with the tests

- **`item005.json` is valid JSON.** It is the same as `item004.json` minus the leading whitespace, so `json()` parses it successfully and the "throws on invalid JSON" test fails as written. To make that test meaningful, `item005.json` needs to contain malformed JSON, such as a trailing comma or a mismatched bracket.
- **The test-5 title is evaluated too early.** Its title interpolates `jsonFILES[4]`, which is evaluated when the test is defined, before `beforeAll` runs. The title therefore always reads `throws on invalid JSON undefined`.
- **Untested inputs.** The suite has no tests for top-level arrays or primitives, empty containers, or the specific error messages, even though the parser supports these. See [Usage](usage.md).
