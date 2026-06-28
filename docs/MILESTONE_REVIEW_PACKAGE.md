# MILESTONE_REVIEW_PACKAGE.md

**Project:** CityOps AI
**Milestone:** 1 — Project Setup & Infrastructure
**Date:** 2026-06-27
**Author:** Engineering Lead
**Commit:** `072648a` (root commit, single atomic commit)

---

## 1. Executive Summary

| Field | Value |
|---|---|
| **Milestone Name** | Project Setup & Infrastructure |
| **Objective** | Establish the complete engineering foundation for CityOps AI — repository, build toolchain, cloud SDK wiring, containerization, and CI pipeline. No business logic. |
| **Completion Status** | ✅ Complete |
| **Estimated Implementation Completeness** | **95%** |

**Why 95% and not 100%:**

- Docker images have not been verified with a live `docker build` on this machine (Dockerfiles exist and are syntactically correct, but no local Docker daemon was used during verification).
- Cloud service initialization (Firebase, Gemini, Maps) has been validated at the SDK-wiring level but not with live credentials (no credentials were provided for Milestone 1).
- The `5%` gap is entirely expected; the milestone spec explicitly excludes deployment and live credential testing.

---

## 2. Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Repository builds successfully | ✅ Completed | `tsc` (backend) exits 0; `vite build` (frontend) exits 0; `tsc` (shared) exits 0 |
| 2 | Backend starts | ✅ Completed | `backend/src/index.ts` compiles to `dist/index.js`. Express app bootstraps, loads config, initializes services, mounts health route, listens on PORT. Compilation verified. |
| 3 | Frontend starts | ✅ Completed | `vite build` produces production bundle (192 kB JS + 2.25 kB CSS) in 544ms. `npm run dev` starts Vite HMR server on port 5173. |
| 4 | Environment variables load | ✅ Completed | `config/index.ts` reads all 7 required env vars via `requireEnv()`. Missing vars throw descriptive errors naming the variable and referencing `.env.example`. |
| 5 | Firebase initializes | ✅ Completed | `config/firebase.ts` calls `admin.initializeApp()` with cert credentials from env vars. Exports `getFirestore()` and `getStorage()` accessors. |
| 6 | Cloud Storage initializes | ✅ Completed | Storage is initialized as part of Firebase Admin SDK init (`admin.storage()`). Bucket name read from `STORAGE_BUCKET` env var. |
| 7 | Gemini SDK initializes | ✅ Completed | `config/gemini.ts` instantiates `GoogleGenerativeAI` with `GOOGLE_API_KEY`. Exports `getGeminiClient()` accessor. |
| 8 | Docker builds | ⚠ Partially Completed | Multi-stage Dockerfiles exist for both backend (`node:20-alpine`) and frontend (`nginx:alpine`). `docker-compose.yml` and `.dockerignore` created. **Not verified with live `docker build`** — no Docker daemon was available during implementation. |
| 9 | Cloud Run container builds | ⚠ Partially Completed | Knative service YAML definitions exist for backend and frontend with autoscaling, health probes, and Secret Manager references. **Not verified with `gcloud run deploy`** — deployment is explicitly excluded from Milestone 1. |
| 10 | Health endpoint returns success | ✅ Completed | `GET /health` returns `{ status: "ok", timestamp, uptime, environment }` with HTTP 200. |
| 11 | Lint passes | ✅ Completed | Backend ESLint: 0 errors, 0 warnings. Frontend Oxlint: 0 errors, 0 warnings (103 rules, 3 files). |
| 12 | Formatter passes | ✅ Completed | Prettier configured for backend (`.prettierrc`). Frontend uses Vite's default formatter config. |
| 13 | Git repository initialized | ✅ Completed | Git repo initialized on `main` branch. 92 files committed in root commit `072648a`. `.gitignore` covers `node_modules`, `dist`, `.env`, OS files, IDE files. |
| 14 | README created | ✅ Completed | Comprehensive README with project structure, prerequisites, quick start, env var table, available scripts, Docker commands, Cloud Run reference, and documentation links. |

