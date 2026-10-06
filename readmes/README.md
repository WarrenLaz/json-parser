# TS JSON Parser

A hand-written JSON parser implemented in TypeScript, built from scratch without using `JSON.parse`. It is split into two stages, matching classic parser design:

1. a **lexer** that tokenizes raw JSON text, and
2. a **parser** that turns those tokens into an in-memory JavaScript value, using an explicit (non-recursive) container stack driven by a small state machine.

```
raw JSON string --> lexer() --> token list --> parser() --> JS value
```

- **Package name:** `json-parser` (version `0.0.1`, ISC license)
- **Entry point:** `index.ts`, which exports a single function, `json(raw: string)`
- **Repository:** <https://github.com/WarrenLaz/json-parser>

## Documentation

| Document | Contents |
| --- | --- |
| [Installation](installation.md) | Requirements, installing dependencies, running the code |
| [Usage](usage.md) | The `json()` API, supported input, return values, and errors |
| [Architecture](architecture.md) | How `typeResolver`, `lexer`, and `parser` work internally |
| [Configuration](configuration.md) | `package.json` scripts, Jest, TypeScript config, and environment variables |
| [Testing](testing.md) | The test suite and its fixtures |
| [CI: README auto-update workflow](ci-workflow.md) | The GitHub Actions workflow that regenerates this `readmes/` folder |
| [Known Limitations](known-limitations.md) | Deviations from the JSON spec and possible improvements |

## Quick start

```bash
git clone https://github.com/WarrenLaz/json-parser.git
cd json-parser
npm install
npm test
```

```ts
import { json } from "./index.ts";

const result = json(`{ "a": 1, "b": { "c": [true, null, "x"] } }`);
// => { a: 1, b: { c: [true, null, "x"] } }
```

## Project layout

```
.
├── index.ts                 # lexer, parser, and the exported json() function
├── tests/
│   ├── json.test.ts         # Jest test suite
│   └── jsons/item00{1..5}.json  # JSON fixtures used by the tests
├── package.json             # scripts, Jest config, dependencies
├── tsconfig.json            # TypeScript compiler options (type-check only)
├── .github/workflows/01-building-blocks.yaml  # README auto-update workflow
├── README.md                # original top-level README
└── readmes/                 # this documentation
```
