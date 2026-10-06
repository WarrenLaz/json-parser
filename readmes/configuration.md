# Configuration

The library has no runtime configuration: no options, config files, or environment variables. `json()` takes a single string argument. The settings below are project and tooling configuration.

## npm scripts (`package.json`)

| Script | Command | Description |
| --- | --- | --- |
| `test` | `jest` | Runs the Jest test suite in `tests/` |

There are no `build`, `start`, or `lint` scripts.

## Jest (`package.json` → `jest`)

```json
"jest": {
  "roots": ["./tests"],
  "transform": { "^.+\\.tsx?$": "@swc/jest" }
}
```

- Tests are discovered only under `tests/`.
- TypeScript files are transformed with `@swc/jest`.

## TypeScript (`tsconfig.json`)

| Option | Value | Effect |
| --- | --- | --- |
| `target` | `es6` | Language level for type checking |
| `moduleResolution` | `node` | Node-style module resolution |
| `esModuleInterop` | `true` | Default imports from CommonJS modules |
| `types` | `["node", "jest"]` | Global types for Node and Jest |
| `allowImportingTsExtensions` | `true` | Allows `import ... from '../index.ts'` |
| `noEmit` | `true` | Type-check only; nothing is written to `outDir` |
| `sourceMap`, `outDir: "dist"` | | Have no effect while `noEmit` is set |

Note that `"lib": ["es2015"]` is placed at the top level of `tsconfig.json` rather than inside `compilerOptions`, so TypeScript ignores it.

## Environment variables

The parser and tests don't read any environment variables.

The only environment variables in the repository belong to the GitHub Actions workflow that regenerates these docs (`VM_HOST`, `VM_USER`, `REPO_DIR`, `BRANCH`, `SOURCE_SHA`, `DOCS_DIR`). See [CI workflow](ci-workflow.md).
