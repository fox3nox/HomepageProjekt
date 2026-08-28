/* PULSEBREAK mobile input bridge
 * Gameplay touch is captured at the DOM parent before the canvas framework can
 * interpret the same physical contact a second time. The physics API itself is
 * never wrapped or patched, so internal tests and mode logic remain deterministic.
 */
(() => {
  'use strict';

  const attach = () => {
    const scene = window.pulsebreakScene;
    const game = document.getElementById('game');
    if (!scene || !game || scene.__nativeInputAttached) return false;
    scene.__nativeInputAttached = true;

    let lastDownAt = -1000;
    let lastUpAt = -1000;
    const DUPLICATE_WINDOW_MS = 32;
    const canAct = () => scene.started && !scene.dead && !scene.finished && !scene.pausedRun;

    const consume = (event) => {
      if (!event) return;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
    };

    const down = (event) => {
      const now = performance.now();
      consume(event);
      if (now - lastDownAt < DUPLICATE_WINDOW_MS) return;
      lastDownAt = now;
      if (!canAct()) return;
      scene.actionHeld = true;
      scene.actionPress();
      if (scene.audio) scene.audio.resume();
    };

    const up = (event) => {
      const now = performance.now();
      consume(event);
      if (now - lastUpAt < DUPLICATE_WINDOW_MS) return;
      lastUpAt = now;
      scene.actionHeld = false;
      scene.holdJumped = false;
    };

    // Capture phase on #game runs before the event reaches Phaser's canvas.
    // Listening to both families covers current PointerEvent-based Safari and
    // TouchEvent-only paths; the short bridge-level window merges duplicates.
    const options = { passive:false, capture:true };
    game.addEventListener('pointerdown', down, options);
    game.addEventListener('pointerup', up, options);
    game.addEventListener('pointercancel', up, options);
    game.addEventListener('touchstart', down, options);
    game.addEventListener('touchend', up, options);
    game.addEventListener('touchcancel', up, options);

    window.pulsebreakInputBridge = {
      attached:true,
      source:'native-capture-pointer-touch',
      duplicateWindowMs:DUPLICATE_WINDOW_MS,
      press:down,
      release:up
    };
    return true;
  };

  if (!attach()) {
    const timer = setInterval(() => {
      if (attach()) clearInterval(timer);
    }, 16);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();
