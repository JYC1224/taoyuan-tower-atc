# High-fidelity lighting and rendering — 2026-11-12

The High preset now uses 4× multisampled post-processing targets, scene ambient occlusion, subtle highlight bloom and AgX tone mapping. High rendering scale is raised to 2× device ratio (capped at 3× and the GPU texture-size limit); directional shadows use a 4096 map, and pavement/aircraft near detail reaches farther from the camera. Taoyuan's solar direction and twilight are calculated from the selected scenario date and local time. Existing airport, terminal and aircraft geometry is preserved.

The image pipeline changes have passed the production build. A live browser preview could not be captured in this environment because localhost requests timed out, so the new AO/bloom balance and hardware frame rate still need on-device visual review. This pass does not add surveyed or photogrammetric airport geometry.

# Graphics repair — 2026-09-07

This update continues the existing playable Taoyuan Tower v0.1. The changes repair overlapping surfaces and aircraft skins, sharpen the rendered scene, distinguish Taoyuan's tower and terminals, and improve day/night/wet-weather presentation. Runtime source changes are confined to `src/render/`. The existing baseline archive remains `Taoyuan-Tower-v0.1.zip`.

## Preserved behavior

All **11 non-rendering source files match their pre-edit SHA-256 hashes**: main/UI and inputs, audio, shared types, airport/fleet/schedule data, routing, performance and simulation. Aircraft identity, dimensions used by simulation, gate positions, taxi graph, clearance/state transitions, weather effects, game clock, scoring and tutorial are unchanged. No framework or engine dependency was upgraded. Visual gear/bridge/vehicle transforms consume existing state; they do not write back to aircraft positions or routes.

## Implemented changes

| Files | Result |
| --- | --- |
| `src/render/AirportScene.ts` | Logarithmic depth, near/far tuning, stable focused shadows, targeted sky reflections, balanced exposure, quality presets, batched scene integration and aircraft resource retirement. Existing cameras, controls, screen raycasts and labels retained. |
| `src/render/HighQualityPass.ts` (new) | High adds 1.35× device-ratio supersampling and a bounded nine-sample edge filter after native MSAA. HTML ATC text is outside this pass. No temporal history, motion blur or bloom. |
| `src/render/primitives.ts`, `surfaceDetail.ts` (new) | Explicit paint/label separation, lit markings, mipmapped anisotropic concrete/asphalt/grass maps, world-coordinate texture alignment, facade maps and static mesh batching. Taxi junction fillets are visual only. |
| `src/render/aircraft.ts`, `aircraftSkin.ts` (new) | Smooth 80-ring / 48-side fuselage, one fitted UV skin, readable titles on both sides, cockpit/passenger windows, tail artwork, engine ducts/fans/rims/pylons, family wing tips, connected gear and detailed wheels. Removes overlapping belly shells and rectangular livery patches. Original animations and model bindings remain. |
| `src/render/jetbridge.ts` (new) | Separate articulated corridor and cab, forward-door alignment and proportional detail without stretching the entire bridge. Dock/retract behavior reads the same existing aircraft states. Simulated gate headings remain untouched. |
| `src/render/architectureDetail.ts` (new), `airportEnvironment.ts` | ANWS-inspired asymmetric curved-white/folded-metal tower, repaired ceiling and exterior glazing, T1 catenary roof, T2 layered flat roof and trusses, repeated facade detail and jet bridges. Existing T3 north-concourse operation / main-and-south construction remains. |
| `src/render/atmosphere.ts` (new) | Camera-centered sky, grouped procedural clouds, restrained sun and horizon, humid distance haze tied to existing visibility, rain streaks and wet pavement material response. |
| `src/render/airfieldLights.ts` (new), `airportEnvironment.ts` | Batched soft lens lights, directional red/green runway ends, centerline lights, simpler runway-name signs, hold-line detail, terminal window light, apron light pools and one bounded local fill light. |
| `airportEnvironment.ts`, `architectureDetail.ts` | Subtle runway tyre wear, parking outside airside areas, generalized coastal water, wind turbines, fields and industrial roofs. No invented named landmarks or relocated operational pavement. |

Static airport/aircraft meshes are batched by material; animated parts and hit-test targets stay separate. Distant bridges use a simpler proxy. Retired aircraft release owned maps, materials and geometry. No gameplay tick rate or traffic density is coupled to a graphics preset.

## Graphics presets

| Preset | Internal ratio | Shadows | Image treatment |
| --- | --- | --- | --- |
| Low | Device ratio capped at 1 | Off | Native MSAA; basic material path; wet reflection environment omitted |
| Medium | Device ratio capped at 1.5 | 2048 map with camera-dependent coverage | Native MSAA, filtered textures and targeted material reflections |
| High | 1.35 × device ratio, capped at 2 | 3072 map with camera-dependent coverage | Native MSAA + supersampling + small edge filter |

Medium is the practical default on the tested integrated GPU. High prioritizes still-image edge quality and costs considerably more. Canvas colour maps use sRGB; the renderer applies ACES and sRGB output once. High's final filter operates on that finished image. Runtime textures are original procedural canvas assets; there is no remote asset dependency.

## Measured performance

Chrome / ANGLE D3D11 / **Intel UHD Graphics 730**, headless, 1440 × 900 CSS pixels, DPR 1. Before and after use the same seed, weather, paused aircraft fixtures and fixed camera poses. Medium renders 1440 × 900; High renders 1944 × 1215. Each timing is the median of **12 RAF intervals**, not a sustained gameplay benchmark or a promise for other hardware. The in-game FPS readout was not used because its input delta is capped.

