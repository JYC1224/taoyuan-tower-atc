# Terminal building / floor allocation pass — 2026-11-18

This pass prioritises large passenger spaces, floor relationships, headroom and
circulation. Shop inventories and brand signs are not the basis for the plan.
References were inspected in the Codex in-app browser; no desktop Chrome was
used. Reference photographs are not distributed with the game.

## Evidence actually inspected

| Source | Views inspected | What it supports / limits |
| --- | --- | --- |
| [Airport indoor map](https://map.taoyuan-airport.com/) | T2 1F, 2F, 3F and 4F, terminal-aligned, 50 m / 20 m scale; T1 3F facility labels | Long-axis layout of belts 1–6; perpendicular 7/8 pair; landside public arrivals separate from reclaim; west-side upper atrium and east-side lounge/service zone. Rectangular boundaries are fitted to the map, not surveyed. The later T1 session showed facility labels but its floor-outline tiles did not load; it is not used as a measured T1 plan. |
| [JAL TPE guide](https://www.jal.co.jp/jp/en/inter/airport/tpe/info/) | Full arrival diagram: 2F and 1F; full departure diagram: 3F and 4F; explanatory text, updated June 2026 | Arrival passport control is 2F, then descent to 1F baggage/customs. Check-in is 3F. The departure diagram explicitly marks check-in, security, then immigration; the page's numbered prose conflicts about the final two, so the diagram governs this spatial fit. It is a schematic, not a structural drawing. |
| [Public pickup photograph guide](https://www.hs-car.com/news_data.php?id=46) | T1: `2020taoyuanairport (5)1.jpg`, `(89) (1).jpg`, `(94) (1).jpg`. T2: `(92) (1).jpg`, `(27) (1).jpg`, `(93) (1).jpg`; also `(90) (1).jpg` | T1 high white raked/louvered ceiling, raked pale piers, gray stone, service-wall/clerestory rhythm. T2 tall public hall, silver round columns, pale triangular ceiling, upper gallery/clock, escalators and low illuminated pickup barriers. `(90)` is an annotated version of `(92)`, not an independent angle. The page says it was rechecked in 2025, but image filenames identify 2020: no claim they are 2025 photographs. |
| [Taoyuan City expansion opening record](https://www.tycg.gov.tw/NewsPage_Content.aspx?n=10&s=637074) | 2017-09-27 article; `S__40108366@710x470.jpg` and `S__40108370@710x470.jpg` | Independent close/oblique departure-counter angles: black header frames, pale curved counter shells, polished stone, deep roof space frame and upper gallery. The south expansion was opened on 3F; these are historical photographs, not evidence of every current tenant. |
| [CECI T2 engineering project](https://www.eng.ceci.com.tw/terminal2) | Project description and coach/forecourt canopy photograph `t2.jpg` | Original four-storey RC terminal, two basement levels and space frame. The 308,000 m² project area includes terminal works; it is not a dimensioned main-hall footprint. The photograph is of the external road canopy, not the check-in interior. Current upper visitor expansions are identified separately by the airport map. |
| [T1 architect's regeneration project](https://www.archdaily.com/771071/regeneration-of-taoyuan-international-airport-terminal-1-norihiko-dan-and-associates) | Public article's plan/section and previously inspected hall photographs | Raked/catenary roof and occupied central upper deck. The gallery's original-size section became account-gated; that original was not retrieved or used as a measured drawing. The published renovation area is not the area of the whole terminal. |

## Section and footprint decisions

The map confirms floor **use** more strongly than physical dimensions. The
following are world elevations in the authored scene, in metres, **not verified
real-airport floor heights**:

| Terminal | Finished floors | Consequence in the model |
| --- | --- | --- |
| T1 | B1 −5.51; 1F 0; 2F 5.44; 3F 10.94; 4F 14.64 | Keep the existing check-in section and A-wing interface. The arrivals ceiling rises from 7.4 to 10.25 above its local floor and stays below the occupied 3F slab. |
| T2 | B2 −10.70; B1 −5.20; 1F 0.36; 2F 6.25; 3F 12.35; 4F 18.55; 5F 23.45 | Reclaim is below 2F; public arrivals open through 2F to a ceiling below 3F. Check-in opens through the west-side 4F/5F atrium to the retained high roof. |

- The old T2 210 × 290 m scene rectangle enclosed an existing mapped service
  road on its west side. The occupied cross-axis body is now a **150 m scene
  fit**, with north/south expansion depth retained at 290 m. The original roof
  and canopy envelope stays separate. The aligned map suggests a shorter main
  core plus end extensions; this change does **not** claim a surveyed 150 × 290 m
  real building. Road-point clearance and interior furniture fit are tested.
- Furniture is repositioned individually at its existing size. No nonuniform
  scale is applied to a complete building, its desks, doors or artwork.
- T2 public arrivals occupy the west side. The reclaim zone has six transverse
  loops along the long axis, and the longer 7/8 pair along the east edge.
  Customs lies between reclaim and the public hall. Equipment, exact queue
  counts and red/green exit fit-out are reasonable interpretations.
- T2 2F now includes two arrival passport-control banks on the restricted east
  side, plus dedicated north/south stairs to reclaim. Public escalators and
  the centre gallery bridge are separate from this route.
- T2 3F counter banks sit under the west-side atrium. Security, departure
  passport control and the airside retail passage occupy successive bands to
  the east, without equipment intersecting the counters. Existing counter
  models and fine furniture are retained.
- T2 4F lounges occupy the east zone rather than both sides of a symmetric
  centre void. Dining is fitted to the south gallery. Public greenery and the
  water feature sit on solid floor, not inside the atrium. Their positions are
  scene fits, not claimed surveyed artwork locations.
- A previously unsupported spiral stair, duplicate proxy arrival sculptures
  and decorative ribbons occupying the reclaim belts were removed. The more
  detailed existing public-art models remain, rigidly moved into their proper
  public or reclaim zone. No source artwork photograph is bundled.
- Floor-edge guards now follow the actual near/far edges of the cutouts. The
  old formula incorrectly put some guards in the centre of an opening.
  Escalator flight openings are cut in the upper slabs; thin remaining strips
  are retained instead of accidentally discarded by a 2 m slab-size cutoff.

## Verification and remaining uncertainty

`terminalBuildingLayout.ts` supplies shared floor elevations, body bounds,
arrival voids, belt footprints, customs bays, processing bands and core
locations. Rendering and walking collision consume these same data. Added
tests cover floor use, headroom, belt orientation, aisles, processing overlap,
upper-floor furniture, landing/void alignment and road clearance. The existing
all-viewpoint test checks every preset after relocation.

The original game was run before changes; T1 arrivals, T2 arrivals and T2
departures baseline screenshots are in `tmp/terminal-building-20261118-qa/`.
Final runtime build: `index-CbR_qDD9.js` (`npm run build`: TypeScript and Vite
passed; the existing large-chunk advisory remains). Relevant verification:

- 10 building/floor allocation tests, 6 existing A-wing layout tests, all
  viewpoint/outdoor-wall tests, and 9 lighting/bridge/texture-cache/static-batch
  regressions passed. The 5 exploration lifecycle tests also passed, including
  an autonomous one-hour arrival/departure watch without collisions.
- High quality was explicitly checked in the in-app settings. Daytime views
  covered both main halls, the T2 arrival gallery, arrival immigration,
  baggage, customs, departure security/passport control, 4F gallery/dining,
  lounge, curb canopy and existing A7. A restarted 22:00 watch covered T1/T2
  arrivals; console warning/error logs were empty.
- Final-build T1/T2 arrivals and the revised south dining density were checked
  again. The dining module keeps a 4 m main aisle and usable secondary aisles;
  its unchanged instanced furniture now fits the room at human spacing.
- New fixed arrival-hall reflections use cached procedural cards matching the
  authored architecture. They do not add six scene renders on hall entry.
  Existing check-in probes remain cached, and shared floor finishes are reset
  to their fallback textures before an owned probe is disposed on exit.
- Ceiling blades, coffers, chairs, column cladding and repeated joinery are
  instanced. The quality preset, antialiasing, shadow resolution and aircraft
  assets were not reduced. No hardware FPS comparison on an A380 or integrated
  GPU was captured; this pass does not claim a measured performance gain.

The baseline and post-change JPEGs, plus `verification.json`, are in
`tmp/terminal-building-20261118-qa/`. Night and broader geometry views preceded
the final reflection-card/dining-density adjustment; the final arrivals and
food JPEGs were refreshed against the final build.

Public sources establish floor uses and major passenger connections. Storey
heights, structural grids, processing-room boundaries and many finishes still
use scene estimates. The earlier T1 A-wing research remains in
`TERMINAL_PASSENGER_REFERENCE_20261118.md`.

## Follow-up on Terminal 2 arrivals

- The terminal-aligned [airport map](https://map.taoyuan-airport.com/) and [JAL arrival diagram](https://www.jal.co.jp/jp/en/inter/airport/tpe/info/) show the central exit, north–south belt sequence and apron-side 7 A/B and 8 A/B. The six main belts use a roughly 19 m pitch estimated from the map scale. Four escalator landings link the processing level to reclaim. The bay shapes and clearances are scene fits.
- The [pickup guide's frontal and oblique photographs](https://www.hs-car.com/news_data.php?id=46) and the [2023 arrivals photograph](https://commons.wikimedia.org/wiki/File:Tpe_T2_Arrivals.jpg) support the continuous pickup rail, visible clerestory, paired meeting signs, red clock, recessed glazing and granite. The public gallery sits along the west edge with separate stair openings, opening the view over the pickup rail. Simulated minutes update the clock and the floor projects the illuminated panels with a local shader.
- The [airport public-art gallery](https://www.taoyuan-airport.com/explorethefun/en.html) places the existing sculpture group in the 1F arrivals hall. Its photograph shows the north meeting-point column beside the group. The modeled passenger route continues on foot from 2F immigration via the reclaim escalators, then through customs and either curb door around the pickup rail.

## Terminal 2 departure check-in

- The aligned [airport 3F map](https://map.taoyuan-airport.com/) shows eight transverse islands in the central hall, from 6/7 through 20/21. Counters 1–5 and 22–26 sit in the end halls. The modeled main islands have a roughly 25–29 m pitch estimated from the map scale. The separate end banks turn along the hall, and the public cross-aisles and staffed queue entrances are walkable.
- The [central hall photograph](https://commons.wikimedia.org/wiki/File:Taiwan_Taoyuan_International_Airport_Terminal_2_Check-in_Hall_20200815.jpg) shows the blue-violet counter numbers, dark steel frames, desks with exposed bag scales, and groups of freestanding kiosks. The [city's south expansion photographs](https://www.tycg.gov.tw/NewsPage_Content.aspx?n=10&s=637074) show the paired metal display frames and slim red trim near counter 20.
- The airport-supplied photographs and counter list in the [2024 guide](https://www.xinmedia.com/article/301890) place dedicated self bag drop at 10/11 and 16/17. The modeled machines have pale curved housings, dark shutters and low loading belts. [EVA Air's service page](https://www.evaair.com/zh-tw/fly-prepare/at-the-airport/check-in/self-service-baggage-drop/) currently flags 16 as temporarily closed, so those machines are shown parked. The kiosks follow the separate [airport self check-in service](https://www.taoyuan-airport.com/selfcheckin). Individual station counts, exact equipment dimensions and kiosk spacing are scene estimates.

## Terminal 2 D concourse and indoor lighting

- The [airport 3F map](https://map.taoyuan-airport.com/) establishes the long north departure wing and gate order. The [D6 official gallery](https://www.taoyuan-airport.com/explorethefun/) shows the low paneled waiting-room ceiling and the division between seating and a polished path. The [recent north-wing photo essay](https://blog.jesselin.com/archives/172838/taoyuan-airport-toto-restroom-d-zone-dining/) supplies the two views of the D6/D7 travelator and skylight, plus front and window-side views of the D10 rest area. The model follows those visible features with open walkway ends, a shallow service and seating band, and a roof well above the D6/D7 pocket. Section dimensions and fit-out widths are scene estimates. The D concourse uses the existing boarding-bridge elevation.
- The floor finishes use a shared diffuse indoor environment and separate polished stone, satin flooring and carpet responses. This supersedes the hall cubemap captures described above. The D spine and T2 check-in floor calculate highlights from their modeled ceiling fixtures. The T2 arrivals pickup signs retain a short, softly blurred local return. Sun shadows use a tighter indoor camera range, with separate low-cost contact shadows at fixed furniture and rail feet for artificial-light conditions.

## Terminal 1 B and Terminal 2 C passenger connection

- The [airport indoor map](https://map.taoyuan-airport.com/) places B9 and C1 at adjoining ends of the 3F departure route and shows the moving walkways and nearby vertical circulation. A [passenger walkthrough](https://blog.jesselin.com/archives/29671/taoyuan-airport-travel-between-tpe-t1-and-t2/) confirms the airside B–C route. The modeled landing and rail positions use the map scale as a guide. The common deck elevation is fitted to the scene and the existing aircraft bridge anchors remain at their original elevations. Both staircases and the cross-terminal passage are usable on foot.
- The [airport's passenger area guide](https://www.taoyuan-airport.com/explorethefun/), the [2024 gate photographs](https://www.xinmedia.com/article/301731), and the [B1–B3 operator video](https://www.youtube.com/watch?v=L0VU-rvl8Ls) document the shared room. Its model follows the cream curved core, blue-grey floor, seating rows, high apron glazing and repeated louvered light bands.
- The [C1 design team's photographs](https://www.jeancard.com/NewsDetail/NewsDetail/252) and the C1 view in the 2024 guide document its timber ceiling, light cross-ribs, planting, and the transition from timber to stone. The model follows the fit-out and opening proportions. Stair, register and furnishing dimensions are scene estimates from the public references.

## Continuous passenger circulation

- The north and south passenger openings at T1 and the airside C/D branches at T2 follow the [official 3F indoor maps](https://map.taoyuan-airport.com/). Rendering opens the matching glass, frames and floor landings. The short C ramp and covered D stair reconcile the elevations of the existing gate halls with the terminal floor. Their geometry is a scene fit. The existing B9–C1 link remains bidirectional.
- T2 public arrivals retain their own glazed gallery and stairs, separate from the restricted passport-to-reclaim route shown in [JAL's arrival diagrams](https://www.jal.co.jp/jp/en/inter/airport/tpe/info/). The [pickup photo series](https://www.hs-car.com/news_data.php?id=46) supplied separate views of the glazed upper gallery, paired escalators and blue direction signs. Scene dimensions and checkpoint furniture remain approximate.
- Movement from the location selector continues across joined floors. Landing widths, stair pitch, walls and rail openings share layout data with the renderer. Escalator treads are static. Elevators, service rooms and the complete landside MRT/Skytrain connections remain outside the walkable network.
