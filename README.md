# Crimson Atlas

A personal desktop map for Crimson Desert's Pywel, built as a second-monitor companion to MapGenie's map: fast filtering, unlimited progress tracking, instant search, and large readable location details. Runs on macOS and Windows (Electron), or in a browser.

> **Unofficial.** Crimson Atlas is a fan-made personal project. It is not affiliated with or endorsed by MapGenie or Pearl Abyss. No map data is included in this repository or in its builds: the app downloads it from MapGenie's public map on your machine, and map tiles and screenshots load from MapGenie's servers.

## Install

Grab the latest `.dmg` (macOS) or `.exe` (Windows) from the repo's **Releases** page, or from the artifacts of the **Build desktop apps** workflow run.

The builds are unsigned:
- **macOS:** right-click the app, choose **Open**, then confirm. If macOS says the app is damaged, run `xattr -cr "/Applications/Crimson Atlas.app"`.
- **Windows:** on the SmartScreen prompt, click **More info**, then **Run anyway**.

## Using it

| Key | Action |
| --- | --- |
| `/` | Search (↑/↓ to move, Enter to fly there, Esc to clear) |
| `F` | Toggle found on the selected location |
| `H` | Toggle Hide found |
| `Esc` | Close the detail panel or lightbox |
| Right-click a marker | Toggle found without opening it |
| Alt-click a category | Show only that category |
| `Cmd/Ctrl+Shift+T` | Always on top (desktop app) |
| `Cmd/Ctrl+I` | Import progress (desktop app) |

**Import your MapGenie progress:** in the desktop app, go to **Map → Import Progress from MapGenie… → Sign in to MapGenie & import**. Sign in once; the app remembers the session. In a browser, run `copy(JSON.stringify(user.locations))` in DevTools on the MapGenie Pywel map and paste the result into **Import / export progress**.

**Map data and updates:** the desktop app downloads the map data from MapGenie on first launch. It checks again at launch and roughly every 6 hours while running. When MapGenie adds or removes locations, a banner offers a reload, so the map never refreshes mid-play. **Map → Check for Map Updates** checks immediately. In a browser, run `npm run sync`.

Progress is stored locally and keyed by location ID, so it survives data updates. The desktop app remembers its window position, so it reopens on your second monitor.

## Development

```sh
npm install
npm run sync      # download map data + marker icons into public/data
npm run desktop   # Electron app against the Vite dev server (renderer hot-reloads)
npm run dev       # browser-only version
npm test          # vitest
npx tsc -b        # type-check
```

Packaging (`release/`):

```sh
npm run dist:mac  # .dmg for Apple Silicon and Intel
npm run dist:win  # .exe installer. Needs Windows, or a Mac that can run Intel binaries; otherwise use CI
```

**CI:** `.github/workflows/build.yml` builds both platforms when run manually (Actions → Build desktop apps → Run workflow) or when a `v*` tag is pushed. A tag build also attaches the installers to a GitHub release. Builds never include map data; `public/data/` (from `npm run sync`) is for local development only and is git-ignored.

Layout: `electron/` (main process: window, menu, `app://` protocol, data refresh, MapGenie sign-in) · `scripts/` (data sync, desktop dev runner) · `src/data` (download, transform, types) · `src/state` · `src/map` · `src/search` · `src/progress` · `src/ui`.
