# Ground intelligence and gameplay depth — 2026-10-27

This is the historical implementation/QA record for `Taoyuan-Tower-gameplay-update.zip`. The subsequent user-authorized **2026-10-28 realism pass** extends rendering while preserving all 18 gameplay/UI/audio/data sources from this release. Its current graphics, asset provenance and performance are documented in VISUAL_REALISM_UPDATE.md; the rendering lock described below applies to the earlier gameplay archive.

## Baseline / locked presentation

The existing graphics update is the baseline. All source files were copied to `gameplay-qa/baseline-source/src/` and SHA-256 hashes recorded in `gameplay-qa/baseline-source-hashes.json`. `src/render/`, airport geometry, fleet models, antialiasing, materials, lights and weather visuals are locked. Gameplay UI additions must use the existing style. The separate original and graphics-update ZIPs remain untouched.

Baseline `npm test`: 23 passed. Production build passes with the same graphics asset hashes. Native GPU baseline captures are under `visual-qa/gameplay-baseline/`; browser workflow checks run separately.

## Confirmed defect

`node --import tsx scripts/reproduce-ground-deadlock.ts` reproduces two A320 departures following N4 → N5 → N6 → N7 and the reverse route. After 720 simulated seconds both remain TAXIING with speed zero, approximately 55.57 m separation, and zero movement over the final 120 seconds. Report: `gameplay-qa/deadlock-baseline.json`.

`followPath` claims an edge only after moving. It may retain that edge while another aircraft waits at the far endpoint; the claimant then stops at the physical separation guard. Both keep their dependency indefinitely. Intersection conflicts rely on the same symmetric distance guard. There is no future-zone ownership, safe exit-space check, wait-for cycle detector or alternate-route recovery. The existing 60-minute test checks throughput but does not assert that every internal ground wait recovers.

## Ground architecture delivered

Surface allocation now uses graph node, edge, runway, geometric crossing, apron maneuver and non-passing corridor resources. A degree-two road chain shares one lease, including its interior junctions. Its internal segments cannot be allocated independently to an opposing aircraft. Stand feeders are staging areas rather than passing places.

Aircraft request ahead of movement, normally over 360–720 m and the next twelve route nodes. Whole-body exit space and an available downstream path determine the stop limit. Taxi speed decreases toward the hold; apron feeders remain at their staging position until enough space is available. Swept oriented rectangles predict translation and intermediate turning orientations. The actual per-step footprint guard remains enabled.

Urgency, waiting tickets, player choices and stable IDs determine priority. Existing ownership remains stable. Runway-vacating arrivals receive operational priority, while aircraft already committed cannot be displaced. Manual conflicts hold contenders outside the resource and offer both aircraft and AUTO RESOLVE. Standard requests important decisions; Advanced and Controller / Hardcore request broader sequencing. Same-flow following does not repeatedly request priority.

Wait dependencies include reservation and physical turning waits. Strongly connected components detect cycles. Recovery releases unused future leases, then searches for an alternate compatible route through a forward junction. The new route must avoid an immediate U-turn and leave enough space for the complete aircraft to clear its first turn. It preserves continuous centerline movement. Closed topology or genuinely unavailable destinations produce an intervention request. Ordinary Controller / Hardcore congestion remains a player decision; internal-cycle recovery is a safety fallback.

Unused reservations release on route changes, hold/cancellation, completion and removal. Physical occupancy remains protected until the aircraft clears it. No deadlock resolution teleports, clips, removes an aircraft or disables collision detection.

## Gameplay delivered

- A clearance covers taxi to the runway hold or stand. Routine engine start, ordinary runway exit and handoffs can follow the operation automatically. Training retains manual instruction; Controller / Hardcore defaults to manual routine actions.
- Requests retain timestamps, aircraft, role, type, aging, urgency and advisory/caution/warning levels. Duplicate priority requests for the same aircraft group are coalesced.
- Operations shows runway occupancy, arrival threshold ETA, type/wake/speed/distance, departure line-up and occupancy estimates, wake intervals and departure windows. Standard shows predictions for the player to interpret.
- Pushbacks reserve apron maneuver space and expose nearby surface traffic and inbound gate-corridor demand. Inbound gate plans can create occasional pressure and can be reassigned to compatible stands.
- Up to three distinct graph routes expose distance/time, busy segments and actual crossing information. Standard suggests a route; higher modes reduce recommendations.
- Seeded arrival/departure banks create quiet, building, wave, mixed-peak and recovery periods. Traffic remains bounded to eighteen active aircraft.
- Runway configuration can be queued, allowing committed traffic to finish before changing direction and releasing new demand.
- Four difficulty profiles change density, guidance, manual decisions, routine assistance, wake and scoring. Decisions and player commands are tracked separately. Repeated unnecessary stop/start reversals reduce secondary command efficiency; modeled safety interventions are exempt.
- Pause & Plan permits inspection and priority assignment. Ground debug has seven layers for graph, routes, nodes, edges, zones, dependencies and owners, with selected wait reason and duration.

