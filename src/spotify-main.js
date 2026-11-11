// Spotify extras on the Windows side: mutes ads that get through, song notifications,
// play/pause/next buttons on the taskbar preview and the sleep timer.
// The page side (src/preload.js) reports what's playing over 'sp:now-playing'.
const { Notification, nativeImage, net } = require('electron');

// ---------------------------------------------------------------- taskbar button icons
// Small white shapes drawn here, so the app needs no extra image files.
function drawIcon(shapes, size = 32) {
  const S = 4; // supersampling for smooth edges
  const buf = Buffer.alloc(size * size * 4);
  const inside = (x, y) => shapes.some((s) => (s.rect
    ? x >= s.rect[0] && x <= s.rect[2] && y >= s.rect[1] && y <= s.rect[3]
    : pointInPoly(x, y, s.poly)));
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let hits = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        if (inside(((px + (sx + 0.5) / S) / size) * 24, ((py + (sy + 0.5) / S) / size) * 24)) hits++;
      }
      const a = Math.round((hits / (S * S)) * 255);
      const i = (py * size + px) * 4;
      buf[i] = a; buf[i + 1] = a; buf[i + 2] = a; buf[i + 3] = a; // premultiplied white (BGRA)
    }
  }
  return nativeImage.createFromBitmap(buf, { width: size, height: size });
}
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
let ICONS = null;
const icons = () => ICONS || (ICONS = {
  play: drawIcon([{ poly: [[7, 4], [20, 12], [7, 20]] }]),
  pause: drawIcon([{ rect: [6, 4, 10, 20] }, { rect: [14, 4, 18, 20] }]),
  next: drawIcon([{ poly: [[5, 5], [15, 12], [5, 19]] }, { rect: [16, 5, 19, 19] }]),
  prev: drawIcon([{ poly: [[19, 5], [9, 12], [19, 19]] }, { rect: [5, 5, 8, 19] }]),
});

