# Aircraft and airport detail verification — 2026-10-28

The current detail pass passes TypeScript/production compilation, **55 unit tests** and **four production-browser workflows**. The fleet/quality regression checks eight aircraft types, Low/Medium/High settings, finite geometry, no browser/GPU errors and five stable reset samples (**936 geometries / 105 textures**). All 18 non-rendering source hashes remain unchanged. A paired 14-aircraft Medium tower fixture on Intel UHD 730 measured **21.30 → 21.35 ms** at 1×; seven paired close-up captures and the graph-clearance tests are described in AIRPORT_DETAIL_UPDATE.md. Sections below record the checks made for their earlier releases.

---

# Real-world livery verification — 2026-10-28

The subsequent livery extension passes TypeScript/production compilation, **four native-GPU production UI workflows** (40.7 seconds), Low/Medium/High switching, eight fleet types, finite geometry and five stable reset samples (**860 geometries / 103 textures**). Twelve matching left/right/tail comparisons have no browser/GPU errors. All **18 non-rendering sources** remain unchanged.

Seven brand files match their SHA-256 digests and static SVG checks. An external-network-blocked smoke test loads all seven brand plus seven environment images locally, starts the game, opens Operations and checks the new comparison viewer with zero external requests/errors. Reports are in `livery-qa/`; read LIVERY_UPDATE.md and open `dist/livery-review/index.html`. Brand assets have separate rights metadata and are not all CC0. Prior realism performance numbers and the historical sections below apply to their archived builds.

---

# Visual realism verification — 2026-10-28

The current rendering build passes TypeScript/production compilation, **52 simulation tests**, **four native-GPU production UI workflows**, Low/Medium/High switching, finite geometry for eight aircraft types, and five scenario resets with a stable **856 geometries / 103 textures**. The quality/fleet/reset check and final fifteen-view Medium/High capture sets contain no page, console or GPU errors. All **18 non-rendering sources** match the gameplay-release baseline. Seven local CC0 images match their recorded SHA-256 digests.

An external-network-blocked browser smoke test starts a watch, opens Operations and exercises the fifteen-view comparison; all seven material images load locally with zero external requests. Current evidence is in `realism-qa/`, `visual-qa/realism-before/`, `realism-after/` and `realism-high/`.

The paired fourteen-aircraft Medium tower test measures **18.70 → 21.40 ms** at 1× on Intel UHD 730, approximately **53.5 → 46.7 FPS**. This +14.4% frame-time cost is documented, with quality/distance controls retained. Read [VISUAL_REALISM_UPDATE.md](VISUAL_REALISM_UPDATE.md) for the complete change record, methodology and limits; open `dist/realism-review/index.html` for unretouched comparisons. The prior sections below, including their graphics-lock/hash claims and earlier test counts, describe their respective historical archives.

---

# Gameplay update verification — 2026-10-27

The current gameplay build passes TypeScript/production compilation, **52 simulation tests**, the **four production-browser workflows**, and a final separate operations/route-choice browser check. The older sections below record the original slice and graphics release; their earlier test counts are historical.

## Surface and gameplay regression

The original opposing N-route deadlock was reproduced before implementation. The same routes now reach their destinations through continuous movement, with one controller priority decision in Standard. Nineteen surface tests cover intersections, opposing entry, stable three-aircraft ordering, runway-exit priority, wait cycles, reservation cleanup, crossing authority, non-passing chains, apron feeders, adjacent gate turns and safe detours. Ten gameplay tests cover operation clearances, request aging, runway opportunities, wake/occupancy predictions, difficulty, command efficiency, route cancellation, gate planning and configuration transitions. All 23 earlier lifecycle/determinism tests remain passing.

Four seeded stress scenarios each inject two hours of traffic, stop new demand and drain accepted flights using validated commands and controller priorities. The driver never overrides unsafe clearances. Physical aircraft rectangles are checked for overlap.

