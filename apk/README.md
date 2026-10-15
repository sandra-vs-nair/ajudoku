# Ajudoku Android APK

WebView wrapper for the Ajudoku HTML game.

## Quick build (macOS)

1. Install **JDK 17** and the **Android SDK** (easiest: [Android Studio](https://developer.android.com/studio)).
2. Set `ANDROID_HOME` if needed (Studio default on Mac):
   ```bash
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   ```
3. From this folder:
   ```bash
   chmod +x build-apk.sh sync-www.sh
   ./build-apk.sh
   ```
4. Install on a device:
   ```bash
   adb install -r ajudoku-debug.apk
   ```

Output: **`ajudoku-debug.apk`** in this directory.

## What it does

- Copies `index.html`, scripts, images, GIFs, and `marriage.mov` into the app assets.
- Opens the game full-screen in a WebView with `localStorage` and autoplay-friendly video settings.

## Wedding video on Android

Some phones do not play `.mov` in WebView. If the wedding clip is blank, convert it to H.264 `.mp4` and add a second `<source>` in `index.html`, then run `./sync-www.sh` again.
