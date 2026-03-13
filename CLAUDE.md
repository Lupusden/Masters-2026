# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static, client-side fantasy golf pool website for the 2026 AT&T Pebble Beach Pro-Am. No build system, no backend, no package manager — pure HTML/CSS/JS opened directly in a browser or served from any static host.

## Running the Site

Open any `.html` file directly in a browser (`file://` protocol works), or serve locally:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

The ESPN live score sync uses a CORS proxy (`allorigins.win`) when running on `file://`, and direct fetch when served over HTTP.

## Architecture

All state is stored in `localStorage` under two keys:
- `pebblebeach2026_scores` — per-player round score overrides (object keyed by player name)
- `pebblebeach2026_entries` — pool participant picks (array of `{name, picks[], tiebreaker, ts}`)

### JS Module Load Order

Every page that needs data loads scripts in this exact order:
1. `js/data.js` — global constants and functions (must be first)
2. `js/livescores.js` — ESPN sync (depends on `data.js`)
3. Page-specific script (`picks.js`, `leaderboard.js`, or `admin.js`)

### Key Data Flow

`data.js` is the shared foundation — it exports globals used by all other scripts:
- `DEFAULT_PLAYERS` — 80-player roster with hardcoded R1 scores and null for R2–R4
- `getPlayers()` — merges `DEFAULT_PLAYERS` with localStorage overrides; always use this instead of `DEFAULT_PLAYERS` directly
- `calculateCurrentPrizes(players)` — computes prize money per player based on current standings, splitting ties
- `PRIZE_TABLE` — maps finishing position (1–80) to dollar amount
- `loadEntries()` / `saveEntry()` / `deleteEntry()` — pool entry CRUD

### Pages

- **index.html** — Static home/info page, no JS
- **picks.html** + `picks.js` — Player selection UI (IIFE). Two-step flow: pick 4 → designate tiebreaker → save
- **leaderboard.html** + `leaderboard.js` — Pool standings (IIFE). Auto-syncs ESPN on load if last sync was >5 min ago. Tiebreaker logic: same prize total → lowest R4 score wins; identical 4-player picks → designated tiebreaker player's R4 score decides
- **admin.html** + `admin.js` — Score entry panel (IIFE). Supports per-row save or bulk "Save All". Round tabs are visual only — all 4 rounds are always shown in the table

### ESPN Live Score Sync (`livescores.js`)

- Fetches `site.web.api.espn.com` public API (no API key needed)
- Falls back to `allorigins.win` CORS proxy for `file://` contexts
- `syncLiveScores(onProgress)` is exposed on `window` and called by both `leaderboard.js` and `admin.js`
- ESPN player names are fuzzy-matched to roster names via `normName()` (strips accents, lowercases) with a fallback word-inclusion partial match
- Only completed rounds (linescores value 60–90) are written; in-progress round holes-played values (< 60) are skipped

## Conventions

- All page-specific JS is wrapped in IIFEs to avoid polluting global scope
- `data.js` intentionally uses globals (no IIFE) so its functions are accessible to all page scripts
- Player names are the canonical key across all data structures — the name string in `DEFAULT_PLAYERS` must match exactly what ESPN returns (after normalization)
- Score inputs in admin are validated to min 55 / max 100 strokes
- `esc()` / `escHtml()` helper defined locally in each script for XSS-safe DOM insertion