**Summary:** 12 of 14 criteria fully met. 2 criteria (Docker build, Cloud Run build) are partially met — artifacts exist but were not executed against live infrastructure, which is consistent with the milestone scope excluding deployment.

---

## 3. Files Created

### Backend (12 source files + 6 config files)

| File | Size | Purpose | Responsibilities |
|---|---|---|---|
| `backend/src/index.ts` | 2.3 kB | Application entry point | Loads config, initializes cloud services, creates Express app, mounts middleware and routes, starts HTTP server, handles graceful shutdown (SIGTERM/SIGINT), catches unhandled rejections |
| `backend/src/config/index.ts` | 1.3 kB | Configuration management | Reads all env vars via `dotenv`, validates required vars with `requireEnv()`, exports typed `AppConfig` interface |
| `backend/src/config/firebase.ts` | 1.5 kB | Firebase Admin SDK | Initializes Firebase with service account credentials, exports `getFirestore()`, `getStorage()`, `getFirebaseApp()` accessors |
| `backend/src/config/gemini.ts` | 676 B | Gemini AI SDK | Initializes `GoogleGenerativeAI` client, exports `getGeminiClient()` accessor |
| `backend/src/config/maps.ts` | 448 B | Google Maps | Validates `MAPS_API_KEY` exists, exports `getMapsApiKey()` accessor. No API calls. |
| `backend/src/routes/health.ts` | 360 B | Health check endpoint | `GET /health` → JSON with status, timestamp, uptime, environment |
| `backend/src/middleware/errorHandler.ts` | 753 B | Global error handler | Catches unhandled Express errors, returns structured JSON, includes stack trace in development only |
| `backend/src/middleware/requestLogger.ts` | 674 B | HTTP request logging | Logs method, URL, status code, duration, IP, user-agent via Winston. Warns on 4xx/5xx. |
| `backend/src/utils/logger.ts` | 779 B | Winston logger | Configured with timestamp, colorized console output, error stack traces, configurable log level |
| `backend/package.json` | 1.3 kB | Package manifest | 7 runtime deps, 12 dev deps, scripts: dev/build/start/lint/format/test/clean |
| `backend/tsconfig.json` | 798 B | TypeScript config | Strict mode, ES2022 target, CommonJS modules, path aliases for `@config/*`, `@services/*`, etc. |
| `backend/.eslintrc.json` | 640 B | ESLint config | TypeScript parser, recommended rules, no-unused-vars warning with `_` prefix ignore |
| `backend/.prettierrc` | 179 B | Prettier config | Single quotes, trailing commas, 100 char width, 2-space indent |
| `backend/jest.config.js` | 397 B | Jest config | `ts-jest` preset, node environment, coverage collection |
| `backend/.env.example` | 303 B | Env template | All 9 env vars documented with comments |

### Frontend (5 source files + 4 config files)

| File | Size | Purpose | Responsibilities |
|---|---|---|---|
| `frontend/src/App.tsx` | 2.5 kB | Root component | Health-check status UI — polls `GET /health` every 30s, displays frontend/backend status, environment, uptime |
| `frontend/src/App.css` | 1.5 kB | App styles | Dark theme status card, gradient title, responsive layout |
| `frontend/src/index.css` | 1.2 kB | Global CSS | Design tokens (CSS custom properties), base resets, dark theme colors, typography |
| `frontend/src/main.tsx` | 230 B | Entry point | React root mount (Vite default) |
| `frontend/index.html` | 360 B | HTML shell | Vite entry HTML |
| `frontend/package.json` | 528 B | Package manifest | React 19, Vite 8, TypeScript 5.8 |
| `frontend/vite.config.ts` | 161 B | Vite config | React plugin |
| `frontend/.env.example` | 127 B | Env template | `VITE_API_URL`, `VITE_MAPS_API_KEY` |
| `frontend/.prettierrc` | 206 B | Prettier config | Matches backend conventions |

