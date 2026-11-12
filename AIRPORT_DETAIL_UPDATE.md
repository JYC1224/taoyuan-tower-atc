# Aircraft and airport detail update — 2026-10-28

The aircraft retain their existing family dimensions and airline paint, with further original procedural detail:

- Revised cockpit glazing and window/door proportions, cabin door windows, lower-deck hatches and a port-side main cargo door on the 777F.
- Perforated intake lining, visible fan blades and a spinner spiral. The fan backing was moved behind the blades; the rear nozzle now has an enclosed liner and core, preventing the background showing through it.
- Additional wing panel lines, landing-gear doors, a tail APU outlet and a synchronized lower anti-collision beacon.

The apron now has **36** planned equipment areas with baggage carts, containers, ground power units, mobile stairs, cones and red/white parking boundaries. Gate signs share one texture atlas. Floodlight fittings were added to existing masts, and two representative windsocks turn downwind and droop with the scenario's wind speed. Equipment is instanced and its parking areas are placed using a conservative buffer around the existing graph segments; it is scenery, not an obstacle in the ground-traffic simulation. Actual locations, stand layouts, vehicle activity, engineering tolerances and the modeled apron topology are not surveyed or certified.

No new external model or texture is included. The new geometry and textures are project-authored; existing airline brand art and environment assets retain their previously documented rights. Reference material included [Taoyuan Airport's safety guidance](https://www.taoyuan-airport.com/api/imagecrop/fileid/826B1A9D-F2B3-ED11-BBDA-005056BD475F), [Airbus A350 material](https://www.airbus.com/en/products-services/commercial-aircraft/passenger-aircraft/a350-family) and [Boeing's 787 information](https://www.boeing.com/commercial/787/by-design).

## Verification and comparison

- TypeScript and the production build pass; all 18 non-rendering source hashes remain unchanged.
- **55 unit tests** pass, including new graph-clearance and wind-direction checks. **Four production-browser workflows** pass, including the full departure/arrival tutorial.
- All eight aircraft types and Low/Medium/High quality settings pass finite-geometry and browser/GPU-error checks. Five successive resets stay at **936 geometries / 105 textures**.
- Seven matching close-up views are available in `dist/detail-review/index.html`; their captures and reports are under `visual-qa/detail-before/`, `visual-qa/detail-after/` and `visual-qa/airframe-airport-regression/`.
- With external requests blocked, all 14 existing environment and airline image assets load locally, the game and Operations panel open, and both comparison pages work. The new comparison was checked on desktop and mobile; scenario wind changes turn both windsocks.
- A paired 14-aircraft tower fixture on Intel UHD 730 at 1440×900, Medium and 1× simulation measured **21.30 → 21.35 ms** median frame time (about 47 FPS for both). Each version was sampled twice with 180 frames after warm-up. The results describe this machine and view, not every hardware configuration; details are in `visual-qa/airframe-airport-performance.json`.
- The graph clearance test covers the straight segments and an approximate aircraft envelope. It is not proof of clearance for every smoothed turn or a representation of real airport ground equipment procedures.

Run `npm run build`, then `node scripts/build-livery-review.mjs` and `node scripts/build-detail-review.mjs` to recreate the local comparison pages from the saved captures.
