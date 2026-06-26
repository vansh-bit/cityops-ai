# Changelog

All notable changes to the CityOps AI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-06-27

### Added — Milestone 1: Project Setup & Infrastructure

- Initialized Git repository with `.gitignore` and `.editorconfig`
- Created complete folder structure (backend, frontend, shared, deployment, docs, scripts, tests)
- **Backend**: Express + TypeScript server with health endpoint
  - Configuration management with environment variable validation
  - Firebase Admin SDK initialization
  - Google Gemini SDK initialization
  - Google Maps API key configuration
  - Winston logging with request logger middleware
  - Global error handler middleware
  - ESLint + Prettier + Jest setup
- **Frontend**: React + Vite + TypeScript application shell
  - ESLint + Prettier setup
  - Development-ready Vite configuration
- **Shared**: TypeScript module with barrel files for types, contracts, constants, schemas
- **Deployment**:
  - Multi-stage Docker builds for backend and frontend
  - Docker Compose for local development
  - Nginx configuration for frontend serving
  - Cloud Run service definitions (backend + frontend)
  - Firebase configuration with Cloud Storage rules
- **CI/CD**: GitHub Actions workflow (lint, type-check, test, build)
- **Scripts**: Setup and development helper scripts
- **Documentation**: README, PROJECT_SPEC, IMPLEMENTATION_PLAN, CHANGELOG
