# Play Store images

The five-petal FastR identity uses an orange center petal, four off-white petals, and the lowercase wordmark.

| File | Purpose | Dimensions |
| --- | --- | --- |
| `app-icon.png` | Opaque square store icon | 512 × 512 |
| `main.jpg` | Wide feature graphic | 1024 × 500 |
| `Store_Phone1.png`–`Store_Phone4.png` | Promotional phone images | 941 × 1672 |
| `1.png` | Duration screen, captured from the updated app | 1080 × 2424 |
| `2.png` | End-time screen, captured from the updated app | 1080 × 2424 |
| `3.png` | Existing history screenshot; no logo is visible | 1080 × 2424 |
| `4.png` | Fasting guide, captured from the updated app | 1080 × 2424 |
| `splash_logo.png` | Transparent symbol export, not the store icon | 512 × 512 |

The promotional artwork and feature graphic were updated with the built-in image-generation editor using `assets/fastr-lockup.png` as the logo reference. The edit prompt replaces every old logo with the five-petal symbol and lowercase wordmark while preserving existing copy, layout, UI, and phone perspective. The banner was exported to its original JPEG dimensions.

`npm run branding` regenerates the Android icons, transparent symbol, store icon, and logo exports from the SVG masters. It does not overwrite screenshots or promotional artwork.
