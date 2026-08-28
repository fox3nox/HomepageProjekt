# PULSEBREAK — Physics Calibration Research

This log tracks public measurements and reverse-engineering facts used to make PULSEBREAK feel precise and familiar while keeping all code, levels, visuals, names and audio original.

## Method

- Prefer the Official Geometry Dash Wiki for measured movement distances and behaviour.
- Cross-check constants against public reverse-engineering projects instead of guessing from video.
- Convert source coordinates into PULSEBREAK's own block/pixel scale.
- Use deterministic 240 Hz fixed physics.
- Keep visual rotation completely separate from collision.
- Every gameplay change must pass Chromium + WebKit mobile QA before release.

## Coordinate model

Geometry Dash uses a 30-unit editor/grid block. PULSEBREAK maps one gameplay block to 42 px.

`scale = 42 / 30 = 1.4 px per source coordinate`

## Physics tick

Verified target: **240 physics updates per second** in 2.2-era gameplay.

PULSEBREAK: `FIXED = 1 / 240`.

Public reverse-engineering reference: `camila314/gdp`, `GJBaseGameLayer/GJBaseGameLayer_update.cpp`, whose step count is based on `delta * 240`.

## Horizontal speeds

| Speed | blocks/s | PULSEBREAK px/s |
|---|---:|---:|
| Slow | 8.371978759765625 | 351.6231 |
| Normal | 10.385991096496582 | 436.2116 |
| Fast | 12.914042472839355 | 542.3898 |
| Very fast | 15.600034713745117 | 655.2015 |
| Extreme | 19.19999122619629 | 806.3996 |

These are stored directly in `level.js`.

## Cube

Public reverse-engineering reference: `PlayerObject_updateTimeMod.cpp`.

Normal-speed source constants include:
- `m_yStart = 11.1800318`
- `m_gravity = 0.958199024`
- terminal vertical velocity = `15`

At PULSEBREAK's scale, gravity is about **4829.3231 px/s²** and terminal speed is **1260 px/s**.

Official measured targets:
- first/ordinary jump: **2.1333 blocks**
- immediately repeated held jump after landing: **2.2330 blocks**

Important correction: the 2.233 value is **not implemented as reduced gravity during every held jump**. The engine now uses separate impulses for the normal first jump and the held repeat after landing, matching the observed/reconstructed behaviour much more closely.

The impulses are solved against our actual 240 Hz discrete integrator:
- normal cube impulse: **940.3421748657386 px/s** → 2.1333 blocks
- held-repeat impulse: **961.8395421385526 px/s** → 2.2330 blocks

### Cube collision model

The physics body never rotates.
- hazard/landing AABB: **42×42 px = 1 block**
- centered solid-side box: **14×14 px = 1/3 block**
- visual rotation is cosmetic
- visual rotation snaps to nearest 90° on landing

The smaller center box is currently a calibrated approximation based on public hitbox references and remains subject to editor-measurement refinement.

## Wave

Verified normal-size behaviour:
- vertical speed magnitude equals horizontal speed magnitude
- trajectory is exactly **45°**
- hold = rise, release = fall
- no interpolation/smoothing between trajectories

PULSEBREAK uses `vy = ±vx`.

Current wave physics body: **14×14 px = 1/3 block**.

Mini wave is queued for a later pass; research target is double vertical rate relative to horizontal.

## Ball

Public reverse-engineering `PlayerObject_updateJump.cpp` uses a **0.6 gravity factor** for the ball branch.

PULSEBREAK: `BALL_GRAVITY = CUBE_GRAVITY * 0.6`.

Input behaviour:
- gravity switch is accepted only while touching a valid surface
- pressing in mid-air does not immediately flip gravity

This is covered by automated browser QA.

## Standard spike

The visible triangle is not the complete lethal region. Public editor/hitbox references show a narrow rectangular hitbox raised above the visual base.

PULSEBREAK therefore uses a centered, narrower rectangle instead of treating the entire visible triangle as lethal. Exact spike dimensions remain a calibration target.

## Yellow orb

Official measured regular-cube launch height: **2.3833 blocks**.

The old approximate multiplier has been removed. PULSEBREAK now solves the impulse against its 240 Hz integrator:

- yellow orb impulse: **993.3333447428565 px/s** → 2.3833 blocks

## Pads / transporters measured from official references

Regular cube launch heights:
- yellow pad: **4.533 blocks**
- pink pad: **1.933 blocks**
- red pad: **6.533 blocks**
- blue pad: gravity reversal
- spider pad: nearest-surface teleport + gravity switch

The official transporter table also provides separate values for ship, ball, UFO, robot, spider and mini variants. These values will be implemented mode-by-mode rather than approximated.

## Other forms — implementation queue

### Ship
- continuous hold/release flight
- normal and mini use different acceleration/limits
- exact reconstruction from `PlayerObject_updateJump.cpp` required before release

### UFO
- discrete flap impulse per input
- separate normal/mini behaviour and transporter responses

### Robot
- variable-height jump based on hold duration
- 2.2 changed/fixed older high-jump behaviour for new levels

### Spider
- input from a valid surface instantly moves to the nearest opposite valid surface and switches gravity
- no travel arc

### Swing
- each input toggles gravity while airborne
- reverse-engineered jump routine uses reduced gravity factors that still need full state-machine calibration

## Remaining calibration queue

- mini portal and every mini form
- all five live speed portals
- gravity portals
- yellow/pink/red/blue/green/black orbs
- yellow/pink/red/blue/spider pads
- dash and spider orbs
- teleport portals
- ship, UFO, robot, spider, swing
- dual mode
- slopes and slope momentum
- reverse direction
- exact death/restart timing
- camera lead/zoom rules
- practice checkpoints
- later 2.208 click precision modes

## Tracked public sources

- Official Geometry Dash Wiki — Portals: https://geometrydash.wiki.gg/wiki/Portals
- Official Geometry Dash Wiki — Transporters: https://geometrydash.wiki.gg/wiki/Transporters
- Official Geometry Dash Wiki — Update 2.2: https://geometrydash.wiki.gg/wiki/Update_2.2
- Geometry Dash Editor Wiki — Pad: https://gdeditor.net/wiki/Pad
- Public reverse-engineering project `camila314/gdp`:
  - `GJBaseGameLayer/GJBaseGameLayer_update.cpp`
  - `PlayerObject/PlayerObject_updateTimeMod.cpp`
  - `PlayerObject/PlayerObject_updateJump.cpp`
  - `PlayerObject/PlayerObject_collidedWithObjectInternal.cpp`
  - `PlayerObject/PlayerObject_boostPlayer.cpp`

## Release gate

A build is not considered verified until:
1. JavaScript syntax checks pass.
2. GitHub Pages serves the exact expected build id.
3. Chromium mobile 852×393 passes.
4. WebKit mobile 852×393 passes.
5. Start button starts real movement.
6. Touch triggers a cube jump.
7. 240 Hz self-test passes.
8. normal speed and measured jump/orb targets remain in tolerance.
9. wave remains 45°.
10. ball cannot flip in mid-air.
11. mode portals resize bodies correctly.
12. death→respawn restores valid state.
13. canvas fills the viewport without gutters.
14. screenshots are visually reviewed.
