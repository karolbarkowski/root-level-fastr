# Publishing FastR to Google Play

State of the project as of 2026-07-02 — what's ready, what's missing, and the
full path from zero (no developer account) to a live store listing.

## Readiness audit

Already in place:

| Item | Status |
| --- | --- |
| `applicationId` | `com.fastr` — permanent once published, cannot be changed |
| `versionCode 1` / `versionName "1.0"` | fine for a first upload; bump `versionCode` on **every** upload |
| `targetSdkVersion 36` / `minSdkVersion 24` | exceeds Play's current target-API requirement |
| Permissions | `INTERNET` only — no sensitive permissions, simplest possible review |
| Release keystore | `android/app/fastr-prod.keystore` exists and is gitignored |
| R8/ProGuard + resource shrinking | enabled for release builds |
| Launcher icons | all densities + adaptive icon (`mipmap-anydpi-v26`) |
| Splash | dark, vector logo |

Missing / to do before shipping:

1. **Signing secrets** — release builds read two properties that don't exist yet
   (there is no `C:\Users\<you>\.gradle\gradle.properties`). See step 1.
   ⚠️ If you don't remember the passwords for `fastr-prod.keystore`, generate a
   fresh keystore NOW (step 1b) — before the first upload it costs nothing.
2. **Release build never verified** — run step 2 and smoke-test on the phone.
3. **Store listing assets** (step 5): 512×512 icon PNG, 1024×500 feature
   graphic, 2+ phone screenshots, short + full description.
4. **Privacy policy URL** — required by Play even though FastR collects nothing.
   A one-page "this app stores data only on your device" policy hosted anywhere
   public (GitHub Pages works) is enough.

## Step 1 — signing secrets (one-time)

Create `C:\Users\<you>\.gradle\gradle.properties` (NOT the project one) with:

```properties
FASTR_PROD_STORE_PASSWORD=<store password>
FASTR_PROD_KEY_PASSWORD=<key password>
```

The build fails with a clear message if they're missing. Never commit these.

### Step 1b — only if the keystore passwords are unknown

```powershell
keytool -genkeypair -v -keystore android\app\fastr-prod.keystore `
  -alias fastr-prod -keyalg RSA -keysize 2048 -validity 10000
```

(`keytool` ships with the JDK.) Then fill step 1 with the new passwords.

**Back up the keystore file and passwords somewhere safe** (password manager +
offline copy). With Play App Signing (step 4) a lost *upload* key is
recoverable via support, but it's painful — don't rely on it.

## Step 2 — build and verify the release bundle

```powershell
# Play Store artifact (AAB):
& android\gradlew.bat -p android bundleRelease
# → android\app\build\outputs\bundle\release\app-release.aab
```

Before uploading anything, smoke-test the release build on the phone — it runs
minified, without Metro, with the bundled JS:

```powershell
& android\gradlew.bat -p android installRelease
```

Check: timer starts/stops, panels slide, history persists across an app kill,
rotation works. R8 minification is the usual source of release-only crashes —
if anything crashes, `adb logcat` will show the missing-class stack.

Note (from this machine's history): never run two Gradle builds at once, and if
C++ link errors about "unknown file type" appear, delete
`android\app\.cxx` + `android\app\build` and rebuild.

## Step 3 — create the Google Play developer account

1. Go to https://play.google.com/console/signup
2. Sign in with the Google account you want to own the app long-term.
3. Choose **personal** account (organization requires a D-U-N-S number).
4. Pay the **one-time $25 USD** registration fee.
5. Complete **identity verification** (ID document; can take a few days).

⚠️ **Personal-account testing requirement**: accounts created after Nov 2023
must run a **closed test with a minimum number of opted-in testers (12 at last
check) for 14 consecutive days** before they can apply for production access.
The Console shows the exact current numbers. Plan for this ~2-3 week runway —
recruit friends/family as testers early.

## Step 4 — create the app in Play Console

1. **All apps → Create app**: name "FastR", default language, App (not game),
   Free. (Free can never become Paid later.)
2. Accept **Play App Signing** (default) — Google keeps the app signing key,
   your keystore becomes the upload key.
3. Work through **Dashboard → Set up your app**:
   - **Privacy policy** — the URL from the readiness list.
   - **App access** — "all functionality available without special access".
   - **Ads** — no ads.
   - **Content rating** — questionnaire; FastR has nothing sensitive → Everyone.
   - **Target audience** — 18+ (or 13+; picking under-13 triggers family policy).
   - **Data safety** — declare **no data collected, no data shared** (history
     lives only in local AsyncStorage). Play may also ask for the **Health
     apps** declaration since fasting counts as health & fitness — answer that
     the app does not provide medical advice.
   - **App category** — Health & Fitness.

## Step 5 — store listing assets

| Asset | Spec | Notes |
| --- | --- | --- |
| App icon | 512×512 PNG, ≤1 MB | render from `assets/fastr-symbol.svg` on the periwinkle tile |
| Feature graphic | 1024×500 PNG/JPG | required; dark backdrop + lotus + "FASTR" wordmark |
| Phone screenshots | 2–8, portrait 9:16 | `adb exec-out screencap` from the device (1080×2400) is fine |
| Short description | ≤80 chars | e.g. "A minimalist fasting timer. No ads, no tracking, no account." |
| Full description | ≤4000 chars | features + the privacy stance |

## Step 6 — upload and roll out

1. **Testing → Closed testing → Create track/release**, upload
   `app-release.aab`, add release notes, add your testers' emails (or a Google
   Group), roll out.
2. Testers opt in via the link Play generates, install from Play, and must stay
   opted in for the full 14 days.
3. After the window, **apply for production access** (Console will prompt),
   then **Production → Create release**, reuse the same AAB or a newer one
   (bump `versionCode` if newer), submit for review.
4. First review typically takes a few days; subsequent updates are faster.

## Every future update

1. Bump `versionCode` (must strictly increase) and `versionName` in
   `android/app/build.gradle`.
2. `& android\gradlew.bat -p android bundleRelease`
3. Upload the new AAB to the track, add release notes, roll out.