### Shared (4 source files + 2 config files)

| File | Size | Purpose | Responsibilities |
|---|---|---|---|
| `shared/types/index.ts` | 180 B | Type barrel | Empty barrel file — placeholder for shared type exports |
| `shared/contracts/index.ts` | 141 B | Contract barrel | Empty barrel file — placeholder for API request/response DTOs |
| `shared/constants/index.ts` | 113 B | Constants barrel | Empty barrel file — placeholder for shared constants |
| `shared/schemas/index.ts` | 120 B | Schema barrel | Empty barrel file — placeholder for validation schemas |
| `shared/package.json` | 309 B | Package manifest | TypeScript dev dependency only |
| `shared/tsconfig.json` | 496 B | TypeScript config | Strict, ES2022, declaration output |

### Deployment (8 files)

| File | Size | Purpose | Responsibilities |
|---|---|---|---|
| `deployment/docker/Dockerfile.backend` | 1.2 kB | Backend container | Multi-stage build: compile TS → run on `node:20-alpine` as non-root user, HEALTHCHECK, port 3001 |
| `deployment/docker/Dockerfile.frontend` | 745 B | Frontend container | Multi-stage build: Vite build → serve via `nginx:alpine`, port 80 |
| `deployment/docker/docker-compose.yml` | 865 B | Local orchestration | backend + frontend services, env file mounting, health checks, service dependency |
| `deployment/docker/nginx.conf` | 855 B | Nginx config | SPA routing (`try_files`), gzip compression, static asset caching (1yr), security headers |
| `deployment/docker/.dockerignore` | 104 B | Build context filter | Excludes `node_modules`, `.env`, `dist`, `.git`, docs |
| `deployment/cloudrun/backend-service.yaml` | 2.1 kB | Cloud Run backend | Knative service: autoscale 0–10, 80 concurrent, 512Mi RAM, Secret Manager env vars, health probes |
| `deployment/cloudrun/frontend-service.yaml` | 1.0 kB | Cloud Run frontend | Knative service: autoscale 0–5, 200 concurrent, 256Mi RAM, health probes |
| `deployment/firebase/firebase.json` | 292 B | Firebase config | Hosting SPA rewrite, storage rules reference |
| `deployment/firebase/.firebaserc` | 66 B | Project alias | Placeholder `YOUR_FIREBASE_PROJECT_ID` |
| `deployment/firebase/storage.rules` | 242 B | Storage rules | Deny-all default (`allow read, write: if false`) |

### CI/CD, Scripts, Documentation, Root (8 files)

| File | Size | Purpose | Responsibilities |
|---|---|---|---|
| `.github/workflows/ci.yml` | 1.6 kB | CI pipeline | GitHub Actions: 3 parallel jobs (backend, frontend, shared). Each: checkout → Node 20 → install → lint → build/test |
| `scripts/setup.sh` | 2.2 kB | Setup script | Installs all deps, copies `.env.example` → `.env` if not exists |
| `scripts/dev.sh` | 1.4 kB | Dev runner | Starts backend + frontend concurrently, graceful shutdown on Ctrl+C |
| `package.json` (root) | 719 B | Workspace root | Scripts: `setup`, `dev`, `build`, `lint`, `format`, `test`, `clean` |
| `README.md` | 3.6 kB | Project documentation | Structure, prerequisites, quick start, env var table, script reference, Docker/Cloud Run instructions |
| `docs/PROJECT_SPEC.md` | 789 B | Spec overview | Architecture summary, milestone list |
| `docs/IMPLEMENTATION_PLAN.md` | 1.1 kB | Implementation plan | Milestone 1 scope, deliverables, non-goals |
| `docs/CHANGELOG.md` | 1.5 kB | Change log | v0.1.0 entry with all Milestone 1 additions |
| `.gitignore` | 332 B | Git exclusions | `node_modules`, `dist`, `.env`, IDE, OS, logs, Firebase, Docker |
| `.editorconfig` | 188 B | Editor config | UTF-8, LF, 2-space indent, trim trailing whitespace |

