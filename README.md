# GeoAnnotate

GeoAnnotate is a geo-localization data collection and gameplay platform built with Next.js on the frontend and CloudBase cloud functions on the backend.

The current repository now separates the product into clearer zones:

- `/` public landing page
- `/wiki` public documentation space
- `/auth/*` authentication routes
- `/app/*` core gameplay and user platform
- `/admin/*` admin console

## Tech Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- Interaction: Leaflet, react-konva, Zustand, React Hook Form, Zod
- Backend: CloudBase cloud functions
- Database: PostgreSQL with Prisma schema management

## Current Product Areas

### Public site

- Landing page at `/`
- Wiki pages at `/wiki`

### Core app

- Home dashboard
- Annotation mode selection
- Annotation task flow with reasoning / bbox / hybrid modes
- AI battle configuration
- Battle play and result pages
- Profile, points, rewards, history, leaderboard

### Admin

- Dashboard
- Images
- Reviews
- Export
- Rewards
- Placeholder routes for users, AI models, and analytics

## Project Structure

### Frontend

Main frontend code lives in:

- `app/`
- `components/`

Page implementations are mostly in:

- `app/(main)/...`
- `app/(auth)/...`

Route mapping layers are in:

- `app/app/...`
- `app/auth/...`

### Backend

Main backend code lives in:

- `cloudfunctions/`
- `prisma/`

### Frontend-backend bridge

The main bridge layer is:

- `lib/cloudbase.ts`

This file wraps CloudBase auth and cloud function calls for the frontend.

### Shared config

Shared product config and structure helpers live in:

- `features/`
- `types/`
- `lib/modes.ts`

## Local Development

Install dependencies:

```powershell
cd D:\geoannotate
npm.cmd install
```

Run the development server:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

Build for production check:

```powershell
npm.cmd run build
```

## Environment Notes

Frontend rendering works locally once dependencies are installed, but full business functionality depends on backend environment setup:

- `NEXT_PUBLIC_CLOUDBASE_ENV_ID`
- CloudBase auth
- deployed cloud functions
- PostgreSQL connection variables
- seeded image/task data

Without those, pages can still render, but login, task fetch, annotation submit, and battle creation may fail.

## Documentation

Additional structure documentation is included in `docs/`:

- [README project structure snippet](docs/README_PROJECT_STRUCTURE_SNIPPET.md)
- [Detailed project structure guide](docs/PROJECT_STRUCTURE_GUIDE.md)
- [Detailed project structure PDF](docs/PROJECT_STRUCTURE_GUIDE.pdf)
- [CloudBase deployment guide](docs/CLOUDBASE_DEPLOY.md)

## Branch Strategy

Recommended long-lived branches:

- `main`: always demoable and releasable
- `develop`: integration and testing branch

Current feature branches to keep available:

- `feat/auth-wiki`
- `feat/annotation-core`
- `feat/battle-admin`

## Status

The current codebase has been validated with:

```powershell
npm.cmd run build
```

This confirms the current application structure compiles successfully after the route split, annotation flow restructuring, battle configuration updates, and documentation additions.
