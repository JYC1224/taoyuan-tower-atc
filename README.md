# Taoyuan Tower

A browser 3D ATC vertical slice for Taiwan Taoyuan International Airport, RCTP/TPE. Control departure and arrival clearances, inspect taxi routes, manage runway conflicts, and observe traffic from the tower or aircraft cameras. English and Traditional Chinese interfaces are included.

The airport reference date is **2026-09-06**. Runway and selected stand/intersection data reference Taiwan CAA AIRAC 03/26, effective **2026-08-06**. Traffic is explicitly a **Typical Taoyuan Traffic Day** synthetic fixture, not an exact dated airline timetable.

The **2026-09-07 graphics update** improves aircraft, depth artifacts, materials, Taoyuan tower/terminal forms and weather lighting while preserving the existing simulation and controls. Its twelve-view comparison is retained in the earlier visual-update archive/workspace; see the [visual change and verification log](VISUAL_CHANGELOG.md). The original v0.1 archive is retained separately.

The **2026-10-27 gameplay update** adds surface reservations, controller priority decisions, an aging request queue, runway and wake predictions, route alternatives, gate planning and four difficulty modes. That release preserved the prior graphics sources. See [GAMEPLAY_PASS.md](GAMEPLAY_PASS.md) for its implementation and verification record.

The **2026-10-28 realism update** improves aircraft wing/nose/engine geometry, paint and surface detail, pavement materials, turf, sky reflections, facade glazing and cab finish. It preserves all 18 gameplay, UI, audio and airport/fleet data source hashes from the gameplay release. Seven verified **Poly Haven CC0** images are bundled locally; other new details are project-authored. See [VISUAL_REALISM_UPDATE.md](VISUAL_REALISM_UPDATE.md); its fifteen-view Medium/High comparison remains in the realism-update archive/workspace. Earlier release archives remain intact.

The subsequent **real-world livery update** replaces the generic airline lettering and tail initials with genuine wordmarks/emblems and separately reconstructed standard color schemes for EVA, China Airlines, STARLUX and Tigerair Taiwan. View the [12-view livery comparison](dist/livery-review/index.html) and [LIVERY_UPDATE.md](LIVERY_UPDATE.md). These brand assets are documented separately and are **not all CC0/open licensed**; this integration follows the user's noncommercial game request and does not claim airline authorization. The earlier graphics comparison remains historical evidence in the realism archive/workspace.

The **2026-10-28 airframe detail pass** adds more articulated wing controls, contoured engine pylons and exhaust geometry, plus a more complete multi-part landing gear. The existing fleet proportions, liveries and gameplay remain in place. See [AIRFRAME_UPDATE.md](AIRFRAME_UPDATE.md); these are procedural approximations, not manufacturer CAD.

The later **aircraft and airport detail pass** adds refined glazing, engine interiors and airframe details, plus staged ground equipment, gate signs, floodlights and wind-responsive windsocks. See [AIRPORT_DETAIL_UPDATE.md](AIRPORT_DETAIL_UPDATE.md) and the [seven-view comparison](dist/detail-review/index.html). Equipment positions and aircraft geometry are visual approximations.

The **nose and landside accuracy pass** rebuilds cockpit glazing and nose contours by aircraft family, and adds map-derived apron, public-road and parking outlines. The [17-view comparison](dist/nose-roads-review/index.html) shows the previous and revised game side by side. The scenery is an incomplete, approximate interpretation: mapped tunnels are not drawn on top of taxiways, and the existing aircraft-routing graph is unchanged. The map data are © OpenStreetMap contributors; their license, provenance, scenario-date limitations and other research sources are documented in [DATA_SOURCES.md](DATA_SOURCES.md).

## Run locally

Use **Node.js 22.12+** and npm, with a desktop browser supporting WebGL 2. Chrome or Edge with hardware acceleration is recommended for the 3D scene.

For the packaged release, extract the ZIP and double-click **Start-ATC.cmd** on Windows. It serves the included `dist/` build locally; installing development dependencies is unnecessary for playing that build. Keep its terminal open while playing.

```sh
npm install
npm run dev
```