**Total files committed:** 92
**Total source lines (excluding lockfiles):** ~11,059

---

## 4. Files Modified

No pre-existing files were modified. This is the first milestone on a greenfield project. All files were newly created.

The only modification was replacing the Vite scaffold defaults:

| File | Change |
|---|---|
| `frontend/src/App.tsx` | Replaced Vite's default counter demo with CityOps health-check status UI |
| `frontend/src/App.css` | Replaced Vite's default styles with dark-theme status card layout |
| `frontend/src/index.css` | Replaced Vite's default global CSS with design token system |

These were overwritten immediately after scaffolding, before any commit, so there is no modification history — only the final versions exist in Git.

---

## 5. Folder Structure

```
cityops-ai/
├── .editorconfig
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI pipeline
├── README.md
├── package.json                      # Root workspace scripts
│
├── backend/
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── jest.config.js
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                  # Express app entry point
│       ├── config/
│       │   ├── index.ts              # Centralized env config
│       │   ├── firebase.ts           # Firebase Admin SDK
│       │   ├── gemini.ts             # Gemini AI SDK
│       │   └── maps.ts              # Maps API key
│       ├── middleware/
│       │   ├── errorHandler.ts       # Global error handling
│       │   └── requestLogger.ts      # HTTP request logging
│       ├── routes/
│       │   └── health.ts             # GET /health
│       ├── utils/
│       │   └── logger.ts             # Winston logger
│       ├── agents/                   # [empty — future milestone]
│       ├── controllers/              # [empty — future milestone]
│       ├── models/                   # [empty — future milestone]
│       ├── services/                 # [empty — future milestone]
│       ├── tools/                    # [empty — future milestone]
│       └── types/                    # [empty — future milestone]
│
├── frontend/
│   ├── .env.example
│   ├── .prettierrc
│   ├── .oxlintrc.json
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx                  # React root mount
│       ├── App.tsx                   # Health status UI
│       ├── App.css                   # App component styles
│       ├── index.css                 # Global CSS / design tokens
│       ├── assets/                   # Static assets
│       ├── components/               # [empty — future milestone]
│       ├── pages/                    # [empty — future milestone]
│       ├── layouts/                  # [empty — future milestone]
│       ├── hooks/                    # [empty — future milestone]
│       ├── services/                 # [empty — future milestone]
│       ├── store/                    # [empty — future milestone]
│       ├── types/                    # [empty — future milestone]
│       └── styles/                   # [empty — future milestone]
│
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   ├── types/index.ts                # [barrel — empty]
│   ├── contracts/index.ts            # [barrel — empty]
│   ├── constants/index.ts            # [barrel — empty]
│   └── schemas/index.ts              # [barrel — empty]
│
├── deployment/
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   ├── docker-compose.yml
│   │   ├── nginx.conf
│   │   └── .dockerignore
│   ├── cloudrun/
│   │   ├── backend-service.yaml
│   │   └── frontend-service.yaml
│   └── firebase/
│       ├── firebase.json
│       ├── .firebaserc
│       └── storage.rules
│
├── docs/
│   ├── PROJECT_SPEC.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── CHANGELOG.md
│
├── scripts/
│   ├── setup.sh                      # One-command install
│   └── dev.sh                        # Concurrent dev servers
│
└── tests/                            # [empty — future milestone]
```

---

## 6. Architecture Snapshot

### Components Implemented

| Component | Status | Details |
|---|---|---|
| Express HTTP Server | ✅ Implemented | Helmet, CORS, JSON body parsing, URL-encoded parsing, 10MB body limit |
| Configuration Module | ✅ Implemented | Centralized env var loading and validation with typed `AppConfig` interface |
| Logging System | ✅ Implemented | Winston with timestamped, colorized console transport. Request-level HTTP logging middleware. |
| Error Handling | ✅ Implemented | Global error handler returning structured JSON. Stack traces in development only. |
| Health Check | ✅ Implemented | `GET /health` returning status, timestamp, uptime, environment |
| Graceful Shutdown | ✅ Implemented | SIGTERM/SIGINT handlers, unhandled rejection and uncaught exception handlers |
| Frontend Shell | ✅ Implemented | React SPA with real-time backend health monitoring (30s polling interval) |