| View | Before Medium ms | After Medium ms | After High ms | Draw calls before → after Medium |
| --- | ---: | ---: | ---: | ---: |
| Tower day | 18.4 | 18.4 | 40.8 | 159 → 120 |
| Tower night | 13.2 | 18.0 | 32.8 | 125 → 167 |
| Aircraft at gate | 13.8 | 17.3 | 32.6 | 105 → 92 |
| Aircraft taxi | 17.5 | 15.0 | 31.1 | 801 → 441 |
| Takeoff roll | 14.2 | 14.8 | 31.5 | 79 → 55 |
| Landing approach | 12.8 | 15.7 | 27.1 | 81 → 57 |
| Terminal 1 | 18.9 | 19.0 | 37.7 | 784 → 416 |
| Terminal 2 | 18.8 | 19.0 | 36.1 | 778 → 412 |
| Tower exterior | 13.8 | 16.0 | 34.2 | 468 → 266 |
| Airport aerial | 22.4 | 15.6 | 32.5 | 863 → 413 |
| Rain | 19.2 | 20.7 | 38.4 | 106 → 93 |
| Evening | 14.7 | 15.8 | 34.9 | 848 → 404 |

Medium's samples correspond to approximately **48–68 FPS**; High's to **24–37 FPS**. Aerial draw calls fell by about 52%; night and some close views became more expensive because of additional lighting, textures and geometry. This is a mixed performance result with substantially cleaner presentation, not a claim that every view became faster. The comparable baseline is the original archive with all 15 source hashes verified, not a reconstructed approximation of the old renderer.

## Verification and evidence

- `npm test`: **23 passed** after final rendering edits. Covers departure/arrival lifecycles in all four runway directions, deterministic timing, routing, conflicts, performance, weather, scheduling and a 60-minute simulated shift.
- `npm run test:browser`: **3 passed** in 3.2 minutes after final rendering edits. Production UI checks cover launch, both languages, eight cameras, cab walking bounds, physical-screen click, pause/8×, full tutorial departure and arrival, unsafe-clearance consequences, stand occupancy, weather recommendation and end-of-shift summary. Latest result is in `test-results/browser-results.json`.
- `node scripts/visual-regression.mjs`: **passed**. All 11 protected hashes unchanged; Low → High → Medium switching; all eight model families have finite geometry; both livery sides captured; five resets plateau at **811 geometries / 86 textures**; no page, console or GPU errors. This checks repeated scenario/aircraft retirement, not every possible browser teardown lifecycle.
- Final Medium and High runs captured all **12 required views** and reported empty error lists. Inspected cab ceiling and glass, aircraft noses/tails/gear/engines, bridge contact, T1/T2/tower forms, long-range depth, dusk, night and rain. Original baseline captures are retained separately.
- `npm run build` performs TypeScript checking and emits the local production game. Final delivery retains the dependency-free launcher and Three.js notice.

Open [visual-qa/review.html](visual-qa/review.html) for the draggable before/after comparison. `comparison.json` contains the fixture and measurement data; `after/` and `after-high/` contain unretouched application screenshots. The QA viewer does not change the game's UI. The art fixtures pause the simulation and hide the HUD only within the isolated test page; live lifecycle tests use the real command controls separately.

## Reproduction

With the production server running on port 4173, use PowerShell:

```powershell
npm test
npm run test:browser
node scripts/visual-regression.mjs
$env:ATC_NATIVE_GPU='1'
$env:ATC_QUALITY='medium'
node scripts/visual-qa.mjs after
$env:ATC_QUALITY='high'
node scripts/visual-qa.mjs after-high
node scripts/build-visual-review.mjs
```

The visual scripts use the locally installed Windows Chrome path. To capture a baseline, run the preserved v0.1 build separately and set `ATC_QA_URL` to that loopback URL; leave `ATC_QUALITY=medium`. Unset `ATC_NATIVE_GPU` to use the software WebGL path for functional diagnosis. Do not compare its timings to native-GPU measurements.

## Remaining fidelity limits

The airport and aircraft remain procedural approximations. Airline names, colours and text are recognizable interpretations, not exact authorized logo artwork. T1/T2/tower forms and surrounding coastline/buildings are not surveyed models; current works are represented broadly, without live construction or NOTAM synchronization. Clouds are textured sky structure rather than expensive volumetrics; wet pavement uses rough environment reflection rather than a mirror or ray tracing. Night apron fill and light pools are simplified. Very thin distant roof ribs, paint and lights can still alias, especially on Medium. High helps but does not implement temporal antialiasing. Broader GPU/browser and long-duration rendering-performance coverage remains unverified.

Research and date discipline are recorded in [VISUAL_REFERENCES.md](VISUAL_REFERENCES.md), initial defects in [VISUAL_AUDIT.md](VISUAL_AUDIT.md), and asset rights/limitations in [ASSET_PROVENANCE.md](ASSET_PROVENANCE.md). This update does not turn the prototype into an operational navigation or certified ATC training system.

## Supporting files

Added the three visual documents and the visual QA/review scripts; updated README, architecture, asset provenance and QA notes. Build output and served provenance are regenerated. Baseline hashes, source copies and archive were retained. Temporary one-use source-edit scripts were removed after their changes were integrated.

Delivery: `Taoyuan-Tower-visual-update.zip` includes the built `dist/` game, source, launcher, documents and the comparison viewer's three image sets. It excludes `node_modules`, downloaded research charts, exploratory capture directories and the original archive. Extract and run `Start-ATC.cmd`; Node.js is required, but installing packages is unnecessary for the already-built game. `visual-qa/final-source-check.json` records the final protected-file check and exact four modified / seven added rendering sources.
