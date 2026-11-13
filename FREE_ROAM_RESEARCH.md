# Second-terminal exploration: initial feasibility and reference notes

The current **Explore / 機場漫遊** mode offers first-person sightseeing while AI controllers operate the simulation. It now includes selectable first-floor public areas and gate concourses in Terminals 1 and 2, Terminal 2 levels 2–5, Terminal 3 north concourse and the tower. Floor changes and travel between disconnected scene areas use the location selector. Walking continuously between the terminal and tower and starting a shift at a workstation remain future work.

## Initial findings (historical baseline)

- `src/render/AirportScene.ts` already supports first-person movement in the tower cab, bounded to the cab and with limited furniture collision. Its free camera is a flying camera, not a pedestrian controller.
- `src/render/airportEnvironment.ts` renders the terminal as an exterior mass, concourses, roof and jetbridges. It does not contain navigable terminal floors, openings or an interior collision model. Much of its static geometry is merged, so separately hiding or opening the terminal shell requires a deliberate scene-organization change.
- `src/main.ts` starts an ATC scenario and tower introduction together. Exploration requires a separate pre-shift state and an explicit transition to the existing shift, including time and input handling.
- The present terminal, tower and their relative positions are already documented as approximations. Moving inside them does not by itself make their dimensions or route faithful to the real airport.

## Public reference anchors

