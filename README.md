# CityOps AI

AI-powered city operations management platform.

## Project Structure

```
cityops-ai/
├── backend/          # Express + TypeScript API server
├── frontend/         # React + Vite frontend
├── shared/           # Shared types, contracts, constants
├── docs/             # Project documentation
├── deployment/       # Docker, Cloud Run, Firebase configs
│   ├── docker/
│   ├── cloudrun/
│   └── firebase/
├── scripts/          # Development & setup scripts
├── tests/            # Integration / E2E tests
└── .github/          # CI/CD workflows
```

## Runtime Architecture

The CityOps AI backend utilizes a deterministic, multi-layered runtime architecture to evaluate citizen reports.

```
Citizen Upload
        ↓
Gemini Vision
        ↓
VisionResult
        ↓
Evidence Coordinator
        ↓
Google Maps Provider
        ↓
Evidence Aggregator
        ↓
EvidencePackage
        ↓
Decision Engine
        ↓
Confidence Engine
        ↓
Municipality Report
        ↓
Persistence Coordinator
        ↓
Tracking ID Generator
        ↓
Cloud Storage Provider
        ↓
Firestore Provider
        ↓
Submission Response
```

## Features

- **Vision Layer**: Analyzes citizen-uploaded images using Gemini Vision to detect municipal issues.
- **Evidence Layer**: Collects real-world contextual geographic evidence (Google Maps) to enrich AI decision making.
- **Decision Engine**: Generates municipal incident categorizations, department assignments, and reasoning.
- **Confidence Engine**: Evaluates the quality of evidence and reasoning to assign a confidence score and escalation flags.
- **Persistence Layer**: Securely stores images in Firebase Cloud Storage, assigns unique Tracking IDs, and persists immutable reports to Firestore atomically.

## Implementation Status

- **Milestone 1-4**: Complete and Locked.
- **Milestone 5 Phase 5A (Vision Integration)**: Complete and Locked.
- **Milestone 5 Phase 5B (Evidence Collection)**: Complete and Locked.
- **Milestone 5 Phase 5C (Persistence Layer)**: In Progress.

## Prerequisites

- **Node.js** >= 20.x (LTS)
- **npm** >= 10.x
- **Docker** (for container builds)
- **Google Cloud SDK** (for Cloud Run deployment)

## Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd cityops-ai
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Configure Environment

Copy the example env files and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Run Development Servers

```bash
# Start both backend and frontend
chmod +x scripts/dev.sh
./scripts/dev.sh

# Or individually:
cd backend && npm run dev    # API on http://localhost:3001
cd frontend && npm run dev   # App on http://localhost:5173
```

### 4. Verify Health

```bash
curl http://localhost:3001/api/v1/health
```

## Environment Variables

### Backend

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: 3001) | No |
| `GOOGLE_API_KEY` | Google Gemini API key | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | Yes |
| `STORAGE_BUCKET` | Cloud Storage bucket name | Yes |
| `MAPS_API_KEY` | Google Maps API key | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `LOG_LEVEL` | Logging level (default: info) | No |

### Frontend

| Variable | Description | Required |
|---|---|---|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_MAPS_API_KEY` | Google Maps API key (client) | Yes |

## Available Scripts

### Root

| Command | Description |
|---|---|
| `npm run setup` | Install all dependencies |
| `npm run dev` | Start all dev servers |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |
| `npm run format` | Format all packages |
| `npm run test` | Run all tests |

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Start with hot-reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run test` | Run Jest tests |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Docker

```bash
# Build backend
docker build -f deployment/docker/Dockerfile.backend -t cityops-backend .

# Build frontend
docker build -f deployment/docker/Dockerfile.frontend -t cityops-frontend .

# Run with docker-compose
cd deployment/docker && docker-compose up
```

## Cloud Run

Service definitions are in `deployment/cloudrun/`. See the Cloud Run documentation for deployment instructions.

## Documentation

- [Project Status](docs/PROJECT_STATUS.md)
- [Project Spec](docs/PROJECT_SPEC.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Changelog](docs/CHANGELOG.md)

## License

Proprietary — All rights reserved.
