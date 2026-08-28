/* PULSEBREAK mobile input bridge
 * Safari/WebKit can deliver synthetic and real touch input differently through
 * canvas frameworks. This bridge listens at the DOM layer while retaining
 * Phaser for rendering. actionPress is de-duplicated so a single finger press
 * can never become two gameplay actions (critical for Ball gravity flips).
 */
(() => {
  'use strict';

  const attach = () => {
    const scene = window.pulsebreakScene;
    const game = document.getElementById('game');
    if (!scene || !game || scene.__nativeInputAttached) return false;
    scene.__nativeInputAttached = true;

    const originalActionPress = scene.actionPress.bind(scene);
    scene.actionPress = function unifiedActionPress() {
      const now = performance.now();
      if (now - (this.__lastActionPressAt || -1000) < 24) return false;
      this.__lastActionPressAt = now;
      originalActionPress();
      return true;
    };

    const canAct = () => scene.started && !scene.dead && !scene.finished && !scene.pausedRun;

    const down = (event) => {
      if (!canAct()) return;
      scene.actionHeld = true;
      scene.actionPress();
      if (scene.audio) scene.audio.resume();
      if (event && event.cancelable) event.preventDefault();
    };

    const up = (event) => {
      scene.actionHeld = false;
      scene.holdJumped = false;
      if (event && event.cancelable) event.preventDefault();
    };

    // Pointer events cover current Safari/iOS and desktop browsers.
    game.addEventListener('pointerdown', down, { passive:false });
    game.addEventListener('pointerup', up, { passive:false });
    game.addEventListener('pointercancel', up, { passive:false });

    // Explicit touch fallback is intentional. Some WebKit automation and older
    // iOS paths emit TouchEvents without the pointer event Phaser expects.
    game.addEventListener('touchstart', down, { passive:false });
    game.addEventListener('touchend', up, { passive:false });
    game.addEventListener('touchcancel', up, { passive:false });

    window.pulsebreakInputBridge = {
      attached:true,
      source:'native-pointer-touch',
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