| Confirmed point | Reference | Limit |
| --- | --- | --- |
| Terminal 2 has a 3F departure hall, including check-in counters 13/14. Its 1F arrival hall has a south meeting point. | [Taoyuan Airport visitor information](https://www.taoyuan-airport.com/fun_info/En-metro.html) | A visitor guide establishes landmarks, not detailed dimensions or the full current interior. |
| Terminal 2's 3F departure hall includes a service point in front of check-in counter 19. | [National Immigration Agency service location](https://www.immigration.gov.tw/5382/5385/7445/7889/7892/50767/cp_news) | A location description does not establish the complete counter layout. |
| Official visitor information describes access from the 3F departure hall to the 5F north and south observation decks. | [Taoyuan Airport visitor information](https://www.taoyuan-airport.com/fun_info/En-metro.html) | Exact elevator positions, geometry and present furnishing need separate corroboration. |
| The current airport tower is 62 m high, 65 m including the antenna. The public official site includes a control-room panorama. | [ANWS tower project](https://www.anws.gov.tw/OpenInformation/ApproachTower/Plan.htm), [ANWS tower automation](https://www.anws.gov.tw/OpenInformation/ApproachTower/Tower.htm) | The public sources do not provide a complete measured interior or a confirmed pedestrian route from the terminal. |

The airport's [interactive map](https://www.taoyuan-airport.com/map) was inspected in Codex's in-app browser, alongside the airport's official [Explore the Fun gallery](https://www.taoyuan-airport.com/explorethefun/). Those sources provide public floor wayfinding and real interior photographs, but not complete construction drawings. Public plans and dated photos support a more recognizable interpretation; they cannot establish that every interior object and restricted-area route is identical to the present airport.

## Current implementation and references (2026-11-13)

- Terminal 1 and Terminal 2 now have walkable interior floors with baggage claim, customs, immigration, transfer, check-in, security, retail, dining and waiting areas. Level labels follow the official map/visitor information; the modeled dimensions and equipment positions remain estimates.
- A/B and C/D gate concourses now have gate-specific theme art, seating and sculptural details based on the airport gallery's documented lounge themes. Repeated theme groups share textures to keep the added material cost bounded.
- Terminal 2 now has a high atrium structure, steel roof trusses, curved glass roof panels, pendant lights, a SolarSonic aircraft-and-lens interpretation, a semicircular stair, palms and a water feature, plus south-side Taiwan Temple Avenue and north/south observation decks. These features are placed from public photographs and descriptions, not a measured BIM model.
- T1's 1F departure lobby now reads as a tall open hall with six long parallel check-in islands, twelve numbered service zones, perimeter-raked piers, restrained planters and a folded bright ceiling with linear lights; the upper decks are cut back around the public-hall void. The 1F placement follows the airport visitor guide's location near check-in counter 10, the broad organization in the published renovation plan, the official counter-use guide and photographs. Precise dimensions and the floor cutout remain approximate.
- T2's 3F check-in deck remains continuous below the counters, while the open void is concentrated above the hall through the 4F/5F levels. The 4F storefront rows stay on the solid deck, and café seating follows the two solid side galleries around the atrium rather than floating across the open centre. T2's structural supports remain in the long side bays. Its counters are assembled as dark baggage-belt islands with blue number markers 1–26, polished muted green-grey flooring and human-scale overhead signs.
- T2's SolarSonic interpretation follows the official description and gallery image of an aircraft-like form, curved glass frame, suspended cables and translucent iridescent lenses; it is positioned at 3F raised-gallery height and no longer dominates the check-in viewpoint. The suspended flower-form hall lights now connect to the roof frame with full-length cables. These are scene-authored approximations; no proprietary photograph is included.
- The T2 hall shell is set to a 34 m clear-volume approximation based on the airport's public feature article and photos. This is a scene proportion, not a verified architectural measurement. The upper atrium opening, support spacing and fixture positions remain procedural interpretations.
- The airport's [Terminal 2 feature article](https://www.taoyuan-airport.com/api/uploads/files/20230724/66d9333a-ae78-4b18-b85d-17309211ef0b/19/) describes the curtain glass, steel trusses, high public lobby, tropical planting, globe fountain, semicircular stair and C2 transparent bridge. The [official visitor guide](https://web.taoyuan-airport.com/fun_info/En-metro.html) supports the Terminal 2 level assignments and 5F observation decks.
- Quick-move points cover 18 destinations, including the T1/T2 public areas and gate rows. The camera stays on the selected floor and uses approximate obstacle rectangles; it does not yet represent every wall, queue rail, escalator, lift, shop interior or restricted airside door.

The [official floor map](https://www.taoyuan-airport.com/map/) and [interior photo gallery](https://www.taoyuan-airport.com/explorethefun/) were reviewed on 2026-11-13. No proprietary photographs or design files are bundled; the game models original procedural interpretations of those public references.

## Implementation sequence

1. Refine floor-by-floor layouts and collision against additional dated plans and photographs; the present interiors are a broad public-area pass, not a construction drawing.
2. Add a pedestrian camera and interaction system with collision, accessible controls, and clear behavior for doors, stairs and elevators. Prevent falling through floors and walking through walls.
3. Add a documented, plausible connection to the tower only when reliable route evidence is available; otherwise make the transition explicitly approximate. Reuse the existing cab, adding an elevator/entry transition rather than inventing a measured restricted interior.
4. Add the exploration state before a shift and an interaction at the tower workstation that starts the existing scenario. Check pause, scenario settings, return-to-menu behavior and existing camera modes.
5. Continue expanding furnishings and photograph-specific details only after source and visual review. Profile pedestrian views as well as tower and aircraft views.

## Open accuracy constraints

This is a substantial scene, interaction and reference-gathering project. Full one-to-one fidelity cannot be verified without complete current architectural plans, measurements and imagery, particularly for operational or restricted areas. Do not describe an estimated layout as an exact recreation.

- Follow-up: T2's roof adds fine batched diagonal members to the principal space-frame, while the 4F dining and atrium now have separate walkthrough viewpoints. The 4F dining view is aimed at the furnished side gallery; the atrium view frames the central opening.

- T2 4F south food-court follow-up (2026-11-13): a recent public visitor photo shows suspended white/yellow hexagonal forms, pale hex tile and grouped dining tables. The photo is a public social post, not an airport construction or facilities document, so it is only a visual cue; exact date, layout and finishes remain unverified. The procedural interpretation now uses a near-half-metre hex floor pattern, aisle-spaced four-seat table groups with visible pedestals, a warm-white/gold suspended canopy and a distinct south service frontage. The 4F viewpoint begins at the dining entrance so tables and ceiling feature share the frame. The base T1/T2 ceiling modules are scaled to read closer to full-size building panels. No reference photo or branded shop artwork is bundled.
