# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Strava Racing - users log in with Strava, create races by selecting segments and setting dates, then share a unique link. Other users join via the link and compete on a leaderboard showing segment times.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with Strava OAuth
- **Styling**: Tailwind CSS

## Build Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check

# Database
npx prisma generate  # Generate Prisma client
npx prisma migrate dev  # Run migrations (requires DATABASE_URL)
npx prisma studio    # Open database GUI
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` - From strava.com/settings/api
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - App URL (http://localhost:3000 for dev)

## Architecture

```
app/
├── api/
│   ├── auth/[...nextauth]/  # NextAuth handlers
│   ├── races/               # Race CRUD + join/segments/refresh
│   └── strava/segments/     # Strava segment search
├── auth/signin/             # Sign in page
├── dashboard/               # User's races
├── races/
│   ├── new/                 # Race creation form
│   └── [slug]/              # Race page with leaderboard
components/                  # React components
lib/
├── auth.ts                  # NextAuth config + Strava provider
├── prisma.ts                # Prisma client singleton
└── strava.ts                # Strava API helpers
prisma/schema.prisma         # Database models
```

## Issue Tracking

This project uses **bd** (beads) for issue tracking. See AGENTS.md for workflow details.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Session Completion

Always push changes before ending a session:
```bash
git pull --rebase
bd sync
git push
```
