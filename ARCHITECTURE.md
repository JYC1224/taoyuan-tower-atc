# Architecture

Taoyuan Tower is a TypeScript application built with Vite and rendered with Three.js. Simulation state is independent of scene meshes and DOM presentation. The app uses local fixtures; no backend or live aviation-data connection is required for gameplay.

## Modules

| Module | Responsibility |
| --- | --- |
| `src/types.ts` | Shared aircraft, scenario, command, weather, score and simulation interfaces |
| `src/data/airport.ts` | Runways, declared distances, selected stand/intersection data, taxi graph, source metadata and era/rule separation |
| `src/data/fleet.ts` | Aircraft family dimensions/performance parameters and independent airline/livery definitions |
| `src/data/schedule.ts` | `ScheduleProvider` interface, seeded typical-day traffic banks and type-compatible destination pools |
| `src/sim/Simulation.ts` | Fixed ticks, explicit lifecycle states, command validation, occupancy, controller assistance, incidents and scoring |
| `src/sim/routing.ts` | Graph route search, width/span/closure constraints, occupied-segment costs and path smoothing |
| `src/sim/performance.ts` | Family/weight/weather-adjusted kinematic performance and wake timing |
| `src/render/AirportScene.ts` | Cameras, aircraft visual lifecycle, selection, weather/light updates, service animations and scene disposal |
| `src/render/airportEnvironment.ts` | Procedural airport/tower environment, physical screens, gates, lighting and vehicles |
| `src/render/aircraft.ts` | Replaceable aircraft geometry and airline decal/material presentation |
| `src/render/aircraftDetail.ts`, `aircraftSkin.ts` | Original lofted airfoils, curved fan rotors, near-distance airframe details and generated livery/PBR maps |
| `src/render/realismAssets.ts` | Cached local CC0 surface/HDR loading and PMREM generation; no runtime service call |
| `src/render/liveries.ts` | Cached local brand artwork, source-aware generated color layouts and dual-face tail atlas; repaints existing textures after local images decode |
| `src/render/sceneDetail.ts`, `surfaceDetail.ts` | Batched apron/cab details, periodic turf, calibrated pavement shaders and facade textures |
| `src/render/primitives.ts` | Reusable geometry, pavement, texture and instancing helpers |
| `src/main.ts` | Scenario menu, HUD, roles, flight strips, route dialogs, tutorial, settings, summary and input binding |
| `src/ui/i18n.ts`, `styles.css` | English/Traditional Chinese text and responsive UI styling |
| `src/audio.ts` | Locally synthesized ambience and feedback through Web Audio |
| `tests/simulation.test.ts` | Deterministic simulation and routing checks |
| `scripts/sync-docs.mjs` | Copies source/realism/provenance documents into the served app |

## State and frame flow

```text
Scenario + ScheduleProvider + Airport/Fleet data
                      ↓
                 Simulation
          command() → validation → state transition
          update()  → fixed ticks → positions/occupancy/scores
                      ↓
              shared aircraft snapshots
                 ↙            ↘
           Three.js scene    HUD / tutorial / radio
```

Simulation ticks run at **10 Hz** using a 0.1-second accumulator. Render frames pass elapsed real time; the simulation applies its selected time scale. Pausing stops simulation advancement while the scene can still render and cameras remain usable. Seeded randomness drives scenario traffic and bounded incident/profile choices; cosmetic noise and audio need not be deterministic.

Aircraft have explicit departure/arrival states. Commands are checked against state before execution. Taxi clearances create routes; line-up and runway departure use separate transitions. Occupancy tracks the physical runway as well as aircraft identity. Unsafe commands can return a warning for a user override; overridden clearances are scored. Ground yielding and automatic go-around guards remain physical simulation safeguards. Assisted roles issue the same validated commands rather than teleporting aircraft.

## Coordinates and data fidelity

Distances/speeds/weights are internally metres, metres per second and kilograms; controls convert aviation units where needed. Local x follows the runway's northeast direction, z points southeast and y is height. Current aircraft orientation uses heading 0 toward -z and π/2 toward +x. Scene angles, true bearings and runway magnetic designations are separate concepts.

The north runway center is `(0, -760)` in x/z. The south runway center is approximately `(-235, 748)`. Runway dimensions and selected stand/taxiway points come from the applicable CAA AIP; tangent-plane projection and reduced topology support a compact scene. Rendering consumes the same graph used for routing. Internal vertex IDs are distinct from real taxiway edge names.

`airportGeometryByEra` is separate from `airportOperationalRules`. Only the 2026 adapter is usable; the future entry is a reserved interface. Source metadata records publication, effective, expiry and verification dates, plus confidence. Future published-but-not-effective airport data must not silently replace the current adapter. Read DATA_SOURCES.md for unresolved supplement and NOTAM coverage.

## Extension boundaries

The 2026-10-28 rendering pass consumes the same simulation snapshots and preserves all 18 non-rendering source hashes from the gameplay release. `AirportScene.assetsReady` resolves after local material loads and HDR reflection setup; QA awaits it before sampling. Surface image sets are cached across materials and scenario resets, while per-aircraft maps retire with their visuals. Medium/Low use selected material reflections; High enables full scene image-based lighting. Fine aircraft details use 130/260/650 m Low/Medium/High distance limits; expensive ground normal reconstruction is limited to 0/250/550 m. These presentation choices never change routing or collision data. Existing MSAA, High supersampling/edge filtering and shadow settings remain in place.