// ---------------------------------------------------------------- setup
function setup({ ipcMain, config, log, getWin, showWindow, refreshTray, ICON }) {
  let now = { title: '', artist: '', art: '', playing: false, isAd: false };
  let mutedForAd = false;
  let lastSongKey = '';
  const sleep = { endsAt: 0, endOfSong: false, timer: null, songKey: '' };

  const send = (channel, arg) => { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send(channel, arg); };
  const control = (what) => send('sp:control', what);

  // ---------------- taskbar buttons
  function updateThumbar() {
    const w = getWin();
    if (!w || w.isDestroyed() || process.platform !== 'win32') return;
    if (!config.get('taskbarControls') || !now.title) { w.setThumbarButtons([]); return; }
    const ic = icons();
    w.setThumbarButtons([
      { tooltip: 'Previous', icon: ic.prev, click: () => control('prev') },
      now.playing
        ? { tooltip: 'Pause', icon: ic.pause, click: () => control('toggle') }
        : { tooltip: 'Play', icon: ic.play, click: () => control('toggle') },
      { tooltip: 'Next', icon: ic.next, click: () => control('next') },
    ]);
  }

  // ---------------- ads that got through: play them silently
  function updateMute() {
    const w = getWin();
    if (!w || w.isDestroyed()) return;
    const want = now.isAd && !!config.get('muteAds');
    if (want && !mutedForAd) { w.webContents.setAudioMuted(true); mutedForAd = true; log('Muted an ad'); }
    else if (!want && mutedForAd) { w.webContents.setAudioMuted(!!process.env.RANCHSP_MUTE); mutedForAd = false; }
  }

  // ---------------- song notifications
  async function notifySong() {
    if (!config.get('songNotifications') || !Notification.isSupported()) return;
    const w = getWin();
    if (w && !w.isDestroyed() && w.isVisible() && w.isFocused()) return; // you're looking at it already
    let icon;
    if (/^https:\/\/i\.scdn\.co\/image\//.test(now.art)) {
      try {
        const res = await net.fetch(now.art);
        if (res.ok) icon = nativeImage.createFromBuffer(Buffer.from(await res.arrayBuffer())).resize({ width: 96, height: 96 });
      } catch { /* no picture then */ }
    }
    const n = new Notification({ title: now.title, body: now.artist, icon: icon || ICON, silent: true });
    n.on('click', () => showWindow());
    n.show();
  }

  // ---------------- sleep timer
  function sleepState() {
    return { endsAt: sleep.endsAt, endOfSong: sleep.endOfSong };
  }
  function setSleep(minutes) {
    clearTimeout(sleep.timer);
    sleep.timer = null;
    sleep.endsAt = 0;
    sleep.endOfSong = false;
    if (minutes === 'song') {
      sleep.endOfSong = true;
      sleep.songKey = lastSongKey;
    } else if (Number(minutes) > 0) {
      sleep.endsAt = Date.now() + Number(minutes) * 60000;
      const fade = config.get('sleepTimerFade') ? 30000 : 0;
      sleep.timer = setTimeout(() => {
        if (fade) send('sp:fade-out', fade);
        sleep.timer = setTimeout(finishSleep, fade);
      }, Math.max(0, Number(minutes) * 60000 - fade));
    }
    log(minutes ? `Sleep timer: ${minutes === 'song' ? 'end of song' : `${minutes} min`}` : 'Sleep timer off');
    send('sp:sleep-state', sleepState());
    refreshTray();
  }
  function finishSleep() {
    sleep.timer = null;
    sleep.endsAt = 0;
    sleep.endOfSong = false;
    send('sp:sleep-now');
    send('sp:sleep-state', sleepState());
    refreshTray();
    log('Sleep timer paused the music');
  }

  ipcMain.on('sp:now-playing', (_e, info) => {
    if (!info || typeof info !== 'object') return;
    const before = now;
    now = {
      title: String(info.title || '').slice(0, 200),
      artist: String(info.artist || '').slice(0, 200),
      art: String(info.art || '').slice(0, 500),
      playing: !!info.playing,
      isAd: !!info.isAd,
    };
    updateMute();
    if (before.playing !== now.playing || before.title !== now.title) { updateThumbar(); refreshTray(); }
    const key = `${now.title}\n${now.artist}`;
    if (now.title && !now.isAd && key !== lastSongKey) {
      const first = !lastSongKey;
      lastSongKey = key;
      if (sleep.endOfSong && sleep.songKey && sleep.songKey !== key) finishSleep();
      else if (sleep.endOfSong && !sleep.songKey) sleep.songKey = key;
      if (!first && now.playing) notifySong();
    }
  });
  ipcMain.on('sp:sleep-set', (_e, minutes) => setSleep(minutes === 'song' ? 'song' : Math.min(600, Math.max(0, Number(minutes) || 0))));
  ipcMain.on('sp:sleep-get', (e) => { e.returnValue = sleepState(); });

  config.onChange((cfg, before) => {
    if (cfg.taskbarControls !== before.taskbarControls) updateThumbar();
    if (cfg.muteAds !== before.muteAds) updateMute();
  });

  // Keeps "minutes left" in the tray menu current
  setInterval(() => { if (sleep.endsAt) refreshTray(); }, 60000);

  const SLEEP_CHOICES = [15, 30, 45, 60, 90];
  return {
    trayItems: () => [
      { label: now.playing ? 'Pause' : 'Play', enabled: !!now.title, click: () => control('toggle') },
      { label: 'Next', enabled: !!now.title, click: () => control('next') },
      { label: 'Previous', enabled: !!now.title, click: () => control('prev') },
      {
        label: sleep.endsAt ? `Sleep timer (${Math.max(1, Math.round((sleep.endsAt - Date.now()) / 60000))} min left)` : sleep.endOfSong ? 'Sleep timer (end of song)' : 'Sleep timer',
        submenu: [
          ...SLEEP_CHOICES.map((m) => ({ label: `${m} minutes`, click: () => setSleep(m) })),
          { label: 'End of this song', click: () => setSleep('song') },
          { type: 'separator' },
          { label: 'Off', enabled: !!(sleep.endsAt || sleep.endOfSong), click: () => setSleep(0) },
        ],
      },
      { type: 'separator' },
    ],
  };
}

module.exports = { setup };
