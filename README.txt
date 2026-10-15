AJUDOKU
=======

Logic puzzle game: place one Aju per row, column, and colored region.
Ajus must not touch (including diagonally). Help Aju from 2015 through 2024
to marry Kunju.


PLAY IN BROWSER
---------------
Open index.html in a modern browser (Chrome, Safari, Firefox).
No server required — works from file:// on your computer.


MAIN FILES
----------
  index.html, game.js, levels.js, style.css  — game
  aju-face.png, aju-face-angry.png           — Aju faces
  maroon-shirt-funny-dance.gif               — win celebration (levels 1–9)
  marriage.MOV (bundled as marriage.mov)     — wedding video (level 10 win)

  build-levels.py  — regenerate levels.js (optional, for developers)


ANDROID APK
-----------
  apk/ajudoku.apk          — install on phone (copy file, tap to install)
  apk/build-apk.sh         — rebuild after game changes
  apk/sync-www.sh          — copies web files into the Android project
  apk/README.md            — more detail on building the APK

After editing the game, run from the apk folder:
  ./build-apk.sh


PROGRESS
--------
The game saves progress in the browser (localStorage key: ajudoku-progress-v1).
The Android app uses the same storage inside WebView.
