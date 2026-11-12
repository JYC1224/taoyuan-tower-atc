# Second-terminal exploration: initial feasibility and reference notes

The requested experience starts in Taoyuan Airport Terminal 2, allows walking through the terminal and reaching the control tower, and starts the existing ATC shift from a workstation. The existing airport and ATC systems are the starting point; this document does not claim that the mode is implemented.

## Findings from the current project

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

The airport's [interactive map](https://www.taoyuan-airport.com/map) may provide further public wayfinding information; its rendered contents were not available to the text-based research tool and should be inspected separately. Public floor plans, dated photos and videos can support a high-fidelity interpretation, but they cannot establish that every interior object and restricted-area route is identical to the present airport. Record the date and source for each feature, and distinguish measured locations from estimates.

## Implementation sequence

1. Verify Terminal 2's publicly accessible 3F departure hall against dated floor plans and imagery. Build one bounded, walkable hall with floor, ceiling, entrances, counters, signage and collision. Keep exterior geometry compatible with the existing airport view.
2. Add a pedestrian camera and interaction system with collision, accessible controls, and clear behavior for doors, stairs and elevators. Prevent falling through floors and walking through walls.
3. Add a documented, plausible connection to the tower only when reliable route evidence is available; otherwise make the transition explicitly approximate. Reuse the existing cab, adding an elevator/entry transition rather than inventing a measured restricted interior.
4. Add the exploration state before a shift and an interaction at the tower workstation that starts the existing scenario. Check pause, scenario settings, return-to-menu behavior and existing camera modes.
5. Expand to additional floors, concourses and furnishings only after source and visual review. Profile pedestrian views as well as tower and aircraft views.

## Open accuracy constraints

This is a substantial scene, interaction and reference-gathering project. Full one-to-one fidelity cannot be verified without complete current architectural plans, measurements and imagery, particularly for operational or restricted areas. Do not describe an estimated layout as an exact recreation.
