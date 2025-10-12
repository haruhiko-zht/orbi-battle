# Repository Guidelines

## Project Structure & Module Organization

- `src/main.ts` initializes Phaser, the debug panel, and the `$orbi` window API.
- `src/render/` contains Phaser scenes; specs live beside code in `__tests__/`.
- `src/sim/` hosts the deterministic battle engine; unit tests mirror the folders.
- `src/ui/` manages the debug panel and DOM helpers; keep UI assets here.
- `src/config/defaults.ts` stores arena presets; tweak configs here rather than in scenes.
- `docs/` holds design notes; `dist/` is Vite output; `coverage/` contains Vitest reports (leave untracked).

## Build, Test, and Development Commands

- `npm install` — install dependencies after cloning or updating the lockfile.
- `npm run dev` — start Vite at `http://localhost:5173/` with hot reload.
- `npm run build` — create an optimized TypeScript-checked bundle in `dist/`.
- `npm run preview` — serve the production build locally for manual verification.
- `npm run test` — run the Vitest suite in the `happy-dom` runner.
- `npm run test:ui` — open the interactive Vitest UI for focused debugging.
- `npm run test:coverage` — emit HTML and lcov coverage to `coverage/`.

## Coding Style & Naming Conventions

- Use TypeScript with ES modules, two-space indentation, trailing semicolons, and double quotes.
- Name classes and scenes `PascalCase`; functions, variables, and files `camelCase`.
- Co-locate assets/tests with their modules and document tricky math or timing with brief comments.

## Testing Guidelines

- Place specs in `__tests__/` directories, named `*.test.ts`, matching the module path.
- Cover both pure simulation logic and render adapters; mock Phaser only when DOM rendering is impractical.
- Run `npm run test` before pushing; add `npm run test:coverage` when touching combat math or RNG.

## Commit & Pull Request Guidelines

- Follow the repo’s short, present-tense commit style; Japanese summaries are common and welcome.
- Keep each commit focused; add extra context in the body if behavior changes.
- PRs should describe the problem, solution, and tests run, and link issues when relevant.
- Provide screenshots or quick clips for gameplay or UI tweaks, ideally captured via `npm run preview`.
- Confirm the branch is rebased onto `main` and that CI passes before requesting review.

## Debug & Configuration Tips

- Adjust default teams in `src/config/defaults.ts`; avoid editing generated logs.
- The debug panel (`src/ui/debugPanel.ts`) relies on `window.$orbi.reset`; verify new controls in `npm run dev`.
- Reserve global exports for the `$orbi` namespace to keep the game window clean.

See also: `CLAUDE.md` for a deeper architecture overview and troubleshooting tips.

## Communication Guidelines

- ユーザーへの応答は日本語で行う（簡潔・丁寧・具体的）。
- 技術用語は一般的な日本語訳を優先し、英語原語も必要に応じ併記。
- コマンド・パスはバッククォートで記載し、再現手順を短く提示。
