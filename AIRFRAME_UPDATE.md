# Aircraft airframe detail update — 2026-10-28

This pass extends the existing procedural aircraft meshes while preserving the current fleet dimensions, airline paint, simulator behavior and airport visuals.

## Added structure

- Engine pylons now have a swept, tapered side profile that joins the wing underside to each nacelle.
- Engine aft sections include an exhaust liner, turbine core and casing seam. Boeing 787 family profiles use a small serrated nacelle edge inspired by the real noise-reducing chevrons.
- The wing's inboard and mid-span trailing surfaces are modeled as a larger articulated flap; a separate flush outboard aileron completes the trailing-edge layout.
- Landing gear now has separate outer struts and exposed piston sections, diagonal support braces, bogie beams, tire sidewall rings, rim details and eight lug bolts on each wheel face.

Static airframe details are merged by material. Wheel lugs use instancing; animated flaps stay separate so their existing deployment behavior continues to work. These are original procedural approximations, not manufacturer CAD, certified geometry or a particular aircraft's complete engineering model. The added parts do not alter collision, mass, aerodynamics, taxi movement or flight performance.

## Files and validation

- `src/render/aircraftDetail.ts` contains the pylon, exhaust, control-surface and strut geometry helpers.
- `src/render/aircraft.ts` assembles those details with the current airline liveries and fleet profiles.
- `npm run build` performs the TypeScript check and updates `dist/`.

This pass does not include a new performance benchmark or a run of the automated gameplay/browser suites. Previous livery and gameplay verification remains recorded in `LIVERY_UPDATE.md` and `QA_REPORT.md`; it does not verify these new geometry changes.
