/* PULSEBREAK v36 — GD-feel calibration layer
 * Original code/assets only. Constants are calibrated from public measurements
 * and public reverse-engineering data; rendering remains PULSEBREAK-specific.
 */
(() => {
  'use strict';

  const BLOCK = 42;
  const DT = 1 / 240;
  const SPEEDS = Object.freeze({
    slow: 8.371978759765625 * BLOCK,
    normal: 10.385991096496582 * BLOCK,
    fast: 12.914042472839355 * BLOCK,
    veryFast: 15.600034713745117 * BLOCK,
    extreme: 19.19999122619629 * BLOCK
  });

  const CUBE_GRAVITY = 0.958199024 * 3600 * (BLOCK / 30);
  const MAX_FALL = 15 * 60 * (BLOCK / 30);
  const CUBE_JUMP = 940.3421748657386;
  const CUBE_HELD_JUMP = 961.8395421385526;
  const YELLOW_ORB_JUMP = 993.3333447428565;
  const BALL_GRAVITY = CUBE_GRAVITY * 0.6;
  const INPUT_BUFFER = DT * 2;
  const CUBE_ROTATION = Math.PI * 1.5;

  const PHYSICS = {
    version: 'v36-gd-calibration-1',
    block: BLOCK,
    fixedDt: DT,
    speeds: SPEEDS,
    cubeGravity: CUBE_GRAVITY,
    cubeJump: CUBE_JUMP,
    cubeHeldJump: CUBE_HELD_JUMP,
    yellowOrbJump: YELLOW_ORB_JUMP,
    ballGravity: BALL_GRAVITY,
    maxFall: MAX_FALL,
    waveSlope: 1,
    inputBuffer: INPUT_BUFFER,
    simulateApex(initialVelocity, gravity = CUBE_GRAVITY) {
      let y = 0;
      let vy = -initialVelocity;
      let minY = 0;
      for (let i = 0; i < 2000; i++) {
        vy = Math.min(MAX_FALL, vy + gravity * DT);
        y += vy * DT;
        minY = Math.min(minY, y);
        if (vy >= 0) break;
      }
      return -minY;
    },
    selfTest() {
      return {
        normalSpeedBlocksPerSecond: SPEEDS.normal / BLOCK,
        normalApexBlocks: this.simulateApex(CUBE_JUMP) / BLOCK,
        heldApexBlocks: this.simulateApex(CUBE_HELD_JUMP) / BLOCK,
        yellowOrbApexBlocks: this.simulateApex(YELLOW_ORB_JUMP) / BLOCK,
        waveSlope: 1,
        fixedHz: 1 / DT
      };
    }
  };
  window.PULSEBREAK_PHYSICS = PHYSICS;

  function patchScene(scene) {
    if (!scene || scene.__gdPhysicsPatched) return;
    scene.__gdPhysicsPatched = true;
    scene.ballFlipBuffer = 0;
    scene.holdHasJumped = false;

    scene.resizeView = function resizeViewGD() {
      const w = Math.max(1, this.scale.width);
      const h = Math.max(1, this.scale.height);
      const zoom = Math.max(.46, Math.min(w / 1280, h / WORLD_H));
      const viewW = w / zoom;
      const viewH = h / zoom;
      this.cameras.main.setZoom(zoom);
      this.cameras.main.scrollY = Math.max(0, (WORLD_H - viewH) * .5);
      const fixedX = -(w * .5) * (1 / zoom - 1);
      const fixedY = -(h * .5) * (1 / zoom - 1);
      const tex = this.textures.get('bg').getSourceImage();
      const scale = Math.max(viewW / tex.width, viewH / tex.height);
      this.bg.setPosition(fixedX, fixedY).setDisplaySize(tex.width * scale, tex.height * scale);
      this.bgShade.setPosition(fixedX, fixedY).setSize(viewW, viewH);
      this.beatVeil.setPosition(fixedX, fixedY).setSize(viewW, viewH);
    };

    scene.actionPress = function actionPressGD() {
      if (this.tryOrb()) return;
      if (this.player.mode === MODES.CUBE) {
        this.jumpBuffer = INPUT_BUFFER;
      } else if (this.player.mode === MODES.BALL) {
        this.ballFlipBuffer = INPUT_BUFFER;
      }
    };

    scene.tryOrb = function tryOrbGD() {
      if (this.player.mode === MODES.WAVE) return false;
      for (const o of LEVEL.orbs) {
        if (o.used) continue;
        const dx = (this.player.x + this.player.w / 2) - o.x;
        const dy = (this.player.y + this.player.h / 2) - o.y;
        if (dx * dx + dy * dy < 82 * 82) {
          o.used = true;
          this.player.vy = -YELLOW_ORB_JUMP * this.player.gravity;
          this.player.onGround = false;
          this.jumpBuffer = 0;
          this.ballFlipBuffer = 0;
          const visual = this.orbVisual.find(v => v.data === o);
          if (visual) visual.img.setAlpha(.16);
          this.spawnBurst(o.x, o.y, 0x73f7ff, 18);
          this.audio.portal();
          try { if (navigator.vibrate) navigator.vibrate(7); } catch (_) {}
          return true;
        }
      }
      return false;
    };

    scene.fixedStep = function fixedStepGD(dt) {
      if (!this.started || this.dead || this.finished || this.pausedRun) return;
      this.simTime += dt;
      if (this.audio.tick(this.simTime)) this.beatPulse = 1;
      this.beatPulse = Math.max(0, this.beatPulse - dt * 3.8);
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      this.ballFlipBuffer = Math.max(0, (this.ballFlipBuffer || 0) - dt);
      if (!this.actionHeld) this.holdHasJumped = false;

      const p = this.player;
      const prev = { x: p.x, y: p.y, bottom: p.y + p.h, top: p.y };

      if (p.mode === MODES.CUBE) {
        const wantsFirstJump = p.onGround && this.jumpBuffer > 0;
        const wantsHeldRepeat = p.onGround && this.actionHeld && this.holdHasJumped;
        if (wantsFirstJump || wantsHeldRepeat) {
          p.vy = -(this.holdHasJumped ? CUBE_HELD_JUMP : CUBE_JUMP);
          p.onGround = false;
          this.jumpBuffer = 0;
          this.holdHasJumped = true;
          this.spawnBurst(p.x + p.w / 2, p.y + p.h, 0x72f1ff, 7);
        }
        p.vy = Math.min(MAX_FALL, p.vy + CUBE_GRAVITY * dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.onGround = false;
        if (this.resolveSurface(prev, 1) === 'dead') return;
        if (!p.onGround) this.visualAngle += CUBE_ROTATION * dt;
        else this.visualAngle = Math.round(this.visualAngle / (Math.PI / 2)) * (Math.PI / 2);
      } else if (p.mode === MODES.WAVE) {
        p.vy = (this.actionHeld ? -1 : 1) * p.vx;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (this.overlapsAnySolid() || this.overlapsSpike()) return this.kill();
        this.visualAngle = Math.atan2(p.vy, p.vx);
      } else {
        const wantsFlip = p.onGround && ((this.ballFlipBuffer || 0) > 0 || this.actionHeld);
        if (wantsFlip) {
          p.gravity *= -1;
          p.vy = 0;
          p.onGround = false;
          this.ballFlipBuffer = 0;
          this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, 0xffb45e, 10);
          try { if (navigator.vibrate) navigator.vibrate(8); } catch (_) {}
        }
        p.vy += BALL_GRAVITY * p.gravity * dt;
        p.vy = Phaser.Math.Clamp(p.vy, -MAX_FALL, MAX_FALL);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.onGround = false;
        if (this.resolveSurface(prev, p.gravity) === 'dead') return;
        this.visualAngle += 5.5 * dt * p.gravity;
      }

      if (this.overlapsSpike()) return this.kill();
      if (p.y > WORLD_H + 80 || p.y < -120) return this.kill();
      this.checkPortals();
      if (p.x >= END_X) this.finish();
    };

    scene.update = function updateGD(_time, delta) {
      const dt = Math.min(.066, delta / 1000);
      this.acc += dt;
      let safety = 0;
      while (this.acc >= FIXED && safety++ < 16) {
        this.fixedStep(FIXED);
        this.acc -= FIXED;
      }
      if (safety >= 16) this.acc = 0;
      const p = this.player;
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      this.playerSprite.setPosition(cx, cy).setRotation(this.visualAngle);
      this.playerGlow.setPosition(cx, cy);
      this.scanGlow.x = p.x + 220;
      this.updateTrail();
      this.updateCamera();
      this.updateEffects(dt);
      this.updateHud();
    };

    scene.resizeView();
    console.info('[PULSEBREAK] GD-feel physics active', PHYSICS.selfTest());
  }

  function waitForScene() {
    if (window.pulsebreakScene) {
      patchScene(window.pulsebreakScene);
      return;
    }
    requestAnimationFrame(waitForScene);
  }
  waitForScene();
})();
