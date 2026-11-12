# Visual audit — 2026-09-07

Baseline is the existing playable v0.1, built with the installed Three.js 0.180 / Vite toolchain. No engine migration. The change boundary is `src/render/`; simulation, airport/fleet data, UI, audio and input commands are protected by `visual-qa/baseline-source-hashes.json`. Rendering source was copied to `visual-qa/baseline-render/` before editing.

## Reproduction and evidence

`npm test`: 23/23 passed. `npm run build`: passed. `node scripts/visual-qa.mjs before` captured twelve fixed 1440 × 900, DPR 1, Medium views in `visual-qa/before/`, with camera/seed/weather fixtures and renderer measurements in `metrics.json`. These are paused visual fixtures; lifecycle correctness is checked separately by the existing browser suite. Headless Chrome uses ANGLE SwiftShader, so these timings characterize software rendering, **not the user's hardware FPS**. The game FPS display caps its input delta and is unsuitable for this benchmark; measured RAF intervals are recorded instead.

## Confirmed causes / repair order

1. **Lighting and contact:** gate screenshot shows dark featureless glazing, cream flat ground and weak detached shadows. Metallic glass has no reflection environment. Sun shadow coverage spans 3.2 km, while normal bias is 1.2 metres: small objects lose contact. Use a low-cost sky reflection environment, balanced linear lighting, smaller stable shadow coverage and small bias.
2. **Ground intersections:** taxi paint uses raised boxes; concrete aprons sit above taxi lines. Overlapping apron boxes/segment joins share nearly identical depth. Establish explicit surface/paint heights and world-space texture coordinates so matching overlapped surfaces cannot shimmer from conflicting texture orientations.
3. **Aircraft:** eight longitudinal fuselage rings produce abrupt nose/tail cones. Flat rectangular livery panels intersect curved surfaces; belly is an overlapping half-shell. Cockpit uses two dark blobs. Replace with sampled smooth profiles and a single UV livery skin, recessed engine duct/fan geometry, fitted glazing, better wing tips and gear. Keep all simulation dimensions/identities unchanged.
4. **Anti-aliasing:** WebGL default framebuffer already has MSAA, but all existing presets render at 1× on DPR 1. Thin raised paint and bright polygon lights exaggerate jaggies. Improve actual scale on High, use filtered procedural maps and derivative-smoothed markings; keep the HTML UI outside image filtering.
5. **Buildings:** T1/T2 are nearly identical rectangular glass blocks; the source even constructs an unused roof mesh. Tower has a generic octagonal shaft. Distinguish the catenary T1 roof, flat layered T2, current partial T3 construction and the ANWS tower's asymmetric shell. Preserve cab bounds, workstation meshes, terminal/gate locations and routing.
6. **Weather/context:** repeated flattened cloud sprites, featureless patches, low-poly bright light spheres, rain rendered as dots. Add varied procedural cloud structure, neutral humid horizon, streak rain, wet-surface response, road/industrial/field texture and controlled night light pools. No invented named landmarks.
7. **Performance/resources:** aerial baseline has 863 draw calls. Aircraft submeshes, bridges and tower furnishings are unbatched. Material/texture retirement is incomplete. Batch static visual parts while retaining animated parts and hit-test IDs. Add distance detail culling and dispose owned resources. Avoid blanket heavy postprocessing.

## Acceptance

Repeat the exact twelve fixtures, inspect day/night/rain/cab and aircraft close views, run 23 simulation/data tests and the three UI/lifecycle browser tests. Verify protected source hashes unchanged. Record limitations rather than claiming survey-grade modelling, operationally exact liveries or hardware performance from a software renderer.

## Baseline pipeline inventory

| Item | Inspected v0.1 configuration |
| --- | --- |
| Renderer | Three.js 0.180 WebGLRenderer, WebGL 2, opaque canvas, high-performance preference |
| Antialiasing | Native default-framebuffer MSAA; actual context reported 4 samples |
| Resolution | Device ratio capped at Low 1 / Medium 1.5 / High 2; all were 1 on the DPR 1 test display |
| Shadows | PCFSoftShadowMap; Medium 2048, High 4096; fixed approximately 3200 × 2800 m coverage, normal bias 1.2 m |
| Colour | sRGB output and canvas colour textures; ACES Filmic tone mapping; initial exposure 1.05, changed by weather/daylight update |
| Texture filtering | CanvasTexture defaults with mipmapping; no broad oblique-pavement texture strategy; most ground was solid colour |
| Postprocessing | None |
| Lighting | Hemisphere + directional sun; no useful sky reflection environment for metal/glass |
| Depth | Perspective near 0.18 m, far 50,000 m, ordinary depth buffer |
| Baseline warnings | No blocking page/GPU errors in the baseline captures or functional browser checks |

## Findings confirmed during the repair

The far pavement stripes persisted after surface-height cleanup: ordinary depth precision over the original range was insufficient. A logarithmic depth buffer, shorter far plane and explicit shader depth chunks removed the severe stripes in the twelve inspection views. Tower ceiling caps also shared a bottom plane; separating that geometry removed the cab artifact. A second aircraft UV inspection caught reversed cockpit placement on one side; both sides now retain the nose windows and readable text.

A costly multisampled HDR postprocess experiment was discarded after poor integrated-GPU performance and driver shader warnings. The final High path uses native MSAA, bounded supersampling and a small edge filter on the already tone-mapped image. Final twelve-view Medium and High captures report no console/page/GPU errors. Thin distant ribs and lights can still alias; there is no claim of complete temporal shimmer elimination.

## Final comparison method

Hardware acceleration was available through Chrome's native ANGLE path on Intel UHD Graphics 730. The original v0.1 archive was extracted separately and its **15 source files matched all pre-edit hashes**, then its original build was served on a separate loopback port. `visual-qa/before-native/` and `visual-qa/after/` contain the comparable hardware Medium captures; `after-high/` records the sharper, more expensive preset. Initial SwiftShader captures remain in `before/` for audit history and are not mixed into the hardware performance table.

The final findings, resource counts, full performance table, limitations and reproduction commands are in [VISUAL_CHANGELOG.md](VISUAL_CHANGELOG.md). [The comparison viewer](visual-qa/review.html) displays all twelve required views with a draggable divider.
