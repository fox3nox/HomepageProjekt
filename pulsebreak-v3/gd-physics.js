/* PULSEBREAK v38 — gameplay calibration self-test
 * Runtime physics live in level.js/play.js. This file never patches gameplay.
 */
(() => {
  'use strict';

  function simulateImpulse(speed, gravity=CUBE_GRAVITY) {
    let y=0, vy=-speed, minY=0, steps=0;
    while (steps++ < 2000) {
      vy += gravity * FIXED;
      vy = Math.max(-TERMINAL_SPEED, Math.min(TERMINAL_SPEED, vy));
      y += vy * FIXED;
      minY = Math.min(minY, y);
      if (y >= 0 && steps > 2) break;
    }
    return { apexPx:-minY, apexBlocks:-minY/BLOCK, airtime:steps*FIXED };
  }

  const PHYSICS = {
    version:'v38-gd-calibration-3',
    block:BLOCK,
    fixedDt:FIXED,
    fixedHz:1/FIXED,
    speeds:SPEEDS,
    cubeJumpSpeed:CUBE_JUMP_SPEED,
    cubeRepeatJumpSpeed:CUBE_REPEAT_JUMP_SPEED,
    yellowOrbSpeed:YELLOW_ORB_SPEED,
    cubeGravity:CUBE_GRAVITY,
    ballGravity:BALL_GRAVITY,
    terminalSpeed:TERMINAL_SPEED,
    waveSlope:WAVE_VERTICAL_MULT,
    cubeBody:CUBE_BODY,
    cubeSolidBody:CUBE_SOLID_BODY,
    waveBody:WAVE_BODY,
    normalJump:simulateImpulse(CUBE_JUMP_SPEED),
    repeatJump:simulateImpulse(CUBE_REPEAT_JUMP_SPEED),
    yellowOrb:simulateImpulse(YELLOW_ORB_SPEED),
    selfTest() {
      const normalBps=SPEEDS.normal/BLOCK;
      const tests={
        fixed240Hz:Math.abs((1/FIXED)-240)<0.001,
        normalSpeed:Math.abs(normalBps-10.385991096496582)<0.00001,
        normalJumpExact:Math.abs(this.normalJump.apexBlocks-2.1333)<0.0002,
        repeatJumpExact:Math.abs(this.repeatJump.apexBlocks-2.2330)<0.0002,
        yellowOrbExact:Math.abs(this.yellowOrb.apexBlocks-2.3833)<0.0002,
        waveIs45Degrees:WAVE_VERTICAL_MULT===1,
        ballGravityRatio:Math.abs(BALL_GRAVITY/CUBE_GRAVITY-0.6)<0.000001,
        splitCubeHitbox:CUBE_SOLID_BODY<CUBE_BODY,
        waveBodyIsThird:Math.abs(WAVE_BODY/CUBE_BODY-1/3)<0.000001
      };
      return {pass:Object.values(tests).every(Boolean),tests,normalSpeedBlocksPerSecond:normalBps,normalJump:this.normalJump,repeatJump:this.repeatJump,yellowOrb:this.yellowOrb};
    }
  };

  window.PULSEBREAK_PHYSICS=PHYSICS;
  const result=PHYSICS.selfTest();
  if(!result.pass) console.error('[PULSEBREAK] physics self-test failed',result);
  else console.info('[PULSEBREAK] physics self-test passed',result);
})();
