/* PULSEBREAK 3.0 — Crystal Rise runtime
 * Phaser handles rendering/input only. Movement/collision uses our own
 * deterministic 240 Hz axis-aligned physics. Visual rotation never affects collision.
 */
(() => {
  'use strict';

  const $ = (q) => document.querySelector(q);
  const safeVibrate = (pattern) => { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) {} };
  const overlaps = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;

  if (!window.Phaser) {
    const err = $('#boot-error');
    if (err) err.classList.add('visible');
    return;
  }

  class PulseScene extends Phaser.Scene {
    constructor() {
      super('Pulse');
      this.acc = 0;
      this.simTime = 0;
      this.attempt = 1;
      this.started = false;
      this.dead = false;
      this.finished = false;
      this.pausedRun = false;
      this.actionHeld = false;
      this.holdJumped = false;
      this.jumpBuffer = 0;
      this.visualAngle = 0;
      this.beatPulse = 0;
      this.respawnTimer = null;
    }

    preload() {
      this.load.svg('bg', svgUri(ART.bg), { width: 1600, height: 900 });
      this.load.svg('stone', svgUri(ART.tile), { width: 64, height: 64 });
      this.load.svg('cube', svgUri(ART.cube), { width: 100, height: 100 });
      this.load.svg('wave', svgUri(ART.wave), { width: 100, height: 100 });
      this.load.svg('ball', svgUri(ART.ball), { width: 100, height: 100 });
      this.load.svg('spike', svgUri(ART.spike), { width: 80, height: 80 });
      this.load.svg('portal', svgUri(ART.portal), { width: 120, height: 180 });
      this.load.svg('crystal', svgUri(ART.crystal), { width: 70, height: 100 });
      this.load.svg('orb', svgUri(ART.orb), { width: 100, height: 100 });
      this.load.on('loaderror', (file) => {
        console.error('[PULSEBREAK] asset failed:', file && file.key, file && file.src);
        const err = $('#boot-error');
        if (err) err.classList.add('visible');
      });
    }

    create() {
      window.pulsebreakScene = this;
      this.audio = new BeatAudio();
      this.cameras.main.setBackgroundColor('#030612');
      if (this.cameras.main.setOrigin) this.cameras.main.setOrigin(0, 0);

      this.bg = this.add.image(0, 0, 'bg').setOrigin(0).setScrollFactor(0).setDepth(-100).setAlpha(.96);
      this.bgShade = this.add.rectangle(0, 0, 10, 10, 0x050718, .27).setOrigin(0).setScrollFactor(0).setDepth(-99);
      this.beatVeil = this.add.rectangle(0, 0, 10, 10, 0x776cff, 0).setOrigin(0).setScrollFactor(0).setDepth(50);
      this.scanGlow = this.add.rectangle(0, 0, 2, WORLD_H, 0x79f5ff, .12).setOrigin(.5, 0).setDepth(-1);

      this.makeWorld();
      this.player = { x: START_X, y: 600 - CUBE_BODY, w: CUBE_BODY, h: CUBE_BODY, vx: BASE_SPEED, vy: 0, mode: MODES.CUBE, gravity: 1, onGround: true };
      this.playerSprite = this.add.image(START_X, 520, 'cube').setDepth(20).setDisplaySize(BLOCK * 1.24, BLOCK * 1.24);
      this.playerGlow = this.add.circle(START_X, 520, BLOCK * .72, 0x77f4ff, .11).setDepth(18);
      this.makeTrail();

      const press = () => {
        if (!this.started || this.dead || this.finished || this.pausedRun) return;
        this.actionHeld = true;
        this.actionPress();
        this.audio.resume();
      };
      const release = () => {
        this.actionHeld = false;
        this.holdJumped = false;
      };

      this.input.on('pointerdown', press);
      this.input.on('pointerup', release);
      this.input.on('pointerupoutside', release);
      if (this.input.keyboard) {
        this.input.keyboard.on('keydown-SPACE', (e) => { if (!e.repeat) press(); });
        this.input.keyboard.on('keyup-SPACE', release);
        this.input.keyboard.on('keydown-UP', (e) => { if (!e.repeat) press(); });
        this.input.keyboard.on('keyup-UP', release);
        this.input.keyboard.on('keydown-W', (e) => { if (!e.repeat) press(); });
        this.input.keyboard.on('keyup-W', release);
      }

      this.scale.on('resize', () => this.resizeView());
      this.resizeView();
      this.updateHud();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.started && !this.dead && !this.finished) this.setPaused(true);
      });
    }

    makeWorld() {
      this.worldVisuals = [];
      this.portalVisual = [];
      this.orbVisual = [];
      for (const d of LEVEL.decor) {
        const im = this.add.image(d.x, d.y, 'crystal').setScale(d.scale).setAlpha(.35).setDepth(0);
        this.worldVisuals.push(im);
      }
      for (const s of LEVEL.solids) {
        const ts = this.add.tileSprite(s.x, s.y, s.w, s.h, 'stone').setOrigin(0).setDepth(2);
        ts.setTint(s.kind === 'pillar' ? 0x6462d9 : s.kind === 'ceiling' ? 0x5355b8 : 0x7777ef);
        ts.setAlpha(s.kind === 'ground' ? .98 : .96);
        const edgeY = s.kind === 'ceiling' ? s.y + s.h - 4 : s.y;
        const edge = this.add.rectangle(s.x, edgeY, s.w, 4, 0x71efff, .88).setOrigin(0).setDepth(3);
        this.worldVisuals.push(ts, edge);
      }
      for (const sp of LEVEL.spikes) {
        const im = this.add.image(sp.x + sp.w / 2, sp.y + sp.h / 2, 'spike').setDisplaySize(sp.w + 14, sp.h + 14).setDepth(8);
        if (sp.down) im.setFlipY(true);
        this.worldVisuals.push(im);
      }
      for (const p of LEVEL.portals) {
        const im = this.add.image(p.x + p.w / 2, p.y + p.h / 2, 'portal').setDisplaySize(88, 142).setDepth(9).setAlpha(.96);
        im.setTint(p.mode === MODES.WAVE ? 0x73ffac : p.mode === MODES.BALL ? 0xffb85f : 0xff78dc);
        this.portalVisual.push({ data: p, img: im });
      }
      for (const o of LEVEL.orbs) {
        const im = this.add.image(o.x, o.y, 'orb').setDisplaySize(68, 68).setDepth(10);
        this.orbVisual.push({ data: o, img: im });
      }
      this.finishGate = this.add.image(END_X, 350, 'portal').setDisplaySize(128, 232).setTint(0xff72dc).setDepth(10);
      this.finishLabel = this.add.text(END_X, 205, 'BREAK', { fontFamily: 'system-ui, sans-serif', fontSize: '20px', fontStyle: '900', color: '#dffcff' }).setOrigin(.5).setDepth(11);
    }

    makeTrail() {
      this.trail = [];
      for (let i = 0; i < 14; i++) {
        this.trail.push(this.add.rectangle(START_X, 520, Math.max(4, 13 - i * .55), Math.max(4, 13 - i * .55), i % 2 ? 0xa176ff : 0x64eaff, Math.max(.05, .42 - i * .024)).setDepth(15));
      }
    }

    resizeView() {
      const w = Math.max(1, this.scale.width);
      const h = Math.max(1, this.scale.height);
      const zoom = Math.max(.46, Math.min(w / 1280, h / WORLD_H));
      const viewW = w / zoom;
      const viewH = h / zoom;
      const cam = this.cameras.main;
      if (cam.setOrigin) cam.setOrigin(0, 0);
      cam.setZoom(zoom);
      cam.scrollY = Math.max(0, (WORLD_H - viewH) * .5);
      const tex = this.textures.get('bg').getSourceImage();
      const scale = Math.max(viewW / tex.width, viewH / tex.height);
      this.bg.setPosition(0, 0).setDisplaySize(tex.width * scale, tex.height * scale);
      this.bgShade.setPosition(0, 0).setSize(viewW, viewH);
      this.beatVeil.setPosition(0, 0).setSize(viewW, viewH);
      window.pulsebreakViewport = { width:w, height:h, zoom, viewW, viewH, cameraOriginX:cam.originX, cameraOriginY:cam.originY };
    }

    async startRun() {
      this.audio.start();
      this.started = true;
      this.attempt = 1;
      this.resetPlayer(false);
      const start = $('#start-screen'); if (start) start.classList.remove('visible');
      const hud = $('#hud'); if (hud) hud.classList.add('visible');
      const pause = $('#pause-btn'); if (pause) pause.classList.add('visible');
      try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (_) {}
      try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (_) {}
      this.resizeView();
    }

    resetPlayer(increment = true) {
      if (increment) this.attempt++;
      clearTimeout(this.respawnTimer);
      this.dead = false;
      this.finished = false;
      this.pausedRun = false;
      this.simTime = 0;
      this.acc = 0;
      this.beatPulse = 0;
      this.jumpBuffer = 0;
      this.visualAngle = 0;
      this.actionHeld = false;
      this.holdJumped = false;
      Object.assign(this.player, { x: START_X, y: 600 - CUBE_BODY, w: CUBE_BODY, h: CUBE_BODY, vx: BASE_SPEED, vy: 0, mode: MODES.CUBE, gravity: 1, onGround: true });
      LEVEL.portals.forEach(p => p.used = false);
      LEVEL.orbs.forEach(o => o.used = false);
      this.portalVisual.forEach(v => v.img.setAlpha(.96));
      this.orbVisual.forEach(v => v.img.setAlpha(1));
      this.playerSprite.setVisible(true);
      this.playerGlow.setVisible(true);
      this.trail.forEach(t => t.setVisible(true));
      this.setModeSprite();
      this.audio.reset(0);
      this.cameras.main.scrollX = 0;
      const result = $('#result'); if (result) result.classList.remove('visible');
      this.setPaused(false);
      this.updateHud();
    }

    setPaused(value) {
      this.pausedRun = value;
      const btn = $('#pause-btn');
      if (btn) btn.textContent = value ? '▶' : 'Ⅱ';
      const badge = $('#pause-badge'); if (badge) badge.classList.toggle('visible', value);
      if (value) { this.actionHeld = false; this.holdJumped = false; }
      else this.audio.resume();
    }
    togglePause() { this.setPaused(!this.pausedRun); }

    resizeBody(size) {
      const p = this.player;
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      p.w = size; p.h = size;
      p.x = cx - size / 2;
      p.y = cy - size / 2;
    }
    setModeBody(mode) { this.resizeBody(mode === MODES.WAVE ? WAVE_BODY : CUBE_BODY); }

    setModeSprite() {
      const key = this.player.mode === MODES.CUBE ? 'cube' : this.player.mode === MODES.WAVE ? 'wave' : 'ball';
      const display = this.player.mode === MODES.WAVE ? BLOCK * .92 : BLOCK * 1.24;
      this.playerSprite.setTexture(key).setDisplaySize(display, display);
      this.playerGlow.setFillStyle(this.player.mode === MODES.WAVE ? 0x5dff98 : this.player.mode === MODES.BALL ? 0xffaf53 : 0x77f4ff, .11);
      this.updateHud();
    }

    actionPress() {
      if (this.tryOrb()) return;
      const p = this.player;
      if (p.mode === MODES.CUBE) {
        this.jumpBuffer = JUMP_BUFFER;
      } else if (p.mode === MODES.BALL && p.onGround) {
        p.gravity *= -1;
        p.vy = 0;
        p.onGround = false;
        p.y += p.gravity < 0 ? -1 : 1;
        this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, 0xffb45e, 10);
        safeVibrate(8);
      }
    }

    tryOrb() {
      const p = this.player;
      if (p.mode === MODES.WAVE) return false;
      for (const o of LEVEL.orbs) {
        if (o.used) continue;
        const dx = (p.x + p.w / 2) - o.x;
        const dy = (p.y + p.h / 2) - o.y;
        if (dx * dx + dy * dy < 82 * 82) {
          o.used = true;
          p.vy = -YELLOW_ORB_SPEED * p.gravity;
          p.onGround = false;
          this.jumpBuffer = 0;
          this.holdJumped = this.actionHeld;
          const vis = this.orbVisual.find(v => v.data === o); if (vis) vis.img.setAlpha(.16);
          this.spawnBurst(o.x, o.y, 0x73f7ff, 18);
          this.audio.portal();
          safeVibrate(7);
          return true;
        }
      }
      return false;
    }

    fixedStep(dt) {
      if (!this.started || this.dead || this.finished || this.pausedRun) return;
      this.simTime += dt;
      if (this.audio.tick(this.simTime)) this.beatPulse = 1;
      this.beatPulse = Math.max(0, this.beatPulse - dt * 3.8);
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      if (!this.actionHeld) this.holdJumped = false;

      const p = this.player;
      const prev = { x: p.x, y: p.y, bottom: p.y + p.h, top: p.y };

      if (p.mode === MODES.CUBE) {
        const wantsJump = p.onGround && (this.jumpBuffer > 0 || this.actionHeld);
        if (wantsJump) {
          const repeatJump = this.actionHeld && this.holdJumped;
          p.vy = -(repeatJump ? CUBE_REPEAT_JUMP_SPEED : CUBE_JUMP_SPEED) * p.gravity;
          p.onGround = false;
          this.jumpBuffer = 0;
          this.holdJumped = this.actionHeld;
          this.spawnBurst(p.x + p.w / 2, p.y + p.h, 0x72f1ff, 7);
        }
        p.vy += CUBE_GRAVITY * p.gravity * dt;
        p.vy = Phaser.Math.Clamp(p.vy, -TERMINAL_SPEED, TERMINAL_SPEED);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.onGround = false;
        if (this.resolveSurface(prev, p.gravity) === 'dead') return;
        if (!p.onGround) this.visualAngle += 7.8 * dt * p.gravity;
        else this.visualAngle = Math.round(this.visualAngle / (Math.PI / 2)) * (Math.PI / 2);
      } else if (p.mode === MODES.WAVE) {
        p.vy = (this.actionHeld ? -1 : 1) * p.vx * WAVE_VERTICAL_MULT * p.gravity;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (this.overlapsAnySolid() || this.overlapsSpike()) return this.kill();
        this.visualAngle = Math.atan2(p.vy, p.vx);
      } else {
        p.vy += BALL_GRAVITY * p.gravity * dt;
        p.vy = Phaser.Math.Clamp(p.vy, -TERMINAL_SPEED, TERMINAL_SPEED);
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
    }

    getSolidBody() {
      const p = this.player;
      if (p.mode === MODES.WAVE) return {x:p.x,y:p.y,w:p.w,h:p.h};
      const size = Math.min(CUBE_SOLID_BODY, p.w);
      return {x:p.x+(p.w-size)/2,y:p.y+(p.h-size)/2,w:size,h:size};
    }

    resolveSurface(prev, gravityDir) {
      const p = this.player;
      for (const s of LEVEL.solids) {
        if (!overlaps(p, s)) continue;
        if (gravityDir > 0 && p.vy >= 0 && prev.bottom <= s.y + 4) {
          p.y = s.y - p.h; p.vy = 0; p.onGround = true; return 'landed';
        }
        if (gravityDir < 0 && p.vy <= 0 && prev.top >= s.y + s.h - 4) {
          p.y = s.y + s.h; p.vy = 0; p.onGround = true; return 'landed';
        }
        if (overlaps(this.getSolidBody(), s)) { this.kill(); return 'dead'; }
      }
      return 'clear';
    }

    overlapsAnySolid() {
      const body = this.player.mode === MODES.WAVE ? this.player : this.getSolidBody();
      return LEVEL.solids.some(s => overlaps(body, s));
    }

    overlapsSpike() {
      const p = this.player;
      return LEVEL.spikes.some(s => {
        const iw = s.w * .38;
        const ih = s.h * .60;
        const ix = s.x + (s.w - iw) / 2;
        const iy = s.down ? s.y + s.h * .16 : s.y + s.h * .24;
        return overlaps(p, {x:ix,y:iy,w:iw,h:ih});
      });
    }

    checkPortals() {
      const p = this.player;
      for (const po of LEVEL.portals) {
        if (po.used) continue;
        if (p.x + p.w > po.x && p.x < po.x + po.w && p.y + p.h > po.y && p.y < po.y + po.h) {
          po.used = true;
          p.mode = po.mode;
          p.vx = po.speed || p.vx;
          p.vy = 0;
          p.gravity = 1;
          p.onGround = false;
          this.holdJumped = false;
          this.setModeBody(p.mode);
          if (p.mode === MODES.WAVE) p.y = 330;
          if (p.mode === MODES.BALL) p.y = 500;
          if (p.mode === MODES.CUBE) p.y = 500;
          this.audio.portal();
          this.cameras.main.flash(110, 90, 230, 255, false);
          this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, 0x9f72ff, 28);
          this.setModeSprite();
          const vis = this.portalVisual.find(v => v.data === po); if (vis) vis.img.setAlpha(.22);
          safeVibrate([8, 18, 8]);
        }
      }
    }

    kill() {
      if (this.dead || this.finished) return;
      this.dead = true;
      this.actionHeld = false;
      this.holdJumped = false;
      this.audio.death();
      this.spawnBurst(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 0xff4cae, 34);
      this.cameras.main.shake(170, .014);
      this.cameras.main.flash(90, 255, 50, 120, false);
      this.playerSprite.setVisible(false);
      this.playerGlow.setVisible(false);
      this.trail.forEach(t => t.setVisible(false));
      safeVibrate([18, 35, 12]);
      this.respawnTimer = setTimeout(() => { if (this.dead) this.resetPlayer(true); }, 480);
    }

    finish() {
      if (this.finished) return;
      this.finished = true;
      this.actionHeld = false;
      this.holdJumped = false;
      this.spawnBurst(this.player.x, this.player.y, 0x72f1ff, 54);
      this.cameras.main.flash(220, 110, 245, 255, false);
      $('#result-kicker').textContent = 'SIGNAL GESICHERT';
      $('#result-title').textContent = '100%';
      $('#result-copy').textContent = `Crystal Rise · ${this.attempt} Versuch${this.attempt === 1 ? '' : 'e'}`;
      const result = $('#result'); if (result) result.classList.add('visible');
      safeVibrate([12, 40, 12, 40, 18]);
    }

    spawnBurst(x, y, color, count = 16) {
      for (let i = 0; i < count; i++) {
        const r = this.add.rectangle(x, y, Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 7), color, 1).setDepth(30);
        const a = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(30, 110);
        this.tweens.add({ targets: r, x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist, alpha: 0, scale: .2, duration: Phaser.Math.Between(240, 520), ease: 'Quad.Out', onComplete: () => r.destroy() });
      }
    }

    update(_time, delta) {
      const dt = Math.min(.05, delta / 1000);
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
    }

    updateTrail() {
      const p = this.player;
      const headX = p.x + p.w / 2;
      const headY = p.y + p.h / 2;
      this.trail.forEach((t, i) => {
        const lag = (i + 1) * 16;
        t.x = Phaser.Math.Linear(t.x || headX, headX - lag, .30);
        t.y = Phaser.Math.Linear(t.y || headY, headY, .25);
        t.alpha = (.47 - i * .028) * (this.dead ? 0 : 1);
      });
    }

    updateCamera() {
      const cam = this.cameras.main;
      const viewW = this.scale.width / cam.zoom;
      const target = Math.max(0, this.player.x - viewW * .28);
      cam.scrollX = Phaser.Math.Linear(cam.scrollX, target, .13);
    }

    updateEffects(dt) {
      const pulse = this.beatPulse;
      const modeColor = this.player.mode === MODES.WAVE ? 0x63ff9f : this.player.mode === MODES.BALL ? 0xffad55 : 0x746bff;
      this.beatVeil.setFillStyle(modeColor, .015 + pulse * .052);
      this.playerGlow.setScale(1 + pulse * .10);
      this.portalVisual.forEach((v, i) => {
        if (v.data.used) return;
        v.img.rotation += dt * (i % 2 ? -.42 : .42);
        v.img.setScale(1 + pulse * .035);
      });
      this.orbVisual.forEach(v => {
        if (v.data.used) return;
        v.img.rotation -= dt * .65;
        v.img.setScale(.70 + pulse * .035);
      });
    }

    updateHud() {
      if (!this.player) return;
      const progress = Phaser.Math.Clamp((this.player.x - START_X) / (END_X - START_X), 0, 1);
      $('#progress-fill').style.width = `${(progress * 100).toFixed(1)}%`;
      $('#progress-text').textContent = `${Math.floor(progress * 100)}%`;
      $('#attempt-text').textContent = `TRY ${this.attempt}`;
      $('#mode-label').textContent = this.player.mode.toUpperCase();
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#03050d',
    width: 1280,
    height: 720,
    transparent: false,
    pixelArt: false,
    antialias: true,
    roundPixels: false,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.NO_CENTER, width: '100%', height: '100%' },
    render: { powerPreference: 'high-performance', antialias: true },
    scene: [PulseScene]
  };

  new Phaser.Game(config);

  const startBtn = $('#start-btn'); if (startBtn) startBtn.addEventListener('click', () => { if (window.pulsebreakScene) window.pulsebreakScene.startRun(); });
  const retryBtn = $('#retry-btn'); if (retryBtn) retryBtn.addEventListener('click', () => { if (window.pulsebreakScene) window.pulsebreakScene.resetPlayer(true); });
  const pauseBtn = $('#pause-btn'); if (pauseBtn) pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); if (window.pulsebreakScene) window.pulsebreakScene.togglePause(); });
  const pauseBadge = $('#pause-badge'); if (pauseBadge) pauseBadge.addEventListener('click', () => { if (window.pulsebreakScene) window.pulsebreakScene.togglePause(); });
  window.addEventListener('contextmenu', e => e.preventDefault());
})();