Open [the development app](http://127.0.0.1:5173). Port 5173 must be free; if needed, specify another with `npm run dev -- --port 5175`.

For the production build:

```sh
npm run build
npm run preview -- --port 4173
```

Open [the production preview](http://127.0.0.1:4173). Build output is in `dist`. Documentation is copied into `public/docs` by the dev/build scripts. After dependencies are installed, gameplay uses local data and does not require an external schedule, model or audio service.

## First watch

1. Choose **Training** for guided departure and arrival handling, or **New shift** for a timed scenario. **Sandbox** has no shift timer.
2. Select weather, date/time, difficulty and the positions you want to control. Start the watch and let the tower introduction play, or skip it.
3. Click a flight strip or aircraft label. The command panel displays valid clearances. Follow Delivery → Ground → Tower for departures, and Approach → Tower → Ground for arrivals.
4. Inspect and accept proposed taxi routes. Aircraft stop at holding points until cleared to line up. Check occupancy and wake warnings before takeoff or landing.
5. With routine assistance enabled, engine start, ordinary runway exit and routine handoffs follow the operation clearance. Select the next strategic clearance when requested. Training and the default Controller / Hardcore mode retain manual routine commands.

Use 2×, 4× or 8× to shorten waiting. Standard/hardcore modes offer explicit unsafe-clearance overrides with score consequences. Assisted mode protects unsafe clearances. Unattended controller positions may be handled by assistance. **End shift** opens the performance summary.

## Explore the airport

Choose **Explore / 機場漫遊** in the briefing, select a date, time and weather, then start exploring. AI controllers manage every position, ground conflicts and routine handoffs for an unlimited watch. The dated flight snapshot is used where available; later days continue with a synthetic schedule. Flight movements remain the simulator's modeled operations.

Use **W A S D** or the arrow keys to walk, drag with the left mouse button to look around, and hold **Shift** to walk faster. **Space** pauses or resumes traffic. The location selector moves the viewpoint between the runway, apron, Terminal 2 halls, Terminal 3 north concourse and the tower cab. Use the speed controls to watch traffic at 1×, 2× or 4×, and enable flight labels if desired.

Indoor viewpoints stay on their selected floor and use simplified wall and major-obstacle boundaries. Moving between floors, the tower and exterior currently uses the location selector; doors, elevators, stairs, furniture and vehicles do not yet have a complete pedestrian interaction model.

## Plan the traffic

Open **Operations / 作業總覽** for arrival threshold ETAs, departure occupancy estimates, wake intervals, runway occupancy, traffic waves, apron congestion and ground priorities. Standard mode supplies predictions and suggested routes; the controller decides which departure fits an arrival gap. A predicted takeoff opportunity includes line-up time, modeled runway clearance, wake spacing and a safety buffer.

Use **Requests / 請求** beside the flight list to prioritize timestamped requests. Ordinary requests age gradually. Immediate runway problems receive higher urgency without flashing every ground proximity event. Selecting a request opens its aircraft or the relevant planning panel.

A taxi clearance covers the entire chosen route to the runway hold or stand. At a meaningful ground conflict, choose the aircraft that goes **FIRST**, or accept **AUTO RESOLVE**. Aircraft wait outside the protected zone and resume after their authority clears. They retain collision protection while following routes and turning. Adjacent pushbacks compete for apron maneuver space, so approving every pushback can increase queues.

Route dialogs offer up to three distinct graph routes with travel estimates, congestion and crossing information. Inbound stand plans can be changed to a compatible gate; an occupied planned gate creates a request before landing. Weather controls can queue a direction change after committed traffic clears. **Pause & Plan** freezes traffic while leaving priorities, camera inspection and planning available.

| Difficulty | Ground decisions and assistance |
| --- | --- |
| Assisted | Lower traffic, automatic ground priority, route/window suggestions, forgiving delay scoring |
| Standard — recommended | Important conflicts need a decision; routine operations run automatically; routes and runway predictions remain available |
| Advanced | Higher traffic, broader manual ground sequencing, fewer recommendations, stricter scoring |
| Controller / Hardcore | Peak traffic, manual routine actions and priorities, minimal forecasts, stricter wake and safety consequences |

Settings can toggle routine assistance outside Training. The summary records decisions and player commands separately, with command efficiency as a secondary factor. Repeated unnecessary stop/start reversals reduce efficiency; modeled safety interventions are exempt.

## Controls

| Input | Action |
| --- | --- |
| Click flight strip / aircraft | Select aircraft and its controller |
| Click clearance | Issue command; inspect taxi route or enter vector value where applicable |
| `1` / `T` | Tower seat |
| `2` | Walk inside tower cab |
| `3` | Window observation |
| `4` | Free camera |
| `5` | Follow selected aircraft |
| `6` | Orbit selected aircraft |
| `7` | Runway camera |
| `8` | Gate camera |
| Drag | Look around or orbit, depending on camera |
| Mouse wheel | Zoom in supported orbit views |
| `W A S D` / arrow keys | Move in walk/free modes |
| `Q` / `E` | Descend / ascend in free camera |
| `Shift` | Faster movement in free camera |
| `Space` | Pause / resume |
| `H` | Toggle HUD and immersive workstation presentation |
| `F3` | Developer tools: spawn, reset, weather, graph and conflict fixtures |
| Operations → Ground reservations | Developer graph, routes, reserved zones, owners and wait dependencies |
| `Esc` | Close dialog |

Click a physical workstation screen to restore controls from immersive mode. Keyboard shortcuts are ignored while editing inputs. Settings include language, graphics quality, audio and incident frequency.

Medium is the balanced graphics preset. High adds supersampling, edge filtering, full environment lighting and greater detail range. Low disables shadows. Medium/Low retain selected material reflections and reduce detail by distance. The earlier realism release measured 21.4 ms per frame (about 47 FPS) in its paired 1× tower fixture on Intel UHD 730, compared with 18.7 ms before that pass. High is sharper and costs more. Changing graphics quality does not change simulation ticks, traffic density or weather behavior. See VISUAL_REALISM_UPDATE.md for the historical measurements and limits.

## Scope and limitations

The slice includes eight aircraft profiles across four representative airlines, two runway pairs, a selected chart-based ground network, procedural airport/aircraft geometry, tower interior, service vehicles, weather and day/night effects. Traffic is bounded to eighteen active aircraft. Family dimensions are researched; acceleration, weights, V-speeds, braking, wake intervals and pilot timing are gameplay approximations.

The taxi graph is reduced, stand lead-ins and size limits are provisional, and terminal/tower forms are approximate. D11–D18 is included as the operating north concourse; T3 main/south remains a construction representation. Exact construction progress, live NOTAMs, temporary restrictions and a real timetable are not synchronized. Only the 2026 geometry adapter is playable; choosing another date changes scenario traffic/time, not a verified airport configuration. Airline graphics now use real brand artwork on project-authored, approximate paint layouts; no airline authorization or exact per-airframe paint kit is claimed. This is entertainment software, not an operational training or navigation system.

See [DATA_SOURCES.md](DATA_SOURCES.md), [REALISM_NOTES.md](REALISM_NOTES.md), [ASSET_PROVENANCE.md](ASSET_PROVENANCE.md) and [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Checks

```sh
npm test
npm run build
node --import tsx scripts/gameplay-stress.ts
node scripts/verify-realism-lock.mjs
node scripts/verify-realism-assets.mjs
node scripts/verify-livery-assets.mjs
```

The simulation tests exercise lifecycles, routing, occupancy, performance, wake spacing, missed approaches, schedule constraints and deterministic timing. `npm run build` performs TypeScript checking before bundling. When production preview is running, `npm run test:browser` runs the browser suite using its Playwright configuration; set `ATC_NATIVE_GPU=1` to use native GPU Chrome on Windows. `node scripts/visual-regression.mjs --realism` verifies current quality/fleet/reset behavior. The old `verify-render-lock.mjs` applies to the preserved gameplay archive, whose rendering was intentionally locked before this authorized graphics pass.

To regenerate the livery comparison after building, run `node scripts/build-livery-review.mjs`. It uses the saved twelve matching before/after captures; open `dist/livery-review/index.html` directly or through the local game server. Run `node scripts/build-detail-review.mjs` to rebuild the seven-view aircraft and apron comparison from its saved captures. `node scripts/visual-regression.mjs --livery` and `node scripts/realism-smoke.mjs --livery` verify quality/fleet behavior and local-only assets. The older `build-realism-review.mjs` uses the historical graphics captures and performance report when those are available in the workspace/realism archive.

For a blank scene, enable WebGL 2/hardware acceleration, reload, and try Low graphics quality. A saved language/quality/audio preference is stored locally; the application does not include saved-shift restoration.

## Ready-built local launcher

The `dist/` folder is included after building. Double-click `Start-ATC.cmd`, or run `npm start`, then open [the local game](http://127.0.0.1:4173). This launcher only requires Node.js; it does not fetch packages or external assets. Keep the launcher running while playing. Development changes still require `npm run build`.

Run `npm run test:browser` for the production-browser QA suite. It uses installed Chrome on Windows or an installed Playwright Chromium elsewhere, in an isolated temporary profile.

`Taoyuan-Tower-airport-detail-update.zip` contains the latest ready-built game, source and documentation. Extract it before running `Start-ATC.cmd`. The earlier v0.1, visual-update, gameplay-update, realism-update, livery-update and airframe-update archives remain separate prior-version backups in the workspace.
