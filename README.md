# Pywel Map

A personal, local replacement for the MapGenie Crimson Desert (Pywel) map. It's built for a second monitor: fast filtering, unlimited progress tracking, instant search, and large readable location details.

## Setup

```sh
npm install
npm run sync   # downloads the map data + marker icons into public/data (re-run when MapGenie adds locations)
npm run dev    # open the printed URL
```

The map tiles and screenshots load live from MapGenie's CDN. Your progress lives in this browser's localStorage, keyed by location ID, so it survives `npm run sync`.

## Using it

| Key | Action |
| --- | --- |
| `/` | Search (↑/↓ to move, Enter to fly there, Esc to clear) |
| `F` | Toggle found on the selected location |
| `H` | Toggle Hide found |
| `Esc` | Close the detail panel or lightbox |
| Right-click a marker | Toggle found without opening it |
| Alt-click a category | Show only that category |

**Import your MapGenie progress:** open the MapGenie Pywel map while logged in, run `copy(JSON.stringify(user.locations))` in the DevTools console, then paste the result into **Import / export progress**. Use the same dialog to download a backup.

## Development

```sh
npm test         # vitest: data transform, progress counts, map filters, import parsing, search
npx tsc -b       # type-check
```

Layout: `scripts/sync-data.ts` (data download) · `src/data` (types + transform) · `src/state` (zustand store + progress selectors) · `src/map` (MapLibre view + filter expressions) · `src/search` · `src/progress` · `src/ui`.
