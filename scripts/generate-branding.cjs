/** Export native branding from the two SVG masters. Run: npm run branding.
 * To redraw the wordmark from a locally licensed font: node scripts/generate-branding.cjs --font <font.ttf>
 * The outlined wordmark is committed, so a font installation is not needed for normal exports.
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const file = name => path.join(root, name);
const write = (name, content) => fs.writeFileSync(file(name), content + '\n');
const bg = '#262422';
const ink = '#EEEAE5';
const fontArg = process.argv.indexOf('--font');
if (fontArg !== -1) {
  const bytes = fs.readFileSync(process.argv[fontArg + 1]);
  const font = require('opentype.js').parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const outline = font.getPath('fastr', 0, 0, 100, { kerning: true });
  const box = outline.getBoundingBox();
  write(
    'assets/fastr-wordmark.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x1} ${box.y1} ${box.x2 - box.x1} ${
      box.y2 - box.y1
    }"><path fill="${ink}" d="${outline.toPathData(3)}"/></svg>`,
  );
}
const symbol = fs.readFileSync(file('assets/fastr-symbol.svg'), 'utf8');
const mark = symbol.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '');
const wordmark = fs.readFileSync(file('assets/fastr-wordmark.svg'), 'utf8');
const svg = (body, w = 108, h = w) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
// All adaptive foreground content stays inside Android's central 66dp safe zone.
const foreground = svg(`<g transform="translate(21 28.2) scale(.2578125)">${mark}</g>`);
const legacy = svg(
  `<rect width="108" height="108" rx="23" fill="${bg}"/><g transform="translate(18 25.875) scale(.28125)">${mark}</g>`,
);
const round = svg(
  `<circle cx="54" cy="54" r="54" fill="${bg}"/><g transform="translate(18 25.875) scale(.28125)">${mark}</g>`,
);
const storeIcon = svg(
  `<rect width="108" height="108" fill="${bg}"/><g transform="translate(18 25.875) scale(.28125)">${mark}</g>`,
);
const densities = { ldpi: 0.75, mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const raster = (source, name, size) => sharp(Buffer.from(source)).resize(size, size).png().toFile(file(name));
const nativePaths = [...mark.matchAll(/<path fill="([^"]+)" d="([^"]+)"\s*\/>/g)];
const vector = (width, height, viewportWidth, viewportHeight, body) =>
  `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="${width}dp" android:height="${height}dp" android:viewportWidth="${viewportWidth}" android:viewportHeight="${viewportHeight}">${body}</vector>`;
const paths = monochrome =>
  nativePaths
    .map(([, color, d]) => `<path android:fillColor="${monochrome ? '#FFFFFF' : color}" android:pathData="${d}"/>`)
    .join('\n');
write(
  'android/app/src/main/res/drawable/splash_logo.xml',
  vector(130, 130, 256, 256, `<group android:translateY="28">${paths(false)}</group>`),
);
write(
  'android/app/src/main/res/drawable/ic_launcher_monochrome.xml',
  vector(
    108,
    108,
    108,
    108,
    `<group android:translateX="21" android:translateY="28.2" android:scaleX="0.2578125" android:scaleY="0.2578125">${paths(
      true,
    )}</group>`,
  ),
);
write(
  'android/app/src/main/res/values/colors.xml',
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="splash_background">${bg}</color>\n    <color name="ic_launcher_background">${bg}</color>\n</resources>`,
);
(async () => {
  for (const [density, scale] of Object.entries(densities)) {
    const dir = `android/app/src/main/res/mipmap-${density}`;
    await raster(foreground, `${dir}/ic_launcher_foreground.png`, Math.round(108 * scale));
    await raster(legacy, `${dir}/ic_launcher.png`, Math.round(48 * scale));
    await raster(round, `${dir}/ic_launcher_round.png`, Math.round(48 * scale));
  }
  await raster(
    svg(`<g transform="translate(21 28.2) scale(.2578125)">${mark}</g>`),
    'assets/play-store-images/splash_logo.png',
    512,
  );
  await raster(storeIcon, 'assets/play-store-images/app-icon.png', 512);
  await sharp(Buffer.from(wordmark))
    .resize(427, 159, { fit: 'contain', background: '#00000000' })
    .png()
    .toFile(file('assets/logo.png'));
  const viewbox = wordmark.match(/viewBox="([^"]+)"/)[1];
  const wordPaths = wordmark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '');
  const lockup = svg(
    `<g transform="translate(0 22) scale(.64)">${mark}</g><svg x="190" y="37" width="305" height="126" viewBox="${viewbox}">${wordPaths}</svg>`,
    512,
    200,
  );
  write('assets/fastr-lockup.svg', lockup);
  await sharp(Buffer.from(lockup)).png().toFile(file('assets/fastr-lockup.png'));
  console.log('Exported Android launcher icons, splash, monochrome icon, wordmark, lockup and Play Store icon.');
})();
