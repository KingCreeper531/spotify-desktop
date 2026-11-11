// Everything that makes this app Spotify. The rest of src/ is the shared Ranch web-app core.
// It's called "Ranch Spotify" so it never clashes with the official Spotify app
// (its Start Menu shortcut, its %APPDATA%\Spotify folder and its uninstall entry).
module.exports = {
  name: 'Ranch Spotify',
  appId: 'local.ranch.spotify',
  repo: 'KingCreeper531/spotify-desktop',
  home: 'https://open.spotify.com/',
  partition: 'persist:spotify',
  envPrefix: 'RANCHSP',
  background: '#121212',
  // Sites that stay inside the app; everything else opens in your browser.
  // facebook.com and appleid.apple.com are for "Continue with Facebook / Apple".
  hosts: ['spotify.com', 'scdn.co', 'spotifycdn.com', 'facebook.com', 'apple.com'],

  isRedirect: () => false,

  /** Removes Spotify's share-tracking code (?si=…) from links. */
  cleanOutbound(url) {
    try {
      const u = new URL(url);
      for (const k of ['si', 'utm_source', 'utm_medium', 'utm_campaign', 'nd', 'context']) u.searchParams.delete(k);
      return u.toString();
    } catch { return url; }
  },

  // Spotify's own requests that the general tracker lists would otherwise catch
  neverBlock: /^https:\/\/([\w-]+\.)?(spclient\.wg\.spotify\.com|spclient\.spotify\.com|api-partner\.spotify\.com|api\.spotify\.com|open\.spotify\.com|accounts\.spotify\.com|apresolve\.spotify\.com|[\w-]+\.spotifycdn\.com|[\w-]+\.scdn\.co)\/(?!ads\/|ad-logic\/|gabo-receiver-service\/)/,

  /** Spotify's ad requests, blocked even when the general lists miss them. */
  isAdRequest(url) {
    return /^https:\/\/[\w.-]*spclient[\w.-]*\.spotify\.com\/(ads|ad-logic)\//.test(url)
      || /^https:\/\/(adeventtracker|ads-fa|adstudio-assets)\.spotify\.com\//.test(url)
      || /^https:\/\/([\w-]+\.)?(doubleclick\.net|googlesyndication\.com|googleadservices\.com)\//.test(url);
  },

  /** Window, taskbar, tray and notification extras (src/spotify-main.js). */
  setup: (ctx) => require('./spotify-main').setup(ctx),

  // Settings: shown in the app's settings window and in the Ranch Launcher
  settings: [
    { group: 'Ad blocking' },
    { key: 'blockAds', type: 'toggle', default: true, label: 'Block ads', help: 'Stops Spotify loading audio ads, banner ads and sponsored songs' },
    { key: 'muteAds', type: 'toggle', default: true, label: 'Mute ads that get through', help: 'If an ad still plays, it plays silently' },
    { key: 'networkBlocking', type: 'toggle', default: true, label: 'Block trackers', help: 'EasyList and EasyPrivacy filter lists, plus Spotify\'s listening analytics' },
    { group: 'Clutter' },
    { key: 'hideUpsells', type: 'toggle', default: true, label: 'Hide Premium upsells', help: '"Explore Premium", "Upgrade" and "Install app" buttons and pop-ups' },
    { key: 'hidePodcasts', type: 'toggle', default: false, label: 'Hide podcasts and audiobooks', help: 'Podcast and audiobook shelves and filters on Home and in search, for music only' },
    { group: 'Listening' },
    { key: 'songNotifications', type: 'toggle', default: true, label: 'Song notifications', help: 'Shows the next song in Windows when the window isn\'t in front' },
    { key: 'taskbarControls', type: 'toggle', default: true, label: 'Taskbar controls', help: 'Previous, play/pause and next buttons on the taskbar preview' },
    { key: 'sleepTimerFade', type: 'toggle', default: true, label: 'Fade out the sleep timer', help: 'The sleep timer (moon button or tray menu) lowers the volume over the last 30 seconds before pausing' },
    { group: 'Privacy' },
    { key: 'skipLinkTracking', type: 'toggle', default: true, label: 'Clean share links', help: 'Removes Spotify\'s tracking code (?si=…) from copied and shared links' },
    { group: 'App' },
    { key: 'closeToTray', type: 'toggle', default: true, label: 'Close to tray', help: 'The X button hides the window so the music keeps playing' },
  ],
};
