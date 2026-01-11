# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a project where a user can log in with strava, set up a strava race. other users use the unique link with by the user to have leaderboards. the race organizer choses some segments, and an end date and the application genertates a link and makes a dashboard for standings. 
## Issue Tracking

This project uses **bd** (beads) for issue tracking. See AGENTS.md for workflow details.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Build Commands

*To be added as the project develops.*

## Session Completion

Always push changes before ending a session:
```bash
git pull --rebase
bd sync
git push
```
