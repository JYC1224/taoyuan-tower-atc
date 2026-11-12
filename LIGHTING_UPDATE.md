# Weather and lighting update

The sun's approximate local direction now follows Taoyuan latitude, runway orientation, time of day and the simulator's fixed 6 September scenario. Twilight, ambient light, sky colour, airport lights and reflections fade smoothly instead of switching at one threshold. Clear, cloudy, rain and storm conditions change direct-light strength and the contrast of fallback aircraft shadows. In Medium and High, aircraft use the existing real directional shadow map instead of an additional fixed-shape shadow beneath the aircraft; Low retains the weather-scaled fallback.

The 12 November follow-up calculates solar declination and equation of time from each scenario date, so seasonal sun angle and local solar noon track the selected date. High rendering now uses AgX tone mapping, 4× multisampled composer targets, scene ambient occlusion, subtle highlight bloom, a 4096 directional shadow map and a higher screen-space render scale. No survey-grade terrain or building meshes were added in this pass.

Wet pavement has more restrained reflectivity and roughness so it does not wash out under a bright environment map. At night the nearest scenery floodlight provides local light to actual 3D materials, in addition to the existing apron light pools; High enables a second nearby floodlight. A warm local light illuminates the tower cab when the camera is close. These are performance-conscious approximations, not ray-traced global illumination or a surveyed light distribution. Reflection environment maps remain approximate and the sun model uses the fixed scenario date, not a full seasonal ephemeris.

`dist/lighting-review/index.html` compares the previous and revised build in clear noon, sunset, storm noon, clear night and rainy night, from a fixed camera. Five captures produced no browser errors. The production build, 60 unit/simulation tests and four browser workflows passed; the final light-count optimization was also checked with the five capture scenarios.

Paired testing on Intel UHD 730, 1440×900 Medium, 14 aircraft, two samples of 180 frames each at night: normal-speed median frame time averaged 21.30 ms before and 23.05 ms after (8.2% longer). This result applies to that machine and camera, not all hardware. High quality retains additional local light and may cost more. Details are in `visual-qa/lighting-performance.json`.

