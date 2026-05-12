import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1600 }, deviceScaleFactor: 3 });
await page.goto('http://localhost:3000/ko', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const svg = await page.$('svg[viewBox="30 -5 540 670"]');
if (!svg) process.exit(1);
const b = await svg.boundingBox();
// Freezer area: y~420-608 in SVG, viewBox=670 total
// y=420 → (420-(-5))/670 = 425/670 = 0.634
// y=608 → 613/670 = 0.915
await page.screenshot({ path: '/tmp/fridge-freezer-zoom.png', clip: { x: b.x, y: b.y + b.height*0.63, width: b.width, height: b.height*0.30 } });
await page.screenshot({ path: '/tmp/fridge-freezer-left.png', clip: { x: b.x, y: b.y + b.height*0.63, width: b.width*0.35, height: b.height*0.30 } });
await page.screenshot({ path: '/tmp/fridge-freezer-right.png', clip: { x: b.x + b.width*0.65, y: b.y + b.height*0.63, width: b.width*0.35, height: b.height*0.30 } });
console.log('rendered');
await browser.close();
