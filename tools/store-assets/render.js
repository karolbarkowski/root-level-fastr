/**
 * Renders Play Store assets from the HTML templates in this folder.
 *
 *   node render.js screen          cut recording/app-walkthrough.mp4 into build/screen/*.jpg
 *   node render.js video           promo.html  -> assets/play-store-images/fastr-promo.mp4
 *   node render.js stills 2 7.5    promo.html  -> build/still-<t>.png at those seconds
 *   node render.js store           store.html  -> assets/play-store-images/Store_Phone1-4.png + main.jpg
 *
 * `video` and `stills` need `screen` to have run first.
 * Set CHROME_PATH to use a specific Chrome/Chromium instead of Playwright's own.
 */
const { chromium } = require('playwright-core');
const ffmpeg = require('ffmpeg-static');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30;
const HERE = __dirname;
const BUILD = path.join(HERE, 'build');
const OUT = path.join(HERE, '..', '..', 'assets', 'play-store-images');

/**
 * Which parts of the recording end up in the video, in source seconds.
 * The source is a variable-frame-rate phone capture, so it's normalised to 60fps
 * before trimming. Crop removes the status bar and navigation buttons (864x1920 capture).
 */
const SCREEN_FILTER = [
  '[0:v]fps=60,crop=864:1742:0:70,scale=1000:-2:flags=lanczos,split=4[a][b][c][d]',
  '[a]trim=4.25:7.0,setpts=PTS-STARTPTS[A]', // app entry animation
  '[b]trim=13.35:15.6,setpts=(PTS-STARTPTS)/0.75[B]', // dial drag at 75% speed
  '[c]trim=15.6:16.9,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=0.4[C]', // history opens, short hold
  '[d]trim=16.9:18.1,setpts=PTS-STARTPTS[D]', // history closes
  `[A][B][C][D]concat=n=4,fps=${FPS}[out]`,
].join(';');

const pageUrl = (file, query = '') => 'file:///' + path.join(HERE, file).replace(/\\/g, '/') + query;

async function launch() {
  return chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--allow-file-access-from-files'],
  });
}

function screen() {
  const dir = path.join(BUILD, 'screen');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const args = ['-loglevel', 'error', '-y', '-i', path.join(HERE, 'recording', 'app-walkthrough.mp4'),
    '-filter_complex', SCREEN_FILTER, '-map', '[out]', '-q:v', '2', path.join(dir, '%04d.jpg')];
  const result = spawnSync(ffmpeg, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error('ffmpeg failed');
  }
  const count = fs.readdirSync(dir).length;
  console.log(`wrote ${count} frames to ${dir}`);
  console.log(`if the count changed, set FRAME_COUNT = ${count} in promo.html`);
}

async function openPromo(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pageUrl('promo.html'));
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function video() {
  const browser = await launch();
  const page = await openPromo(browser);
  const out = path.join(OUT, 'fastr-promo.mp4');
  const enc = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round((await page.evaluate(() => window.DURATION)) * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.render(t), i / FPS);
    const png = await page.screenshot({ type: 'png' });
    if (!enc.stdin.write(png)) {
      await new Promise(resolve => enc.stdin.once('drain', resolve));
    }
  }
  enc.stdin.end();
  await new Promise(resolve => enc.on('close', resolve));
  await browser.close();
  console.log(`wrote ${out} (${frames} frames)`);
}

async function stills(times) {
  fs.mkdirSync(BUILD, { recursive: true });
  const browser = await launch();
  const page = await openPromo(browser);
  for (const t of times) {
    await page.evaluate(s => window.render(s), Number(t));
    const file = path.join(BUILD, `still-${t}.png`);
    await page.screenshot({ path: file });
    console.log('wrote', file);
  }
  await browser.close();
}

async function store() {
  const browser = await launch();
  const shots = [
    ...[1, 2, 3, 4].map(n => ({ query: String(n), width: 1080, height: 1920, file: `Store_Phone${n}.png` })),
    { query: 'main', width: 1024, height: 500, file: 'main.jpg' },
  ];
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
    await page.goto(pageUrl('store.html', `?shot=${shot.query}`));
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    });
    const file = path.join(OUT, shot.file);
    await page.screenshot(shot.file.endsWith('.jpg') ? { path: file, type: 'jpeg', quality: 92 } : { path: file });
    console.log('wrote', file);
    await page.close();
  }
  await browser.close();
}

const [command, ...rest] = process.argv.slice(2);
const commands = { screen, video, stills: () => stills(rest), store };
if (!commands[command]) {
  console.log('usage: node render.js <screen | video | stills <seconds...> | store>');
  process.exit(1);
}
Promise.resolve(commands[command]()).catch(error => {
  console.error(error);
  process.exit(1);
});