- **Schedules:** implement `ScheduleProvider` for a validated local import or licensed official provider. Preserve date/equipment/source metadata and its exactness flag; retain the explicitly labeled fallback when coverage is missing.
- **Aircraft:** add a fleet profile separately from an airline livery. Replace procedural meshes/decals with assets whose provenance and distribution terms are documented.
- **Airport:** expand the same graph with verified dated topology, restrictions and stand data. Add proper era selection before claiming another date's airport configuration.
- **Procedures:** approach/departure and missed approaches are synthetic local paths. Published SID/STAR/ILS and separation rules need independent data and validation adapters.
- **Presentation:** cameras/HUD/audio consume state; they must not become authoritative sources of movement or clearance status.

The `window.__ATC` development hook exposes the simulation, scene, selection, refresh and scenario-start helpers for local QA. It is not a network API or save-game format. Tests may advance the deterministic clock, but UI acceptance checks should still issue commands through the actual interface. Visual performance, asset fidelity, real schedules and operational certification remain separate validation concerns.

## Graphics update boundary — 2026-09-07

The original simulation, main/UI, audio and data sources are unchanged. Rendering gained focused helpers: `surfaceDetail.ts` for maps/batching, `aircraftSkin.ts` for smooth UV geometry, `architectureDetail.ts` for terminal/tower details, `jetbridge.ts` for visual articulation, `atmosphere.ts` and `airfieldLights.ts` for weather/lighting, and `HighQualityPass.ts` for optional image filtering. These consume the existing state and do not own aircraft movement, gate occupancy or clock advancement. Static batches exclude animated parts and workstation hit-test meshes.

The comparison viewer and visual fixture scripts are separate QA artifacts. They are not imported by the game. See VISUAL_CHANGELOG.md for the exact file boundary, rendering tradeoffs and regression evidence.

## Gameplay update — 2026-10-27

The gameplay update extends simulation and UI modules while preserving all 11 rendering sources, `airport.ts` and `fleet.ts` against the graphics baseline. It does not change the renderer's quality presets, materials, camera geometry, lighting or scenery.

| Module | Responsibility |
| --- | --- |
| `src/sim/GroundTraffic.ts` | Conflict zones, stable leases, movement authority, controller priority, wait dependencies and cycle detection |
| `src/sim/groundFootprint.ts` | Oriented footprint overlap and continuous swept translation/turn prediction |
| `src/sim/RunwayPlanner.ts` | Threshold ETAs, line-up and occupancy estimates, wake intervals and departure opportunities |
| `src/sim/RequestQueue.ts` | Stable request timestamps, urgency aging, safety levels and resolution cleanup |
| `src/sim/difficulty.ts` | Traffic, routine assistance, information, decision and scoring presets |
| `src/ui/operations.ts`, `operations.css` | Operations overview, request strips, selected-flight information and ground debug canvas |

Ground allocation runs every 0.5 simulated seconds from one snapshot, before movement. The lookahead normally covers 360–720 m and the next 12 route nodes. Aircraft consume their granted travel distance during the existing 10 Hz physics ticks and brake toward a safe hold. The independent footprint guard checks each actual movement and candidate heading; its waits also enter the dependency graph.

A non-passing road chain between usable branching junctions is one corridor lease. Stand feeders cannot split that chain. Interior edge and node requests belong to the corridor's authority, preventing contradictory sub-leases to aircraft outside it. Separate endpoint, runway and apron maneuver zones protect merges, exits and adjacent pushbacks. Occupancy is rebuilt from aircraft positions. It survives route cancellation and pauses until the physical aircraft clears; unused future leases are released on holds, route changes, completion and removal.

Operational urgency, waiting tickets, controller choices and aircraft ID determine stable ordering. A granted lease is retained until cleared rather than recomputing a winner every frame. Meaningful manual decisions hold all uncommitted contenders outside the resource. Same-flow following does not create a priority dialog. Physically committed traffic and runway-vacating aircraft retain protection.

Strongly connected wait dependencies expose cycles. Recovery releases unneeded future leases and searches for a compatible alternate route from a forward junction. A new route must avoid an immediate U-turn and provide enough swept space to clear that first junction. It preserves continuous movement and never relocates or deletes a blocked aircraft. Controller / Hardcore leaves ordinary congestion planning to the player; internal dependency-cycle recovery remains a safety fallback. Unavailable destinations or closed topology produce an intervention request.

Runway plans use the existing aircraft performance and weather, not a second movement model. Opportunities include current occupancy, line-up after runway clearance, departure roll/climb, arrivals and wake spacing. Routine assistance issues the same validated commands as the controller. Pushback, taxi route, line-up, takeoff, landing, crossing and gate choices remain decisions. Training preserves its manual instructional flow.

Operations snapshots are cached for one simulated second and invalidated by commands and operational changes. Request timestamps survive aging; duplicate priority requests for the same aircraft group are coalesced. Rendering and UI never issue movement authority. QA scripts, snapshots and stress drivers are not imported by the shipped application.
