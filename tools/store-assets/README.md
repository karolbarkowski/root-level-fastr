# Store assets

Renders the Play Store promo video, phone screenshots and feature graphic from HTML templates.
Output goes straight to `assets/play-store-images/`.

| File | Produces |
| --- | --- |
| `promo.html` | `fastr-promo.mp4`: the screen recording in a phone with gentle 3D motion, then the logo animation |
| `store.html` | `Store_Phone1-4.png` (1080×1920) and `main.jpg` (1024×500) from the raw screenshots `1.png`–`4.png` |
| `recording/app-walkthrough.mp4` | Source screen recording for the video |

## Setup

```bash
npm run setup
```

Installs its own dependencies (kept separate from the app) and Playwright's Chromium.
To use an existing Chrome instead, set `CHROME_PATH` to its executable.

## Screenshots and feature graphic

Replace `assets/play-store-images/1.png`–`4.png` with fresh screenshots, then:

```bash
npm run store
```

Headlines and subtitles are in the `SHOTS` table at the bottom of `store.html`.

## Video

```bash
npm run screen
npm run video
```

`screen` cuts the recording into frames; which moments are used (and the slow-down / hold)
is set in `SCREEN_FILTER` in `render.js`. `npm run stills -- 2 7.5` renders single frames
to `build/` for checking. Camera angles over time are the `POSES` table in `promo.html`.

### New recording

Record at the screen's aspect ratio (the default resolution fails on some phones):

```bash
adb shell screenrecord --size 864x1920 --bit-rate 20000000 --time-limit 150 /sdcard/take.mp4
```

In Git Bash, prefix `adb` commands with `MSYS_NO_PATHCONV=1` so `/sdcard` isn't rewritten.
Save it as `recording/app-walkthrough.mp4`, update the trim times in `SCREEN_FILTER`, run
`npm run screen`, and set `FRAME_COUNT` in `promo.html` to the frame count it prints.