| Mode | Departures / arrivals | Priority choices | Drain time | Active flights left | Overlapping pairs |
| --- | ---: | ---: | ---: | ---: | ---: |
| Assisted | 24 / 26 | 0 | 42:23 | 0 | 0 |
| Standard | 38 / 32 | 18 | 45:45 | 0 | 0 |
| Advanced | 41 / 35 | 35 | 59:55 | 0 | 0 |
| Controller / Hardcore | 35 / 38 | 25 | 50:22 | 0 | 0 |

All **269 flights complete**. No internal cyclic wait persists in the final schedule runs. Separate artificial and real-graph cycle fixtures verify recovery. Normal runway queues can last several minutes; the soak checks eventual completion rather than asserting that every temporary stop is a deadlock.

Evidence: `gameplay-qa/unit-results.txt`, `deadlock-baseline.json`, `deadlock-fixed.json`, `stress-summary.json` and the four mode reports.

## Interface and visual preservation

The four browser workflows exercise launch, bilingual text, all eight cameras, immersion/workstation controls, pause/time scales, the complete manual tutorial, warnings/overrides, gates/weather/summary, and the new request queue, four difficulty presets, paused priorities, route alternatives and seven debug layers. The final operations check also verifies the final route congestion metadata. Reports are `gameplay-qa/browser-results.json` and `gameplay-qa/operations-browser-results.json`; screenshots include the operations overview, priority decision, reservation graph and Chinese interface.

SHA-256 checks confirm **all 11 rendering source files, airport geometry and fleet definitions are unchanged**. The shared engine bundle remains `engine-BcvEyzd5.js`. Native-GPU checks verify Low/Medium/High behavior, all eight aircraft types with finite geometry and five scenario resets. Reset resources remain exactly **811 geometries / 86 textures** in each sample. Twelve day/night/aircraft/terminal/tower/aerial/weather fixtures are captured under `visual-qa/gameplay-final/`; sampled tower, aircraft, night, rain and debug/operations views were inspected. Browser, console and GPU error arrays are empty.

## Performance comparison

The preserved graphics release and gameplay build use the same fourteen-aircraft snapshot, routes, camera, 1440×900 viewport, Medium quality, four-sample antialiasing and shadows on Intel UHD Graphics 730. Two paired rounds use 45 warm-up and 180 measured frames per condition. The table averages the two median frame times:

| Speed | Graphics release | Gameplay update | Change |
| --- | ---: | ---: | ---: |
| Paused | 19.00 ms | 18.95 ms | −0.3% |
| 1× | 19.00 ms | 19.30 ms | +1.6% |
| 8× | 18.85 ms | 18.85 ms | 0.0% |

Median FPS does not materially regress in this fixture. Reservation calculations add CPU work: mean simulation time per rendered frame is approximately 0.65 ms at 1× and 3.92 ms at 8×, versus 0.15 / 0.58 ms in the graphics release. At 1×, mean sample p95 frame time rises from 23.2 to 27.1 ms; raw percentiles and hardware details are retained in `gameplay-qa/performance.json`. This short single-GPU comparison is not a sustained benchmark across all views or hardware.

## Delivery scope

The separate `Taoyuan-Tower-gameplay-update.zip` contains the runnable build, launcher, source, tests, documentation and selected final QA evidence. The original and graphics-update archives remain intact. The reduced airport graph has no through active-runway crossing route; crossing protection is verified on a deterministic graph fixture. Ground geometry, gate compatibility, wake intervals and timing remain game approximations. See GAMEPLAY_PASS.md and REALISM_NOTES.md for the exact boundaries.

---

# Original vertical slice verification

Reference date: 2026-09-06. Local Windows, Node.js 24.14, TypeScript, Vite production build. This report distinguishes automated functional checks from rendering fidelity.

## Automated simulation checks

`npm test`: **23 passed**. Coverage includes:

