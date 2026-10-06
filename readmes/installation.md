# Installation

## Requirements

- **Node.js** and **npm**. The project is an ES module (`"type": "module"` in `package.json`) written in TypeScript.
- To run `index.ts` directly with Node (without a build step), use a Node version that supports TypeScript type stripping. Node 23.6+ does this by default; Node 22.6+ needs the `--experimental-strip-types` flag. Alternatively, use a runner such as `tsx`.

## Install

```bash
git clone https://github.com/WarrenLaz/json-parser.git
cd json-parser
npm install
```

### Dependencies

Development dependencies (from `package.json`):

| Package | Purpose |
| --- | --- |
| `jest` | Test runner |
| `@swc/jest` | Transforms `.ts`/`.tsx` test files for Jest |
| `@types/jest`, `@types/node` | Type definitions |
| `typescript` | Type checking (`tsconfig.json` sets `noEmit`) |

Runtime dependency:

| Package | Notes |
| --- | --- |
| `@opensource-technologies/typescript-data-structure-library` | Listed in `package.json`, but it is **not imported** by `index.ts`. The parser has no runtime dependencies in practice. |

## Building

There is no build script. `tsconfig.json` sets `"noEmit": true` (and `"allowImportingTsExtensions": true`), so the TypeScript compiler is used only for type checking:

```bash
npx tsc --noEmit -p .
```

The package's `main` field points directly at `index.ts`, so consumers need a TypeScript-aware loader or bundler.

## Running

The library has no CLI. To try it out, write a small script:

```ts
// try.ts
import { json } from "./index.ts";
console.log(json('{"hello": ["world", 1, true, null]}'));
```

```bash
node try.ts                              # Node 23.6+
node --experimental-strip-types try.ts   # Node 22.6+
```

To run the tests, see [Testing](testing.md).
