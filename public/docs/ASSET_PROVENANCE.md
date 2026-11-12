# Asset provenance

Inventory updated on **2026-11-11**. Airport/aircraft meshes, UI artwork and sounds are produced locally from project code. The renderer uses ten local **Poly Haven CC0** surface/sky/façade files and seven separately documented **airline brand files**. The brand files are not all open licensed. No external aircraft models, recorded ATC transmissions or music are loaded. Official research charts downloaded into `tmp/pdfs` were used only to inspect coordinates and topology; they are not textures and should not be included in the deployed game.

This document records provenance. It does not grant third-party trademark rights or certify commercial clearance. A project-wide license for newly authored code/assets has not been selected.

| Asset | Source / implementation | License / rights status | Modification | Commercial-use status | Replacement requirement |
| --- | --- | --- | --- | --- | --- |
| Aircraft fuselage, cambered wings, tail, gear, nacelles and curved fan blades | Original procedural geometry in `src/render/aircraft.ts`, `aircraftSkin.ts` and `aircraftDetail.ts`; dimensional references listed in DATA_SOURCES.md | Project-authored; no external model license | Parametric variants per fleet family; original wing artwork, normal/roughness maps and details | Project distribution terms not yet selected | Replaceable model slot for high-detail, licensed meshes; currently simplified |
| EVA, China Airlines, STARLUX and Tigerair standard liveries | Real-world wordmark/emblem files in `public/assets/liveries/`; project-authored placement, color fields and tiger stripes in `src/render/liveries.ts` | Airline branding belongs to its rights holders. Commons labels some wordmarks public domain; the CAL emblem source is labeled Fair use; official STARLUX/Tigerair assets have no open license claimed | Local logo crops/compositing into existing UV maps; opposite fin faces use separate atlas charts | Integrated for the user's noncommercial game request; no blanket permission or airline endorsement asserted | Exact source URLs, labels, digests and limits in `public/assets/liveries/manifest.json` and `NOTICE.txt`; public/commercial distribution requires its own rights basis |
| Airport pavements and markings | Procedural meshes/canvas text in `airportEnvironment.ts` and `primitives.ts`; AIP factual references | Project-authored geometry informed by public factual data; official chart artwork not copied into runtime | Reduced chart-based topology; approximate shoulders/fillets/lead-ins | No blanket license assertion for government chart materials | Higher-fidelity survey data needs its own provenance and redistribution terms |
| Terminals, tower, cab and workstations | Original procedural geometry in `src/render/airportEnvironment.ts` | Project-authored interpretation, not a measured architectural model or proprietary software reproduction | Approximate forms and original furnishings/screens | Project distribution terms not yet selected | Optional licensed detailed building models; no external textures required |
| Tugs, buses, service vehicles, jet bridges and people | Original procedural scene geometry | Project-authored | Original abstractions | Project distribution terms not yet selected | Optional detailed asset replacement |
| Sky, pavement and terminal-façade PBR images | Poly Haven: Concrete Floor Worn 001, Asphalt 01, Aerial Asphalt 01, Kloppenheim 06 (Pure Sky), Rectangular Facade Tiles 02; thirteen files in `public/assets/realism/` | CC0-1.0; exact sources, authors and hashes in the local manifest and notice | Unmodified downloaded images; project shaders adjust scale/color/seams, weather and lighting | Provider explicitly permits commercial use and redistribution | No runtime asset-service dependency |
| Grass, facade/wing/aircraft artwork, rain, lighting, shadows | Three.js geometry/materials and original generated canvas textures | Three.js MIT plus project-authored code | Procedural; grass uses periodic multi-scale noise; sky blends the CC0 reference with scenario-controlled colors | Dependency notice required; project terms unresolved | None for the present prototype |
| Brand icon, controls, labels, English/Traditional Chinese UI | Inline SVG, CSS, canvas text and project strings | Project-authored; generic Unicode symbols use platform rendering | Original | Project distribution terms not yet selected | None; review human translations for production |
| Typography | Browser/system font stacks and `Arial` canvas fallback | Host-provided installed fonts; no font files distributed | Rendered as text at runtime | No bundled font license assertion | For bundled fonts, choose and record a distributable license |
| Airport ambience, rain, engine tone, radio/click cues | Web Audio oscillators and generated noise, `src/audio.ts` | Original synthesized audio; no sampled recordings | Synthesized at runtime | Project distribution terms not yet selected | Replaceable if authentic, licensed sound libraries are acquired |
| Runway/stand/taxiway facts and training flights | `src/data/airport.ts`, `src/data/schedule.ts`; DATA_SOURCES.md | Public research facts plus original synthetic training data; no licensed real timetable imported | Projection and reduced routing; deterministic scenario flight records | Not licensed as an official schedule/data feed | Import provider for future validated official or licensed schedules |

## Locally verified software dependencies