- Full departure and arrival lifecycle on both physical runways in both directions.
- Graph routing, incompatible or occupied stands, closures and opposing surface traffic.
- Explicit runway-clearance warning/override, safety penalties and wake spacing.
- Weight/type/wet-pavement performance differences.
- Missed approach without teleportation, then rejoining for landing.
- Heading, altitude and speed commands with unit conversion.
- Fixed tick determinism, pause, time acceleration and zero-duration sandbox.
- Nonuniform seeded traffic, regional narrowbody routes, eighteen-aircraft limit.
- Seeded evolving weather in randomized scenarios.
- A complete sixty-minute multi-aircraft assisted shift, with finite positions and both arrival/departure throughput.

The 60-minute reference soak handled **11 departures and 9 arrivals**, retained 17 aircraft at the boundary, and ended normally. A prevented runway conflict recorded a safety event; AI assistance is a gameplay aid, not an assurance of flawless airport sequencing.

## Production browser checks

`npm run test:browser`: **3 passed** using isolated headless Chrome. The tests use actual UI controls and deterministic simulation clock advancement for long waits; they do not wait a full hour of wall-clock time.

1. Launch without JavaScript page errors; English/Traditional Chinese switching; eight distinct camera modes; cab movement bounds; an actual raycast click on a physical workstation screen; pause/resume and 8× time.
2. Complete guided tutorial through the actual command buttons, role handoffs and route-acceptance dialogs. One departure hands off; one arrival lands, vacates, taxis and docks. The completed aircraft remains represented in the 3D scene.
3. Unsafe landing warning and explicit override reduce safety; occupied compatible stand preview warns; the 51-stand board renders; rain/wind change updates runway recommendation; a 15-minute shift displays all five score categories; continuing in sandbox stays active.

Manual in-app browser inspection also confirmed the menu, tower cab, flight strips, pushback, aircraft follow view and visible command feedback. No console errors were found in the inspected views.

Screenshots and machine-readable results are generated under `test-results/`. Headless tests use software WebGL and are functional checks, not a hardware performance benchmark. Low/Medium/High graphics settings are available; broad GPU/browser performance characterization is still needed.

## Delivery and known fidelity limits

`npm run build` passes TypeScript checking and emits the runnable `dist/` game. The dependency-free Node server in `scripts/serve.mjs` returned HTTP 200 for the game and source notes. Gameplay loads local assets/data and requires no live schedule or media service.

The full operational loop is playable. The delivered visuals are procedural approximations; authorized exact airline logos, detailed glTF aircraft assets, surveyed architecture, complete taxi geometry, certified procedures/performance and live NOTAM coverage are not delivered. Traffic is the explicitly labeled **Typical Taoyuan Traffic Day**, not an exact dated timetable. Manual taxi-route construction and future airport configurations remain upgrade paths. Read REALISM_NOTES.md and ASSET_PROVENANCE.md before expanding fidelity or redistribution.

## Graphics update verification — 2026-09-07

Final rendering changes passed **23 simulation tests**, **3 production-browser tests** (3.2 minutes), and the additional visual regression script. SHA-256 verification confirms all 11 non-rendering source files are unchanged. All eight aircraft types rendered with finite geometry; Low/High/Medium switching worked; five scenario resets plateaued at 811 geometries and 86 textures with no page, console or GPU errors.

Twelve fixed views were captured before the update, after at Medium, and after at High. The final captures were inspected for aircraft/bridge contact, double-sided livery alignment, cab ceiling/glazing, terminal/tower shape, ground depth artifacts and day/night/rain/evening appearance. [The comparison viewer](visual-qa/review.html) shows the actual unretouched frames.

On Intel UHD Graphics 730, short native-GPU Medium samples were 14.8–20.7 ms per frame; High samples were 27.1–40.8 ms. These are medians of 12 RAF intervals in paused fixtures, not a sustained performance benchmark. The original build was verified against all 15 original source hashes and tested separately on the same machine. Aerial draw calls fell from 863 to 413; night and several close views gained cost. High's image quality comes with a measurable frame-rate tradeoff. See [VISUAL_CHANGELOG.md](VISUAL_CHANGELOG.md) for full measurements, exact modifications and remaining visual limitations. The earlier functional coverage and scope limitations above still apply.
