# Visual realism update — 2026-10-28

This records `Taoyuan-Tower-realism-update.zip` before the subsequent user-requested real-world livery extension. Read LIVERY_UPDATE.md for the current brand artwork and paint layouts; the historical graphics screenshots and performance numbers below are unchanged evidence from the realism pass.

This pass extends the existing Three.js renderer in place. Aircraft, pavement, vegetation, sky/reflections and small airport details have greater visual depth. All **18 gameplay, interface, audio and airport/fleet data sources** retain their task-start SHA-256 hashes. Ground reservations, sequencing, difficulty, command behavior, cameras and the airport layout remain the existing systems.

## Visible changes

- **Aircraft:** original lofted cambered main wings and horizontal tails, swept taper and family tips, articulated trailing flaps, coherent flap-track fairings, curved fan blades/spinners, calibrated nacelles, wing-root fairings and small antennas/probes. Cockpit/nose artwork, passenger windows, doors, paint roughness/normal detail and wing panel artwork are revised. Navigation lights follow the new wing geometry. A planform-shaped contact shadow replaces the round blob.
- **Ground:** local scanned concrete/asphalt color, normal and roughness maps; physical-scale surface texture and restrained slab/patch seams. Periodic multi-scale turf replaces repeated circular grass stains. The existing markings, route geometry and runway coordinates remain in place.
- **Lighting and sky:** a locally bundled HDR supplies reflections and soft photographic cloud detail. Scenario time/weather still control sky color, cloud coverage, visibility, rain and wetness. Aircraft paint uses clearcoat; material reflections are selective on Medium/Low, while High adds full scene environment lighting.
- **Airport:** original facade pane/interior textures, glass and mullions on jet bridges, revised door-floor alignment, subtle stand stains, service cabinets/bollards outside movement lanes, generic T2 roof equipment and a cab acoustic ceiling/light strips. Clearer tower glass preserves the existing views.
- **Rendering budget:** fine aircraft details are limited to 130/260/650 m on Low/Medium/High; expensive ground normal reconstruction to 0/250/550 m. Static details remain batched. Existing MSAA, shadows and High supersampling/edge filtering are retained.

The result remains a procedural airport game. Aircraft engineering geometry, exact airline logos, surveyed architecture, volumetric clouds and real-time planar reflections are outside this pass. The HDR is a generic sky reference, not RCTP photography or observed local weather. No engine migration was needed.

## Assets and provenance

