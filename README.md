# AI Pitch Master

AI Pitch Master is a feature-based React application for AI-assisted speech practice and pitch training.

## Tech Stack

- React
- Vite
- TypeScript
- TailwindCSS
- Zustand
- React Router

## Folder Architecture

### `src/pages`
Route-level screens. Pages should stay thin and focus on composition, layout, and page-specific orchestration.

### `src/features`
Business-domain features. Each feature owns its UI, local state, types, and optional API helpers.

### `src/components`
Reusable UI and layout primitives shared across pages and features.

Layout primitives now include `AppShell`, `SidebarNav`, and `TopStatusBar` for the SaaS frame.

### `src/hooks`
Shared custom hooks such as persistence, effects, and browser utilities.

### `src/api`
HTTP client setup and domain-specific API modules.

### `src/store`
Global Zustand stores for cross-cutting application state.

### `src/types`
Shared TypeScript types and utility aliases used across the app.

## Starter Files

- `src/App.tsx` – router shell
- `src/components/layout/AppShell.tsx` – shared app frame
- `src/components/layout/SidebarNav.tsx` – reusable sidebar navigation
- `src/components/layout/TopStatusBar.tsx` – reusable top status bar
- `src/components/ui/Button.tsx` – reusable action button
- `src/components/ui/Card.tsx` – reusable surface container
- `src/features/pitch-session/*` – example pitch training feature
- `src/pages/DashboardPage.tsx` – dashboard screen
- `src/pages/UploadTrainingPage.tsx` – training upload screen
- `src/pages/AiQaSessionPage.tsx` – guided AI Q&A screen
- `src/pages/ReportsPage.tsx` – analytics screen
- `src/pages/NotFoundPage.tsx` – fallback route
- `src/hooks/useLocalStorage.ts` – browser storage helper
- `src/api/client.ts` – fetch wrapper
- `src/store/useAppStore.ts` – app-level Zustand store
- `src/types/common.ts` – shared types

## How the Architecture Scales

1. Keep route screens in `pages` and move any heavy logic into a feature.
2. Put domain-specific state into the feature folder instead of page components.
3. Reserve `components/ui` for truly reusable primitives only.
4. Place API calls next to the feature or in `src/api` if they are shared.
5. Export from `index.ts` files when a folder becomes a stable public surface.

## Start Development

```bash
npm install
npm run dev
```

## DEMO_MODE

The application supports a DEMO_MODE for development and testing without a backend server.

### Enable DEMO_MODE

Choose one of the following methods:

1. **Environment Variable**: Set `VITE_DEMO_MODE=true` in `.env` or `.env.local`
   ```
   VITE_DEMO_MODE=true
   ```

2. **URL Query Parameter**: Add `?demo=true` to the URL
   ```
   http://localhost:5173/?demo=true
   ```

### What DEMO_MODE Does

- ✅ Skips real API calls to the backend
- ✅ Returns mock responses matching `api-spec.md`
- ✅ Simulates network delays (200-1000ms) for realistic UX
- ✅ Maintains identical UI behavior
- ✅ Logs a console warning when active

### Mock Data

Mock data is defined in `src/mocks/` with realistic responses for:

- Presentation analysis (speaking metrics, script extraction)
- AI Q&A roleplay (initial question, follow-up questions)
- Comprehensive feedback reports
- Session cleanup

See `src/mocks/mockData.ts` for the complete mock response schemas.

## Build

```bash
npm run build
```