## Verification

`npm test`: **52 passed**, comprising the original 23 simulation checks, 19 surface checks and 10 gameplay checks. Cases include perpendicular, opposing and three-aircraft traffic; runway-exit priority; artificial wait cycles; cancellation/cleanup; active-runway crossing protection; non-passing chains with distant alternate roads; adjacent A3/D14 gate turns; and rejection of a blocked recovery turn. Full arrival/departure lifecycles on both runways in both directions remain covered.

The original opposing N-route reproduction now finishes with both aircraft at their route destinations and `deadlocked: false`. Standard mode receives one explicit controller priority decision. The baseline failure report remains preserved separately.

Each final stress run injects a seeded two-hour traffic schedule, then stops new traffic and drains all accepted flights. A test controller uses real validated clearances, compatible gate alternatives and public ground-priority decisions. It never overrides unsafe clearances or changes movement. Actual aircraft rectangles are checked for overlap during the run.

| Mode | Departures | Arrivals | Priority decisions | Drain after the two-hour schedule | Remaining / overlaps |
| --- | ---: | ---: | ---: | ---: | --- |
| Assisted | 24 | 26 | 0 | 42:23 | 0 / 0 |
| Standard | 38 | 32 | 18 | 45:45 | 0 / 0 |
| Advanced | 41 | 35 | 35 | 59:55 | 0 / 0 |
| Controller / Hardcore | 35 | 38 | 25 | 50:22 | 0 / 0 |

All **269 flights** complete. The final schedule runs contain no cyclic waits; separate deterministic cycle fixtures exercise actual recovery. Long legitimate runway queues remain possible and are not mistaken for an internal deadlock. The test does not promise zero delay or perfect sequencing by its deliberately simple controller.

Four production-browser workflows pass: bilingual launch/cameras/immersion/time controls; the complete guided lifecycle; unsafe-clearance, gates, weather and summary; and request/operations/planning/priority/route-choice controls. The operations workflow is also rechecked after the final route congestion metadata update. Native visual checks cover all eight aircraft, quality switching, reset resources and fixed day/night/weather views. Machine-readable evidence is under `gameplay-qa/`, `test-results/` and `visual-qa/gameplay-final/`.

All **13 locked sources** retain their baseline hashes. A paired native Intel UHD 730 test uses identical fourteen-aircraft snapshots, routes, camera, 1440×900 viewport, Medium quality, four-sample antialiasing and shadows. Two rounds of 180 sampled frames produce these average medians:

| Simulation speed | Graphics release | Gameplay update | Frame-time change |
| --- | ---: | ---: | ---: |
| Paused | 19.00 ms | 18.95 ms | −0.3% |
| 1× | 19.00 ms | 19.30 ms | +1.6% |
| 8× | 18.85 ms | 18.85 ms | 0.0% |

This fixture shows no material median FPS regression. Simulation CPU cost increases with reservations, especially at 8×; detailed CPU and frame percentiles are retained in `gameplay-qa/performance.json`. These are short local samples on one GPU and do not establish performance on every machine, quality setting or view.

## Limits and delivery

The existing reduced RCTP graph has runway entrances but no through active-runway crossing route. The generic crossing system is tested; no fictional crossing or scenery alteration was added. Taxi, wake, occupancy and gate compatibility remain game approximations. Full surveyed stand dependencies, jet-blast modeling and certified procedures remain outside this pass. Optional severe collision presentation is omitted; physical prevention remains active.

`Taoyuan-Tower-gameplay-update.zip` is the separate delivery. Extract it and run `Start-ATC.cmd` with Node installed. The original v0.1 and graphics-update archives remain preserved. README, architecture, realism notes, tests and final QA evidence accompany the playable build.