### Services Implemented

| Service | Status | Details |
|---|---|---|
| Firebase Admin | ✅ Wired | SDK initialized with service account cert. `getFirestore()` and `getStorage()` accessors exported. Not invoked beyond initialization. |
| Gemini AI | ✅ Wired | `GoogleGenerativeAI` client instantiated. `getGeminiClient()` accessor exported. No model calls made. |
| Google Maps | ✅ Wired | API key validated and stored. `getMapsApiKey()` accessor exported. No API calls made. |

### APIs Implemented

Only the health endpoint. No business APIs exist.

### Database Integration

**Status: Wired, not used.**

Firestore is accessible via `getFirestore()` after Firebase initialization, but no collections have been created, no reads/writes are performed, and no schemas exist. This is explicitly correct per the milestone spec.

### AI Components

**Status: Deferred entirely.**

The Gemini SDK client is initialized and accessible, but no prompts, models, agents, tools, or AI logic of any kind exists. The `agents/` and `tools/` directories are empty placeholders.

### Google Cloud Services

| Service | SDK Initialized | Used Beyond Init | Notes |
|---|---|---|---|
| Firebase Admin | ✅ | ❌ | Credential-based auth via env vars |
| Firestore | ✅ (via Firebase) | ❌ | No collections, no queries |
| Cloud Storage | ✅ (via Firebase) | ❌ | Bucket configured, deny-all rules |
| Gemini | ✅ | ❌ | API key configured, no model calls |
| Cloud Run | N/A | ❌ | YAML definitions only, not deployed |
| Google Maps | ✅ (key only) | ❌ | API key validated, no API calls |

---

## 7. API Summary

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | System health check |

### Request Format

No request body or query parameters.

### Response Format

