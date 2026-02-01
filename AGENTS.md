# AGENTS.md

## Commands
- Build: `go build ./cmd/build`
- WASM: `GOOS=js GOARCH=wasm go build -o main.wasm ./cmd/wasm`
- Test all: `go test ./...`
- Test single: `go test ./pkg/markdown -run TestName`
- Typecheck: `go vet ./...`
- Web lint: `npm run lint` (in `web/`)
- Web format: `npm run fmt` (in `web/`)
- Web test: `npm run test` (in `web/`, uses Vitest)
- Web typecheck: `npm run check` (in `web/`)

## Architecture
- `cmd/build/` - Static site generator CLI
- `cmd/wasm/` - WebAssembly module for browser markdown parsing
- `pkg/markdown/` - Markdown parsing library
- `pkg/router/` - URL routing
- `pkg/ssg/` - Static site generation core
- `web/site/` - Site templates (islands/, layouts/)
- `web/ui/` - Lit-based UI components (import as `@ui/*`)

## Code Style
- Go: standard library style, `gofmt`, table-driven tests with `t.Run()`
- Error handling: return errors, don't panic
- TypeScript: tabs, single quotes, semicolons (Biome + ESLint)
