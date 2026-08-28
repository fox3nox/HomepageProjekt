# PULSEBREAK — Physics Calibration Research

This document tracks public measurements and reverse-engineering facts used to make PULSEBREAK feel precise and familiar while keeping all game code, levels, visuals, names and audio original.

## Method

- Prefer the Official Geometry Dash Wiki for measured gameplay distances and behaviour.
- Cross-check implementation constants against public reverse-engineering projects instead of guessing from video.
- Convert source coordinates into PULSEBREAK's own block/pixel scale.
- Lock gameplay to deterministic 240 Hz fixed physics.
- Keep visual rotation separate from collision.
- Every gameplay change must pass automated Chromium + WebKit mobile QA before release.

## Coordinate model

Geometry Dash uses a 30-unit editor/grid block. PULSEBREAK currently maps one block to 42 px.

`scale = 42 / 30 = 1.4 px per source coordinate`

## Physics tick

Verified target: **240 physics updates per second** in 2.2-era gameplay.

PULSEBREAK:

`FIXED = 1 / 240`

Public reverse-engineering reference:
- camila314/gdp — `GJBaseGameLayer/GJBaseGameLayer_update.cpp`
- the update loop computes physics step count from `delta * 240`.

Official wiki also documents 2.2 physics/input behaviour around 240 TPS.

## Horizontal speed portals

Measured blocks/second:

| Speed | GD b/s | PULSEBREAK px/s @ 42px/block |
|---|---:|---:|
| Slow | 8.371978759765625 | 351.6231 |
| Normal | 10.385991096496582 | 436.2116 |
| Fast | 12.914042472839355 | 542.3898 |
| Very fast | 15.600034713745117 | 655.2015 |
| Extreme | 19.19999122619629 | 806.3996 |

These values are now stored directly in `level.js`.

## Normal cube

Public reverse-engineering reference: `PlayerObject_updateTimeMod.cpp`.

Normal-speed source constants:

- `m_yStart = 11.1800318`
- `m_gravity = 0.958199024`
- terminal vertical velocity = `15` source units/update scale

Converted to PULSEBREAK:

- jump speed ≈ **939.1227 px/s**
- gravity ≈ **4829.3231 px/s²**
- terminal speed = **1260 px/s**

Official measured jump target:

- tap jump ≈ **2.1333 blocks**
- sustained/held jump ≈ **2.233 blocks**

PULSEBREAK applies a small reduced-gravity multiplier while rising and held to reproduce the sustained-jump difference.

### Cube collision model

The collision body never rotates.

Current model:

- hazard/landing AABB: **1 block = 42×42 px**
- centered solid-side collision box: **1/3 block = 14×14 px**
- visible sprite rotation is cosmetic only
- landing snaps visual rotation to nearest 90°

This deliberately follows the documented multi-hitbox feel rather than using the visible square as one universal hitbox.

## Wave

Verified normal-size behaviour:

- horizontal and vertical magnitudes are equal
- trajectory is therefore exactly **45°**
- hold = rise, release = fall
- no smoothing/acceleration between the two trajectories

PULSEBREAK:

`vy = ±vx`

Current wave body:

- **1/3 block = 14×14 px**

Mini wave is not yet implemented. Research target: double vertical rate relative to horizontal.

## Ball

Public reverse-engineering `PlayerObject_updateJump.cpp` uses a **0.6 gravity factor** for ball/spider/swing in the non-flying branch.

PULSEBREAK:

`BALL_GRAVITY = CUBE_GRAVITY * 0.6`

Behaviour target:

- input requests a gravity flip
- flip is accepted only while touching a valid surface
- pressing in mid-air must not instantly flip gravity

This rule is now covered by automated QA.

## Standard spike collision

The visible triangle is not treated as the entire lethal area.

Research target from editor/hitbox references:

- narrow rectangular lethal region
- elevated above the visual base of the spike

PULSEBREAK currently uses a narrow centered rectangle rather than the full triangle. This remains a calibration area and may be adjusted against measured editor hitbox screenshots.

## Transporters / orbs / pads

Official transporters reference provides measured launch heights by mode.

Confirmed cube examples:

- yellow orb: about **2.3833 blocks**
- yellow pad: about **4.533 blocks**
- pink pad: about **1.933 blocks**
- red pad: about **6.533 blocks**
- blue transporters: gravity manipulation rather than ordinary jump impulse
- spider orb/pad: instant travel to the nearest valid opposite surface

Current Crystal Rise only uses a yellow-style orb and it is still marked **approximate**. Exact transporter impulse calibration is the next physics pass.

## Other forms — research/implementation queue

### Ship
- Continuous hold/release acceleration.
- Gravity and acceleration differ by normal/mini size.
- Vertical speed is clamped.
- Needs exact reconstruction from `PlayerObject_updateJump.cpp` before release.

### UFO
- Discrete flap impulse per input rather than continuous hold flight.
- Has its own transporter response and terminal-velocity behaviour.
- Needs exact normal + mini calibration.

### Robot
- Variable-height jump based on press duration.
- 2.2 fixed an older high-jump behaviour for new levels while preserving compatibility options.
- Needs exact press-duration acceleration curve.

### Spider
- Input while on a valid surface teleports instantly to nearest valid surface in gravity direction and flips gravity.
- No travel arc between surfaces.
- Needs exact collision/surface-selection rules.

### Swing
- Airborne gravity toggling each input.
- Uses reduced gravity factor in the reverse-engineered jump routine.
- Needs exact velocity preservation/damping and mini behaviour.

## Portals/features still to calibrate

- mini-size portal and every form's mini physics
- blue/yellow/green gravity portals
- all five speed portals during active gameplay
- yellow/pink/red/blue/green/black orbs
- yellow/pink/red/blue pads
- dash orbs
- spider orb/pad
- teleport portals
- dual mode
- slopes and slope momentum
- ship/UFO/robot/spider/swing
- reverse direction
- exact death/restart timing
- exact camera lead/zoom rules
- practice checkpoints
- click-between-steps / on-steps behaviour from later 2.208 precision options

## Sources being tracked

- Official Geometry Dash Wiki — Portals
  - https://geometrydash.wiki.gg/wiki/Portals
- Official Geometry Dash Wiki — Transporters
  - https://geometrydash.wiki.gg/wiki/Transporters
- Official Geometry Dash Wiki — Update 2.2
  - https://geometrydash.wiki.gg/wiki/Update_2.2
- Public reverse-engineering project `camila314/gdp`
  - `GJBaseGameLayer/GJBaseGameLayer_update.cpp`
  - `PlayerObject/PlayerObject_updateTimeMod.cpp`
  - `PlayerObject/PlayerObject_updateJump.cpp`
  - `PlayerObject/PlayerObject_collidedWithObjectInternal.cpp`
  - `PlayerObject/PlayerObject_boostPlayer.cpp`

## Release gate

A PULSEBREAK physics build is not considered verified until:

1. JavaScript syntax checks pass.
2. GitHub Pages serves the exact expected build id.
3. Chromium mobile 852×393 passes.
4. WebKit mobile 852×393 passes.
5. Start button starts real movement.
6. Touch triggers a cube jump.
7. 240 Hz self-test passes.
8. normal speed/jump targets remain inside tolerance.
9. wave trajectory remains 45°.
10. ball cannot flip in mid-air.
11. mode portals resize the body correctly.
12. death→respawn restores a valid cube state.
13. canvas fills the mobile viewport without gutters.
14. screenshots are visually reviewed.