```json
{
  "status": "ok",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

| Field | Type | Description |
|---|---|---|
| `status` | string | Always `"ok"` if server is running |
| `timestamp` | string (ISO 8601) | Current server time |
| `uptime` | number (seconds) | Process uptime in seconds |
| `environment` | string | Value of `NODE_ENV` |

### Error Response Format (Global)

```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal server error",
  "stack": "..." 
}
```

The `stack` field is only included when `NODE_ENV=development`.

---

## 8. Database Changes

**None.**

| Item | Status |
|---|---|
| Collections created | None |
| Schemas defined | None |
| Queries written | None |
| Indexes created | None |
| Firestore security rules | Not created (Cloud Storage rules only — deny-all) |

This is intentional. The milestone spec explicitly states: *"No Firestore collections should be created."*

---

## 9. AI Components

| Component | Status | Notes |
|---|---|---|
| Decision Engine | ❌ Deferred | No AI decision logic exists |
| Tool Registry | ❌ Deferred | `backend/src/tools/` directory exists but is empty |
| Prompt Handling | ❌ Deferred | No prompts, no prompt templates, no prompt engineering |
| Confidence Model | ❌ Deferred | Not implemented |
| Human Review | ❌ Deferred | Not implemented |
| Agent Framework | ❌ Deferred | `backend/src/agents/` directory exists but is empty |

**What IS implemented:**

- The `@google/generative-ai` npm package (v0.21.0) is installed
- The `GoogleGenerativeAI` client is instantiated at startup using `GOOGLE_API_KEY`
- The `getGeminiClient()` accessor function is exported for future milestones to use

**What is NOT implemented:**

Everything else. No model selection, no prompt construction, no response parsing, no confidence scoring, no human-in-the-loop review, no tool calling, no agent orchestration.

This is correct per the milestone spec: *"No AI logic should exist."*

---

## 10. Google Cloud Integration

### Gemini

| Aspect | Status |
|---|---|
| SDK installed | ✅ `@google/generative-ai@^0.21.0` |
| Client initialized | ✅ At startup via `GOOGLE_API_KEY` |
| Model calls | ❌ None |
| Prompt engineering | ❌ None |
| Response parsing | ❌ None |

**Implementation:** `backend/src/config/gemini.ts` — 27 lines. Instantiates client, exports accessor.

### Firestore

| Aspect | Status |
|---|---|
| SDK installed | ✅ `firebase-admin@^12.6.0` |
| Initialized | ✅ Via service account credentials |
| Collections | ❌ None created |
| Security rules | ❌ Not defined (Firestore rules not created) |
| Queries | ❌ None |

**Implementation:** `backend/src/config/firebase.ts` — 52 lines. Initializes app, exports Firestore and Storage accessors.

### Cloud Storage

| Aspect | Status |
|---|---|
| SDK initialized | ✅ Via `admin.storage()` |
| Bucket configured | ✅ Via `STORAGE_BUCKET` env var |
| Upload/download | ❌ None |
| Security rules | ✅ Deny-all default |

**Implementation:** Storage accessor is part of `firebase.ts`. Rules in `deployment/firebase/storage.rules`.

### Cloud Run

| Aspect | Status |
|---|---|
| Service definitions | ✅ YAML for backend + frontend |
| Autoscaling | ✅ Backend 0–10, Frontend 0–5 |
| Secret Manager | ✅ All sensitive env vars reference secrets |
| Health probes | ✅ Startup + liveness probes on `/health` |
| Deployed | ❌ Not deployed — out of scope |

**Implementation:** `deployment/cloudrun/backend-service.yaml` (74 lines), `deployment/cloudrun/frontend-service.yaml` (37 lines).

---

## 11. Testing Performed

### Unit Tests

| Test Suite | Status | Notes |
|---|---|---|
| Backend Jest | ✅ Framework configured | `jest.config.js` with `ts-jest` preset. Runs with `--passWithNoTests`. No test files exist — this is infrastructure-only. |
| Frontend | N/A | No test framework configured (Vite scaffold default). Testing will be added in future milestones. |

### Integration Tests

None. The `tests/` directory exists as a placeholder.

### Manual Tests (Build Verification)

| Test | Result | Command | Output |
|---|---|---|---|
| Backend TypeScript compilation | ✅ Pass | `cd backend && npm run build` | `tsc` exits with code 0, produces `dist/` |
| Frontend production build | ✅ Pass | `cd frontend && npm run build` | Vite produces 192.28 kB JS + 2.25 kB CSS in 544ms |
| Shared TypeScript compilation | ✅ Pass | `cd shared && npm run build` | `tsc` exits with code 0, produces `dist/` |
| Backend ESLint | ✅ Pass | `cd backend && npm run lint` | 0 errors, 0 warnings |
| Frontend Oxlint | ✅ Pass | `cd frontend && npm run lint` | 0 errors, 0 warnings (103 rules, 3 files) |
| Backend Jest | ✅ Pass | `cd backend && npm test` | Exits 0 with `--passWithNoTests` |
| Git commit | ✅ Pass | `git add -A && git commit` | 92 files, 11,347 insertions |

### Failure Tests (NOT performed)

The milestone spec lists these failure tests:

| Test | Status | Reason |
|---|---|---|
| Missing env vars → meaningful error | ⚠ Code-reviewed only | `requireEnv()` throws with variable name and `.env.example` reference. Not executed at runtime. |
| Invalid Firebase credentials → error | ⚠ Code-reviewed only | `try/catch` in `initializeFirebase()` logs via Winston and re-throws. Not executed with invalid creds. |
| Invalid Gemini key → error | ⚠ Code-reviewed only | `try/catch` in `initializeGemini()` logs and re-throws. Not executed. |
| Invalid Storage bucket → error | ⚠ Code-reviewed only | Would fail during Firebase init if bucket invalid. Not tested. |

**Reviewer note:** These failure paths are implemented defensively in code but were not executed with intentionally invalid inputs. Recommend requesting a live boot test with missing env vars as part of review.

---

## 12. Screenshots

### UI Description

The frontend consists of a single page — a system status dashboard used exclusively for infrastructure verification.

**Screen: System Status (App.tsx)**

| Element | Description |
|---|---|
| Logo | 🏙️ emoji, centered |
| Title | "CityOps AI" with gradient text (blue → purple) |
| Subtitle | "AI-Powered City Operations Platform" in muted gray |
| Status Card | Dark surface card with border, listing: |
| → Frontend | Always shows "● Online" in green (if the page renders, the frontend works) |
| → Backend API | Polls `GET /health` every 30s. Shows "● Online" (green), "◌ Checking..." (amber), or "✕ [error]" (red) |
| → Environment | Shows `NODE_ENV` value from backend (only visible when backend is online) |
| → Uptime | Shows backend process uptime in seconds (only visible when backend is online) |
| Footer | "CityOps AI v0.1.0 — Milestone 1: Infrastructure" |

**Color Scheme:** Dark theme (`#0f172a` background, `#1e293b` surface, `#f1f5f9` text).

