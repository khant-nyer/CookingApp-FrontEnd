# Improvement suggestions by phase

This plan reviews the current TypeScript implementation and proposes high-confidence improvements aligned with your phased roadmap.

## Phase 1 (single PR)

### 1) Remove `src/react-local.d.ts`
- The project already ships with `@types/react` and `@types/react-dom`, and `tsconfig.json` includes official React types.
- Keeping this local shim creates risk of type drift (custom declarations can silently mask real React types and event contracts).
- Action:
  - Delete `src/react-local.d.ts`.
  - Keep `skipLibCheck` as-is for now (optional follow-up: eventually disable for stricter checks).

### 2) Standardize event typing
- Current code mixes proper React event types with many inline structural event types like `(e: { target: { value: string } }) => ...`.
- This lowers safety and readability, and makes refactors harder.
- Action:
  - Introduce shared aliases in `src/features/backend-explorer/types.ts`:
    - `InputChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>`
    - `InputKeyboardEvent = KeyboardEvent<HTMLInputElement>`
  - Replace inline event object types in:
    - `shared/ExplorerShared.tsx`
    - `modals/CreateEntityModal.tsx`
    - `modals/UpdateEntityModal.tsx`
  - Prefer named handlers (e.g., `onServingUnitChange`) over long inline setter lambdas for better testability.

### 3) Centralize nutrient normalization end-to-end
- `normalizeNutrientKey` is present and used in multiple places, but call-sites still duplicate value/unit shaping logic.
- Action:
  - Add a single utility `normalizeNutritionEntry` in `utils/nutrients.ts` that handles:
    - nutrient alias normalization,
    - numeric value coercion,
    - default unit fallback,
    - guard against invalid/empty values.
  - Reuse this utility in:
    - `useIngredientActions` (`addNutrition`),
    - update modal nutrition add flow in `BackendExplorer`,
    - payload mappers for create/update ingredient.
  - Add unit tests around invalid alias, lowercase alias, missing unit, and `NaN` cases.

### Suggested acceptance checks for Phase 1
- `npm run typecheck`
- `npm run test`
- `npm run lint`

---

## Phase 2 (single PR)

### Extract `useBackendExplorerController` from `BackendExplorer`
- `BackendExplorer.tsx` still coordinates substantial state and orchestration logic (selection state, modal state transitions, create/update/delete wrappers).
- Action:
  - Create `src/features/backend-explorer/hooks/useBackendExplorerController.ts`.
  - Move non-visual logic into the hook:
    - selected IDs/tabs,
    - modal open/close handlers,
    - update/delete confirmation flows,
    - tab wiring data.
  - Keep `BackendExplorer` as a composition/render shell that reads controller state + actions.
- Target outcome:
  - Smaller component focused on JSX and layout only,
  - reduced cognitive overhead for contributors,
  - simpler unit testing of orchestration logic.

### Suggested acceptance checks for Phase 2
- `npm run typecheck`
- `npm run test`
- Add hook-level tests for controller state transitions.

---

## Phase 3 (single PR)

### Split styles by feature and enforce import/path lint rules
- Styling is currently centralized (`src/styles.css`), which increases cascade risk and weakens feature ownership.
- Action:
  - Split into feature-scoped files, for example:
    - `src/styles/base.css`
    - `src/features/backend-explorer/styles/explorer.css`
    - `src/features/backend-explorer/styles/modals.css`
    - `src/features/backend-explorer/styles/tabs.css`
  - Import feature styles near feature entry points.
  - Add ESLint path boundary rules to keep backend-explorer internals contained (e.g., prevent deep relative imports from outside the feature root).
  - Add import ordering/path alias strategy (e.g., `@/features/...`) to reduce brittle `../../..` chains.

### Suggested acceptance checks for Phase 3
- `npm run lint`
- `npm run typecheck`
- visual smoke test in browser after style split.

---

## Phase 4 (optional)

### API client hardening
- `src/services/api.ts` is a strong candidate for resilience improvements.
- Recommended hardening:
  1. **Timeouts + abort support** (per-request default timeout).
  2. **Error envelope normalization** (single typed error object consumed by UI).
  3. **Auth header strategy** (central token getter/interceptor-style helper).
  4. **Retry policy for transient failures** (optional, conservative).
  5. **Request/response typing at the boundary** to reduce downstream unknowns.

### Suggested acceptance checks for Phase 4
- Unit tests for timeout and envelope mapping.
- Integration smoke test against API for auth and failure cases.

---

## Recommended sequencing details
1. **Phase 1 first** because it improves type integrity and removes noisy event annotations.
2. **Phase 2 next** to simplify `BackendExplorer` responsibilities before structural CSS and lint constraints.
3. **Phase 3 after controller extraction** so feature boundaries map naturally to style and import boundaries.
4. **Phase 4 when backend contract is stable** and UI error handling can adopt normalized envelopes cleanly.

## Risk notes
- Most regression risk is in modal update/create flows and nutrition transformation logic.
- Prioritize tests around payload mappers + reducer/controller transitions before/after each phase.