**Powered by Poly Haven.** Seven image files total **7,167,584 bytes**: Concrete Floor Worn 001 and Asphalt 01 at 1k (diffuse/OpenGL normal/roughness), plus Kloppenheim 06 (Pure Sky) at 2k HDR. The provider publishes these as [CC0](https://polyhaven.com/license), including commercial use and redistribution. Original authors, source URLs, byte counts and SHA-256 digests are in `public/assets/realism/manifest.json`; the local `LICENSE.txt` accompanies the built game. Official size/MD5 metadata was checked when downloading. Other new geometry and artwork are project-authored.

The renderer loads all images from the local game server. An isolated browser test with all non-loopback requests blocked loaded all seven images, started a watch, opened Operations and exercised the comparison viewer with **zero external requests and zero errors**. See `realism-qa/offline-smoke.json` and ASSET_PROVENANCE.md.

## Verification

| Check | Result / evidence |
| --- | --- |
| TypeScript and production build | Passed; `npm run build` |
| Simulation tests | **52 passed**, zero failures; `realism-qa/unit-results.txt` |
| Production UI workflows | **4 passed** in 37.8 s with native GPU Chrome; `realism-qa/browser-results.json` |
| Non-rendering source guard | **18 unchanged**; `realism-qa/logic-lock.json` |
| Downloaded source images | Seven verified SHA-256 digests; `scripts/verify-realism-assets.mjs` |
| Graphics switching | Low/Medium/High, including High postprocessing and shadow settings, passed |
| Fleet geometry | Eight types rendered with finite geometry; both livery sides sampled |
| Reset resource check | Five identical samples: **856 geometries / 103 textures**, no upward growth |
| Console / page / GPU diagnostics | Empty error arrays in fleet regression and both final capture sets |
| Fixed visual fixtures | **15 before + 15 Medium + 15 High**, same seed/camera/time/weather; HUD hidden only for art review |

The production UI suite covers all eight cameras, bilingual interface, workstation raycast/immersion, pause/time controls, the complete departure and arrival tutorial through actual command buttons, stand/warning/weather/summary behavior, Requests/Operations, four difficulty choices, priority decisions, route choices and debug layers. Earlier two-hour surface stress results are preserved in `gameplay-qa/`; they are historical gameplay-release evidence, not new rendering benchmarks. Unchanged simulation sources and the current 52-test run protect that behavior here.

The machine-readable quality/fleet/reset report is `visual-qa/realism-after/visual-regression.json`. The paired baseline build and source snapshot remain under `realism-qa/baseline-build/` and `baseline-source/`.

## Measured rendering cost

Native Chrome on **Intel UHD Graphics 730**, 1440 × 900, DPR 1, Medium, 4× MSAA, shadows on. An identical 14-aircraft snapshot, routes, weather and tower-seat camera are used for both builds. Each condition has 45 warm-up frames and 180 measured frames, in two rounds with reversed build order. The figures average the two median frame times:

| Speed | Previous gameplay build | Realism build | Frame-time change |
| --- | ---: | ---: | ---: |
| Paused | 18.65 ms | 21.45 ms | +15.0% |
| 1× | 18.70 ms | 21.40 ms | +14.4% |
| 8× | 18.60 ms | 20.50 ms | +10.2% |

At 1× this is approximately **53.5 → 46.7 FPS**. Additional surface samples, geometry and paint lighting have a measurable cost. The first all-material environment-lighting version cost about 34%; selective reflections and distance detail reduced that cost. This pass does **not** claim unchanged FPS. Raw samples and percentiles are in `realism-qa/performance-final.json`; earlier optimization reports are diagnostic history.

Separate paused High screenshots sample about **26–47 ms** across the fifteen views on this GPU. Those figures are medians of twelve RAF intervals, useful for checking view cost but not a sustained gameplay benchmark. High renders internally at 1944 × 1215 and enables full environment lighting. Medium remains the default balance; High needs more GPU headroom. A single GPU and short samples do not characterize all devices or long shifts.

## Compare and run

Open `dist/realism-review/index.html` directly, or `/realism-review/index.html` through the local launcher. The viewer has fifteen views, a draggable before/after divider, Medium/High selection and the separate paired performance results. The PNGs are unretouched game output. Some close-up fixtures deliberately stage aircraft at a fixed graph location to compare models; they are not demonstrations of operational taxi routing.

The separate **Taoyuan-Tower-realism-update.zip** contains the ready-built local game, launcher, source, tests, notices, comparison and selected QA evidence. Extract it and run `Start-ATC.cmd` with Node.js available. The v0.1, visual-update and gameplay-update ZIPs are retained.

To verify or regenerate with development dependencies installed:

```sh
npm test
node scripts/verify-realism-lock.mjs
node scripts/verify-realism-assets.mjs
npm run build
node scripts/build-realism-review.mjs
```

With a production server running, use `node scripts/visual-regression.mjs --realism` and `node scripts/realism-smoke.mjs`; `ATC_QA_URL` selects a local server. Set `ATC_NATIVE_GPU=1` for the full `npm run test:browser` suite. For the paired performance test, set `ATC_BASELINE_DIR=realism-qa/baseline-build/dist` and `ATC_PERFORMANCE_OUTPUT=realism-qa/performance-final.json` before running `node scripts/gameplay-performance.mjs`. Avoid concurrent GPU work while measuring.