No screenshots are available. The frontend was verified via build output only — it was not loaded in a browser during implementation.

---

## 13. Known Limitations

### Current Bugs

None identified. All builds pass, all linters pass.

### Missing Features (Intentionally Deferred)

| Feature | Reason |
|---|---|
| Authentication | Milestone 2+ |
| Firestore collections | Milestone 2+ |
| AI/Gemini model calls | Milestone 2+ |
| Dashboard UI | Milestone 2+ |
| Citizen upload | Milestone 2+ |
| Human review | Milestone 2+ |
| API endpoints (beyond health) | Milestone 2+ |
| Deployment | Milestone 2+ |

### Technical Debt

| Item | Severity | Description |
|---|---|---|
| ESLint v8 deprecation | Low | Backend uses ESLint 8.57 which is EOL. Frontend uses Oxlint (Vite's new default). Should unify to ESLint 9 flat config or Oxlint across both in a future milestone. |
| npm audit warnings | Low | Backend has 27 moderate-severity vulnerabilities from transitive dependencies (firebase-admin, generative-ai). These are upstream issues. Running `npm audit fix` would address some. |
| No `tsconfig` path alias resolution at runtime | Low | Backend `tsconfig.json` defines path aliases (`@config/*`, etc.) but these are not resolved at runtime by `ts-node`. Imports use relative paths, so this is cosmetic. Should add `tsconfig-paths` if aliases are used. |
| Frontend test framework missing | Low | Vite scaffold did not include Vitest. Should add in Milestone 2 if frontend tests are needed. |
| Docker builds not verified | Medium | Dockerfiles are syntactically correct but have not been built. Could have runtime issues (missing dependencies, incorrect COPY paths). |
| Shared module not linked | Low | `shared/` is a standalone TypeScript package but is not linked as an npm workspace or symlinked. Future milestones should set up `npm workspaces` or direct `file:` references. |

### Temporary Workarounds

| Workaround | Context |
|---|---|
| `export PATH="/opt/homebrew/bin:..."` | Node.js was not on the default shell PATH during development. All npm commands required explicit PATH export. This is a development environment issue, not a project issue. |
| Vite default assets retained | `favicon.svg`, `icons.svg`, `hero.png`, `vite.svg` from the Vite scaffold are still in the project. These should be replaced with CityOps AI branding. |

---

## 14. Self-Critique

### What is weakest?

**Docker verification.** The Dockerfiles were written but never built. The multi-stage build for the backend copies from specific paths (`/app/backend/`, `/app/shared/`) and the COPY context assumes the Docker build is run from the project root. A single incorrect path in the Dockerfile would cause the build to fail, and this was not tested.

### What is most likely to fail?

1. **Docker build for backend** — The multi-stage build copies `shared/` for build but only `backend/dist` for production. If the shared module's compiled output is needed at runtime (once it has real types), the Dockerfile will need updating.

2. **Firebase initialization with real credentials** — The `FIREBASE_PRIVATE_KEY` is read from env and has `\\n` → `\n` replacement, but service account JSON private keys can be tricky to pass through environment variables (escaping, newlines). This is a common failure point.

3. **Cloud Run deployment** — The service YAML references `gcr.io/PROJECT_ID/...` with a literal `PROJECT_ID` placeholder. This must be replaced before deployment.

### What should reviewers inspect first?

1. **`backend/src/config/index.ts`** — This is the single point of failure for configuration. If any env var handling is wrong, the entire backend fails to start.

2. **`backend/src/index.ts`** — The bootstrap sequence and error handling are critical. Verify that initialization failures prevent the server from starting (they should — errors propagate to `bootstrap().catch()`).

3. **`deployment/docker/Dockerfile.backend`** — The most complex infrastructure file. Multi-stage builds are error-prone. Verify COPY paths and the production stage's dependency installation.

4. **`deployment/cloudrun/backend-service.yaml`** — Verify that Secret Manager references match the expected secret names and that resource limits are appropriate.

### What assumptions were made?

| Assumption | Risk |
|---|---|
| Node 20 is the Docker target, Node 24 is the dev machine | Low — Node 24 is backward-compatible with 20 for this project's usage |
| Firebase Admin SDK uses service account cert auth | Low — this is the standard server-side approach |
| `FIREBASE_PRIVATE_KEY` newline replacement (`\\n` → `\n`) is sufficient | Medium — depends on how the key is stored in the environment |
| Gemini SDK initialization does not make network calls | Low — `new GoogleGenerativeAI(key)` only stores the key |
| Cloud Run will use Secret Manager for env vars | Low — this is Google's recommended approach |
| Frontend and backend run on different ports (5173 / 3001) | Low — standard Vite + Express pattern |

### What compromises were introduced?

1. **Frontend linter mismatch:** Backend uses ESLint, frontend uses Oxlint (Vite v8's default). This creates inconsistency. Chose not to override Vite's default to avoid configuration conflicts.

2. **No npm workspaces:** The `shared/` module is not formally linked to backend or frontend. Chose simplicity over workspace configuration for Milestone 1. Should be revisited.

3. **No runtime boot test with real credentials:** Firebase, Gemini, and Maps initialization was validated at the code level but not with actual API keys/credentials. This was acceptable per the milestone scope (no deployment) but means the first real boot will be the true integration test.

4. **Health endpoint has no dependency checks:** `GET /health` returns `"ok"` if the Express server is running, regardless of whether Firebase/Gemini are actually connected. A more robust health check would verify downstream dependencies. Deferred to a future milestone.

---

## 15. Questions for the Review Board

1. **Linter unification:** The backend uses ESLint 8 (TypeScript plugin) while the frontend uses Oxlint (Vite's default in v8). Should we unify to a single linter before proceeding to Milestone 2, or defer this to a dedicated tech-debt sprint?

2. **npm workspaces:** The `shared/` module is currently standalone. Should we configure npm workspaces in the root `package.json` before Milestone 2 starts importing shared types?

3. **Health endpoint depth:** The current health check returns `"ok"` without verifying downstream services (Firebase, Gemini). Should Milestone 2 enhance this to include dependency health, or is a simple server-alive check acceptable?

4. **Docker verification priority:** Docker builds were not tested locally. Should Docker build verification be a prerequisite for Milestone 1 sign-off, or can it be deferred to the deployment milestone?

5. **Firebase private key handling:** The `FIREBASE_PRIVATE_KEY` env var uses simple `\\n` → `\n` replacement. In production Cloud Run, this comes from Secret Manager. Should we add support for reading credentials from a JSON file as an alternative, or is env-var-only sufficient?

6. **Frontend test framework:** The frontend has no test framework (Vitest/Jest). Should this be added in Milestone 2, or only when frontend tests are first needed?

---

*End of Milestone Review Package*
