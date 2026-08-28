/* PULSEBREAK v36 — GD-feel calibration self-test
 * This file does not patch gameplay. The runtime physics live in level.js/play.js.
 * It exposes measured targets so CI and debugging can verify that future changes
 * do not silently drift away from the calibrated feel.
 */
(() => {
  'use strict';

  function simulateCube(held) {
    let y = 0;
    let vy = -CUBE_JUMP_SPEED;
    let minY = 0;
    let steps = 0;
    while (steps++ < 2000) {
      const rising = vy < 0;
      const gravityMult = held && rising ? CUBE_HELD_GRAVITY_MULT : 1;
      vy += CUBE_GRAVITY * gravityMult * FIXED;
      vy = Math.max(-TERMINAL_SPEED, Math.min(TERMINAL_SPEED, vy));
      y += vy * FIXED;
      minY = Math.min(minY, y);
      if (y >= 0 && steps > 2) break;
    }
    return { apexPx: -minY, apexBlocks: -minY / BLOCK, airtime: steps * FIXED };
  }

  const PHYSICS = {
    version: 'v36-gd-calibration-2',
    block: BLOCK,
    fixedDt: FIXED,
    fixedHz: 1 / FIXED,
    speeds: SPEEDS,
    cubeJumpSpeed: CUBE_JUMP_SPEED,
    cubeGravity: CUBE_GRAVITY,
    ballGravity: BALL_GRAVITY,
    terminalSpeed: TERMINAL_SPEED,
    waveSlope: WAVE_VERTICAL_MULT,
    cubeBody: CUBE_BODY,
    cubeSolidBody: CUBE_SOLID_BODY,
    waveBody: WAVE_BODY,
    normalJump: simulateCube(false),
    heldJump: simulateCube(true),
    selfTest() {
      const normalBps = SPEEDS.normal / BLOCK;
      const tests = {
        fixed240Hz: Math.abs((1 / FIXED) - 240) < 0.001,
        normalSpeed: Math.abs(normalBps - 10.385991096496582) < 0.00001,
        normalJumpNearTarget: this.normalJump.apexBlocks > 2.10 && this.normalJump.apexBlocks < 2.16,
        heldJumpNearTarget: this.heldJump.apexBlocks > 2.20 && this.heldJump.apexBlocks < 2.26,
        waveIs45Degrees: WAVE_VERTICAL_MULT === 1,
        ballGravityRatio: Math.abs(BALL_GRAVITY / CUBE_GRAVITY - 0.6) < 0.000001,
        splitCubeHitbox: CUBE_SOLID_BODY < CUBE_BODY,
        waveBodyIsThird: Math.abs(WAVE_BODY / CUBE_BODY - 1/3) < 0.000001
      };
      return { pass:Object.values(tests).every(Boolean), tests, normalSpeedBlocksPerSecond:normalBps, normalJump:this.normalJump, heldJump:this.heldJump };
    }
  };

  window.PULSEBREAK_PHYSICS = PHYSICS;
  const result = PHYSICS.selfTest();
  if (!result.pass) console.error('[PULSEBREAK] physics self-test failed', result);
  else console.info('[PULSEBREAK] physics self-test passed', result);
})();
