/* Explicit, one-time transfer to the owner's private Jarvis PC. No background requests. */
(() => {
  'use strict';
  if (window.fcOpenJarvisConnect) return;
  const RECEIVER = 'https://oli.tail7ff2cf.ts.net:8443';

  function accessKey() {
    try {
      const cookie = document.cookie.split(';').map(x => x.trim()).find(x => x.startsWith('fc_private_access='));
      if (cookie) return decodeURIComponent(cookie.slice('fc_private_access='.length));
    } catch (_) {}
    try { return localStorage.getItem('fc-private-access-v1') || ''; } catch (_) { return ''; }
  }

  async function request(path, body, signal) {
    const response = await fetch(RECEIVER + path, {
      method: 'POST', mode: 'cors', credentials: 'omit', redirect: 'error',
      cache: 'no-store', referrerPolicy: 'no-referrer',
      headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), signal
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) {
      if (result.error === 'code') throw new Error('Der Code stimmt nicht. Prüfe die sechs Ziffern im PC-Fenster.');
      if (result.error === 'expired') throw new Error('Der PC-Code ist abgelaufen. Starte das Kopplungsfenster am PC erneut.');
      if (result.error === 'verification') throw new Error('Der Familienzugang konnte nicht geprüft oder gespeichert werden. Bitte am PC prüfen lassen.');
      throw new Error('Die Verbindung wurde nicht bestätigt. Bitte am PC prüfen lassen.');
    }
    return result;
  }

  window.fcOpenJarvisConnect = () => {
    document.getElementById('fcJarvisConnect')?.remove();
    const modal = document.createElement('div');
    modal.id = 'fcJarvisConnect';
    modal.className = 'fc9-modal';
    modal.innerHTML = `<section class="fc9-sheet" style="max-width:520px;box-sizing:border-box">
      <div class="fc9-sheet-head"><div><small>DEIN PRIVATER ASSISTENT</small><h2>Jarvis verbinden</h2></div><button class="fc9-close" type="button" aria-label="Schliessen">×</button></div>
      <p style="font-size:15px;line-height:1.5">Verbinde diese Familienzentrale mit Jarvis auf deinem PC. Jarvis kann deine Termine lesen und nach deiner Bestätigung neue eintragen.</p>
      <p style="font-size:14px;line-height:1.5">Öffne am PC das Kopplungsfenster und schalte auf dem iPhone Tailscale ein. Trage dann den sechsstelligen PC-Code ein.</p>
      <form><label for="fcJarvisPairCode" style="display:block;font-size:14px;font-weight:700;margin:16px 0 8px">Code vom PC</label>
      <input id="fcJarvisPairCode" type="text" inputmode="numeric" autocomplete="off" pattern="[0-9]{6}" minlength="6" maxlength="6" required placeholder="000000" style="box-sizing:border-box;width:100%;min-height:48px;font-size:24px;letter-spacing:.2em;padding:10px 12px;border:1px solid #c8d1dd;border-radius:12px">
      <p data-pair-status role="status" aria-live="polite" style="font-size:14px;line-height:1.5;min-height:24px"></p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button data-pair-submit type="submit" style="min-height:48px;flex:1;border:0;border-radius:12px;background:#263a67;color:white;font-size:16px;font-weight:700;padding:12px">Jetzt verbinden</button><button data-close type="button" style="min-height:48px;border:1px solid #c8d1dd;border-radius:12px;background:white;font-size:16px;padding:12px">Schliessen</button></div></form>
      <p style="font-size:12px;color:#64748b;line-height:1.5;margin-top:16px">Dein gespeicherter Zugang wird verschlüsselt direkt an deinen PC übertragen. Er wird nicht im Chat oder auf dieser Seite angezeigt.</p>
    </section>`;
    let controller = null;
    const close = () => { controller?.abort(); modal.remove(); };
    modal.querySelector('.fc9-close').onclick = close;
    modal.querySelector('[data-close]').onclick = close;
    modal.onclick = event => { if (event.target === modal) close(); };
    const form = modal.querySelector('form');
    const input = modal.querySelector('input');
    const button = modal.querySelector('[data-pair-submit]');
    const status = modal.querySelector('[data-pair-status]');
    form.onsubmit = async event => {
      event.preventDefault();
      if (button.disabled || !form.reportValidity()) return;
      if (!accessKey()) {
        status.textContent = 'Hier ist kein Familienzugang gespeichert. Öffne diese Funktion in der installierten Familien-App mit deinen Terminen.';
        return;
      }
      button.disabled = true;
      input.disabled = true;
      button.textContent = 'Verbinde …';
      status.textContent = 'Verbindung mit deinem PC wird geprüft …';
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 70000);
      try {
        const challenge = await request('/challenge', {code: input.value}, controller.signal);
        if (typeof challenge.challenge !== 'string' || !/^[A-Za-z0-9_-]{40,64}$/.test(challenge.challenge)) throw new Error('Die PC-Antwort ist ungültig. Es wurde kein Zugang übertragen.');
        const result = await request('/connect', {challenge: challenge.challenge, access: accessKey()}, controller.signal);
        if (result.stored !== true) throw new Error('Der PC hat das Speichern nicht bestätigt. Bitte am PC prüfen lassen.');
        input.value = '';
        status.textContent = 'Verbunden. Dein PC hat den Familienzugang geprüft und geschützt gespeichert. Kehre zu Codex zurück; dort werden die Erinnerungen fertig eingerichtet.';
        button.textContent = 'Verbunden';
      } catch (error) {
        if (!modal.isConnected) return;
        status.textContent = error instanceof TypeError || error?.name === 'AbortError'
          ? 'Der PC ist nicht erreichbar oder die Antwort fehlt. Prüfe Tailscale und das Kopplungsfenster. Falls der PC bereits „gespeichert“ meldet, ist die Übertragung fertig.'
          : String(error?.message || 'Verbindung fehlgeschlagen.');
        button.disabled = false;
        input.disabled = false;
        button.textContent = 'Erneut verbinden';
      } finally { clearTimeout(timeout); }
    };
    document.body.appendChild(modal);
    input.focus();
  };
})();
