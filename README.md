# Ranch Spotify

An unofficial Spotify app for Windows, Android and iPhone without ads, part of the Ranch apps. It runs Spotify's own web player and works with free and Premium accounts. Install and update it yourself, or through the [Ranch Launcher](https://github.com/KingCreeper531/ranch-launcher).

It's called Ranch Spotify so it never gets in the way of the official Spotify app: both can be installed side by side.

## Features

- **No ads.** Stops Spotify loading audio ads, banner ads and sponsored songs. If an ad still gets through, it plays muted.
- **No Premium upsells.** Hides "Explore Premium", "Upgrade" and "Install app" buttons and the Premium pop-ups.
- **Music only (optional).** Hides podcast and audiobook shelves and filters.
- **Sleep timer.** The moon button (or the tray menu) pauses the music after 15 minutes to 1½ hours, or at the end of the song, fading out over the last 30 seconds.
- **Song notifications** in Windows when the next song starts and the window isn't in front.
- **Taskbar controls.** Previous, play/pause and next buttons on the taskbar preview, and in the tray menu. Media keys on your keyboard work too.
- **Keeps playing in the tray** when you close the window.
- **Clean share links.** Copied links lose Spotify's tracking code (`?si=…`).
- **Blocks trackers** (EasyList, EasyPrivacy and Spotify's listening analytics).
- **Settings** from the gear button at the top or **Ctrl+,**. The Ranch Launcher can change the same settings.
- **Auto-update** with a green **Update** button.

It doesn't unlock Premium-only features (like unlimited skips on a free account): those are Spotify's paid plan, not ads.

## Download

Get the latest release from the [Releases page](https://github.com/KingCreeper531/spotify-desktop/releases/latest):

- `Ranch-Spotify-Setup-x.y.z.exe`: Windows installer. It updates itself. Windows SmartScreen may warn because the app isn't code-signed: click **More info**, then **Run anyway**.
- `Ranch-Spotify-Android-x.y.z.apk`: Android app (Android 8 or newer). Spotify's phone website only plays previews, so the app opens Spotify's desktop site; pinch to zoom. Open the file on your phone to install; it updates itself.
- `Ranch-Spotify-iOS-x.y.z.ipa`: iPhone and iPad app. It's unsigned, so install it with [AltStore](https://altstore.io) or [Sideloadly](https://sideloadly.io) using your Apple ID (a free one works). If Spotify won't play on the iPhone itself, it still works as a remote: pick your PC or speaker from Spotify's device button.

Signing in: use your Spotify email and password, or "Continue with Facebook / Apple". If your account uses "Continue with Google", choose **Log in without password** to get a code by email instead, because Google doesn't allow its sign-in inside apps.

## Build it yourself

```
npm install
npm start          # run it
npm run dist       # build the installer into dist/
npm run release    # build and publish a GitHub release (needs the GitHub CLI); GitHub then builds the .ipa
```

Spotify's music is copy-protected, so the Windows app is built on [castlabs' Electron](https://github.com/castlabs/electron-releases), which includes Google's Widevine player. The page cleanup lives in `src/preload.js`, and the taskbar, tray, notifications and sleep timer in `src/spotify-main.js`. `scripts/make-ios-script.js` turns the page cleanup into the phone apps' `ios/Web/inject.js`.
