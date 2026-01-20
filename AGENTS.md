# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the React app: route-level screens in `src/pages`, reusable UI in `src/components` (with subfolders like `components/ui` and `components/modals`), shared state in `src/store` (Zustand), API/data helpers in `src/services`, utilities in `src/utils`, and types in `src/types`. Entry points are `src/main.tsx` and `src/App.tsx`.
- `public/` contains static assets, `index.html` is the Vite entry template, and `dist/` is the production build output.
- `functions/` contains local Node scripts such as `parse-wechat.js` and `proxy.js` and is not bundled into the client build.
- Tooling/config lives in `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, and `tsconfig*.json`. Local overrides belong in `.env.local`.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server for local development.
- `npm run build` runs `tsc -b` and produces a production build in `dist/`.
- `npm run preview` serves the `dist/` build locally to verify production behavior.

## Coding Style & Naming Conventions
- TypeScript + React with Tailwind CSS utility classes for styling; global styles live in `src/index.css`.
- Indentation is 2 spaces, single quotes are preferred, and semicolons are omitted (match existing `src/*.tsx`).
- Component and page filenames are PascalCase (e.g., `HomePage.tsx`, `Layout.tsx`); folders are lowercase.
- Keep page-level orchestration in `src/pages` and reusable UI in `src/components`; name store hooks `useXStore`.

## Testing Guidelines
- No automated test framework or coverage thresholds are configured yet.
- If you introduce tests, use `*.test.ts(x)` naming and colocate with the feature or add a `__tests__/` folder; document new test commands here.

## Commit & Pull Request Guidelines
- Recent history favors short, descriptive subjects (e.g., `Update README.md`) with occasional `type:` prefixes (`add:`, `chore:`). Keep messages concise and consistent with that pattern.
- PRs should include a brief summary, screenshots for UI changes, and links to related issues when applicable.
- Call out breaking changes or required migrations in the PR description.

## Security & Configuration Tips
- Use `.env.local` for machine-specific settings; Vite loads variables prefixed with `VITE_` or `PROXY`.
- Do not commit secrets; add new local config files to `.gitignore` if needed.