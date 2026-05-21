# DecoTV — Agentic Coding Guide

## Project Overview

DecoTV is a Next.js 16 + Tailwind CSS 4 + TypeScript 5 cross-platform media aggregation player. It supports multi-source search, online playback, favorites, play history, cloud storage, CMS proxy, and privacy defense.

## Environment

- **Runtime**: Node.js >= 18, pnpm@10.14.0 (see `packageManager` in package.json)
- **Package manager**: `pnpm` (never npm/yarn)
- **TypeScript**: strict mode, `target: es5`, `moduleResolution: bundler`
- **Framework**: Next.js 16 (App Router, Turbopack, RSC)
- **CSS**: Tailwind CSS 4 with PostCSS, `prettier-plugin-tailwindcss`

## Build / Lint / Test Commands

| Command             | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | Start dev server on 0.0.0.0                          |
| `pnpm build`        | Production build (not Vercel: outputs static export) |
| `pnpm start`        | Start production server                              |
| `pnpm lint`         | Run ESLint (Next.js defaults)                        |
| `pnpm lint:fix`     | ESLint fix + Prettier format                         |
| `pnpm lint:strict`  | ESLint with `--max-warnings=0`                       |
| `pnpm typecheck`    | `tsc --noEmit`                                       |
| `pnpm test`         | Run all Jest tests                                   |
| `pnpm test:watch`   | Jest watch mode                                      |
| `pnpm format`       | Prettier write all                                   |
| `pnpm format:check` | Prettier check only                                  |
| `pnpm docker:build` | Docker build                                         |
| `pnpm docker:run`   | Docker run on port 3000                              |

**Note**: There are no test files yet (`src/__tests__/` does not exist). Tests use **Jest** + **@testing-library/react** with `next/jest`. Config in `jest.config.js`, setup in `jest.setup.js`.

To run a **single test file**: `pnpm test -- src/path/to/file.test.ts`

## Code Style

### Imports (enforced by `eslint-plugin-simple-import-sort`)

Import order groups:

1. External packages (`react`, `next/*`, `lucide-react`, etc.)
2. CSS files (`*.css`)
3. `@/lib`, `@/hooks` (internal libs and hooks)
4. `@/data`
5. `@/components`, `@/container`
6. `@/store`
7. Other `@/` imports
8. Relative imports (`./`, `../`)
9. `@/types`

No empty lines between group members. Separate groups with a blank line.

### Formatting (Prettier)

- `singleQuote: true`, `jsxSingleQuote: true`
- `tabWidth: 2`, `semi: true`
- `arrowParens: always`
- Trailing commas follow default (es5)
- Tailwind class ordering via `prettier-plugin-tailwindcss`

### TypeScript Conventions

- **strict: true** — do not loosen
- Use path aliases: `@/` maps to `src/`, `~/` maps to `public/`
- Prefer `interface` over `type` for object shapes
- Export types/interfaces used across files
- Use `type` keyword for type-only imports: `import type { Foo } from './bar'`
- Generics written as `<T>` not `<T,>` (unless needed for TSX)
- No `any` — use `unknown` and narrow with type guards; eslint warns on `any`
- Unused vars prefixed with `_` to suppress warnings
- No non-null assertions (`!`); eslint warns

### React Conventions

- Client components use `'use client'` directive at top
- Components use named function declarations, not arrow expressions
- Props typed with `interface` and exported
- Use `forwardRef` + `memo` for performance-sensitive components
- `useCallback` and `useMemo` for referential stability (hooks deps tracked by eslint)
- Error states handled with try/catch, not `.catch()`
- CSS-in-JS via Tailwind classes in `className`; avoid inline `style` blocks except for dynamic values
- No default React import needed (automatic JSX transform)

### Naming Conventions

- **Files**: `kebab-case.ts` for libs, `PascalCase.tsx` for components
- **Functions/classes**: `camelCase` (helpers), `PascalCase` (components/classes)
- **Types/Interfaces**: `PascalCase` prefixed with domain (e.g., `TmdbMovieDetail`, `VideoCardProps`)
- **Constants**: `UPPER_SNAKE_CASE` for magic values, `camelCase` for module-level state
- **Hooks**: `camelCase` prefixed with `use` (`useBrowseVideos`, `useLongPress`)
- **Async functions**: `camelCase` with verb prefix (`fetchTmdb`, `tmdbGetMovieDetail`)

### Error Handling

- Custom error classes extending `Error` with `name` set in constructor
- Typed error `code` property (union of string literals)
- AbortController + setTimeout for timeout-safe fetches
- Language fallback pattern for data fetching (zh-CN → en-US)
- Errors are thrown, not returned; caught at caller

### File Organization

```
src/
  app/          # Next.js App Router pages
  components/   # Reusable React components
  contexts/     # React context providers
  hooks/        # Custom React hooks
  lib/          # Shared utilities, API clients, types
  types/        # Global type declarations
```

### Testing

- Jest with `@testing-library/react`
- Setup in `jest.setup.js` (extends jest-dom matchers, mocks next/router)
- Path alias `@/` resolved via `moduleNameMapper`
- SVG files mocked via `src/__mocks__/svg.tsx`
- Test env: `jest-environment-jsdom`

## Git / Commit Convention

- Conventional commits via commitlint (`@commitlint/config-conventional`)
- Allowed types: `feat`, `fix`, `docs`, `chore`, `style`, `refactor`, `ci`, `test`, `perf`, `revert`, `vercel`
- Husky runs lint-staged on commit (ESLint + Prettier on `src/**/*.{js,jsx,ts,tsx}`, Prettier on others)