The earlier graphics repair added original procedural assets in `aircraftSkin.ts`, `surfaceDetail.ts`, `architectureDetail.ts`, `jetbridge.ts`, `atmosphere.ts` and `airfieldLights.ts`. The 2026-10-28 pass adds original geometry/artwork in `aircraftDetail.ts` and `sceneDetail.ts`, and local image loading in `realismAssets.ts`. Aircraft, wing, facade, turf, stains and cab textures remain generated from project code; the seven photographic reference files are the explicit exception. `HighQualityPass.ts` remains project-authored edge-filter integration using Three.js' MIT-licensed FullScreenQuad helper. Earlier visual references and their interpretation limits remain recorded in VISUAL_REFERENCES.md.

## Poly Haven CC0 files

**Powered by Poly Haven.** The provider's [license page](https://polyhaven.com/license) permits use, modification and redistribution, including commercial use. The individual image files are CC0; this does not change the project's overall licensing or airline branding rights.

| Asset | Authors and provider roles | Files |
| --- | --- | --- |
| [Concrete Floor Worn 001](https://polyhaven.com/a/concrete_floor_worn_001) | Dimitrios Savva — Photography; Rico Cilliers — Processing | 1k diffuse, OpenGL normal, roughness |
| [Asphalt 01](https://polyhaven.com/a/asphalt_01) | Charlotte Baglioni — Photography; Dario Barresi — Processing | 1k diffuse, OpenGL normal, roughness |
| [Kloppenheim 06 (Pure Sky)](https://polyhaven.com/a/kloppenheim_06_puresky) | Greg Zaal — Original; Jarod Guest — Sky edits | 2k Radiance HDR |
| [Rectangular Facade Tiles 02](https://polyhaven.com/a/rectangular_facade_tiles_02) | Charlotte Baglioni — Author | 1k diffuse, OpenGL normal, roughness; 2.1 m source width |

Downloads came from the provider's official `dl.polyhaven.org` URLs. Size and MD5 were checked against official API metadata at download; local SHA-256 and byte counts are retained in `public/assets/realism/manifest.json`. `node scripts/verify-realism-assets.mjs` verifies the shipped source files. The accompanying `LICENSE.txt` is included in the built game. No executables or third-party scripts were downloaded as assets. The sky photograph is a generic reference, not Taoyuan photography or current local weather.

## Real-world livery extension

The user requested real airline branding for a game that will not be sold. The source inventory explicitly distinguishes these brand files from the CC0 environment assets. `node scripts/verify-livery-assets.mjs` verifies all seven source hashes and checks that runtime SVG files have no scripts, embedded images or external references. Logos are decoded locally and baked into the existing aircraft maps; no asset host is contacted during gameplay.

EVA wordmark/identity, China Airlines wordmark and STARLUX wordmark come from the exact Commons source pages in the manifest, whose copyright labels are recorded rather than generalized into a project license. The STARLUX S/Polaris symbol and Tigerair Taiwan wordmark come from their official websites. The CAL plum blossom is the original embedded PNG extracted from the Chinese Wikipedia SVG source; its source-page Fair use label is **not** treated as a transferable license for this game. Airline rights remain with their owners. Noncommercial intent does not by itself establish permission or a copyright exception; [TIPO's explanation](https://www.tipo.gov.tw/tw/copyright/692-16335.html) makes that distinction.

Official fleet photos were inspected for placement and color; the photos and downloaded website scripts remain research material under `livery-qa/references/` and are not runtime assets or release code. See LIVERY_UPDATE.md for the reconstruction scope.

The subsequent aircraft and apron detail pass uses project-authored geometry and procedural canvas textures for fan lining, spinner markings, ground-service equipment, gate signs and windsocks. No additional third-party asset files were downloaded or bundled. The reference links and approximation limits are listed in AIRPORT_DETAIL_UPDATE.md.

The before/after and fleet PNGs under `visual-qa/` are screenshots of this game's rendered scene, created for QA. Later captures include the airline artwork documented above. They are not externally sourced airport photography.

The following version/license strings were read from installed package manifests, rather than assumed from registry listings. The lockfile controls the actual installed versions. Three.js is the runtime rendering dependency; the others are build, typing or test tools.

| Package | Installed version | Manifest license | Runtime role |
| --- | --- | --- | --- |
| `three` | 0.180.0 | MIT | Browser 3D renderer |
| `vite` | 7.3.6 | MIT | Development server and production build |
| `typescript` | 5.9.3 | Apache-2.0 | Type checking |
| `tsx` | 4.23.13 | MIT | TypeScript test execution |
| `@types/three` | 0.180.0 | MIT | Development typing |
| `@types/node` | 24.13.3 | MIT | Development typing |
| `@playwright/test` | 1.63.0 | Apache-2.0 | Browser testing |

Each package's license/notice files remain under its installed directory in `node_modules`; transitive tools have their own terms. Preserve applicable notices when distributing dependencies. This table is a dependency inventory, not a claim that the whole project is MIT-licensed.

### Three.js notice

Read from `node_modules/three/LICENSE`; retained here for distributions that bundle Three.js.

```text
The MIT License

Copyright © 2010-2025 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
