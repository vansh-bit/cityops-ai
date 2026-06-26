# CityOps AI — Implementation Plan

## Milestone 1: Project Setup & Infrastructure

### Objective
Establish the complete engineering foundation for CityOps AI.

### Scope
- Repository setup with Git
- Backend: Node.js + Express + TypeScript
- Frontend: React + Vite + TypeScript
- Firebase Admin SDK initialization
- Cloud Storage configuration
- Google Gemini SDK initialization
- Google Maps API key configuration
- Environment variable management
- Linting (ESLint) and formatting (Prettier)
- Testing framework (Jest)
- Docker containerization
- Cloud Run service definitions
- Health check endpoint
- Logging (Winston)
- CI/CD pipeline (GitHub Actions)

### Deliverables
- Working backend that starts and connects to cloud services
- Working frontend that boots via Vite
- Docker images that build successfully
- Cloud Run service definitions ready for deployment
- Complete folder structure matching the architecture spec

### Non-Goals
- No business logic
- No AI logic
- No Firestore collections
- No authentication
- No API endpoints (except health)
- No dashboard UI
