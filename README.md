# Fasting Tracker (React Native, bare CLI, TypeScript)

A single-view, minimalistic fasting tracker:

- Circular 270° gauge with configurable milestone **breakpoints** (`{ hoursIn, icon, effectCode, colorCode }`)
- Big START button in the center; tapping it begins the fast
- While fasting: live elapsed timer in the center, the ring greys out behind your progress
- `−` / `+` stepper to set the target duration (hidden while fasting)
- Start / Target date-time labels
- Ending a fast saves it to the device (AsyncStorage) and shows it in the history list below

## Files

```
App.tsx                  – screen, state machine, persistence wiring
src/types.ts             – Breakpoint / RingConfig / FastEntry / ActiveFast
src/config.ts            – DEFAULT_RING_CONFIG (edit breakpoints here)
src/FastingRing.tsx      – SVG gauge: color segments, grey elapsed overlay, icon markers
src/HistoryList.tsx      – completed fasts list
src/storage.ts           – AsyncStorage helpers
src/format.ts            – date/duration formatting
```

## Setup

Drop these files into a fresh bare RN project (`npx @react-native-community/cli init FastingTracker --version latest`), replacing the generated `App.tsx`, then:

```bash
npm install react-native-svg @react-native-async-storage/async-storage
cd ios && pod install && cd ..   # iOS only
npm run ios    # or: npm run android
```

Both libraries autolink — no manual native config needed.

## How the ring works

- The gauge sweeps 270°, gap at the bottom (start = 135°, clockwise).
- `t = hoursIn / totalHours` maps a breakpoint onto the arc.
- Segments are colored `baseColor` → first breakpoint's `colorCode` → next, etc.
- Icon markers are plain absolutely-positioned `View`s (emoji render reliably this way on both platforms, unlike SVG `<Text>`).
- While running, a grey arc is drawn on top from `t=0` to `t=elapsed/total`.
- `effectCode` is carried in the model but unused for now — wire it to haptics/notifications later.

## Notes / possible next steps

- An active fast survives app restarts (persisted under `fasting:active`).
- If you change the target while idle, breakpoints past `totalHours` are simply not rendered.
- Easy additions: long-press a history row to delete, local notification when a breakpoint is reached (that's what `effectCode` is for), editable start time.
