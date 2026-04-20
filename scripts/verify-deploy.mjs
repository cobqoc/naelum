#!/usr/bin/env node
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const URL = process.argv[2] || 'https://naelum-git-develop-hudadaks-projects.vercel.app/';

const browser = await chromium.launch();

// 1) Desktop screenshot
const ctxD = await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
const pageD = await ctxD.newPage();
pageD.on('pageerror', e => console.log('DESKTOP ERROR:', e.message));
console.log('Loading desktop:', URL);
const respD = await pageD.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => ({ error: e.message }));
console.log('Desktop status:', respD?.status?.() || respD?.error);
await pageD.waitForTimeout(2000);
await pageD.screenshot({ path: path.join(ROOT, '.deploy-desktop.png'), fullPage: false });
console.log('Saved .deploy-desktop.png');

// 2) Mobile screenshot (iPhone 14 Pro viewport)
const ctxM = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
const pageM = await ctxM.newPage();
pageM.on('pageerror', e => console.log('MOBILE ERROR:', e.message));
await pageM.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await pageM.waitForTimeout(2000);
await pageM.screenshot({ path: path.join(ROOT, '.deploy-mobile.png'), fullPage: false });
console.log('Saved .deploy-mobile.png');

// 3) Mobile: open + modal to verify z-index fix
// Try to find + button on shelves. Home page has kitchen shelf with + buttons for empty slots.
// Easier: try clicking the kitchen shelf itself
const shelfBtn = await pageM.$('button[aria-label*="상온 재료"]');
if (shelfBtn) {
  console.log('Found 상온 재료 button, clicking...');
  await shelfBtn.click();
  await pageM.waitForTimeout(800);
  // Click a frequent ingredient to get the "1 추가" button
  // Or just screenshot the modal state
  await pageM.screenshot({ path: path.join(ROOT, '.deploy-mobile-modal.png'), fullPage: false });
  console.log('Saved .deploy-mobile-modal.png (modal opened)');

  // Try selecting a frequent ingredient chip
  const freqBtn = await pageM.$('button:has-text("토마토"), button:has-text("양파"), button:has-text("감자"), [data-frequent-ingredient]');
  if (freqBtn) {
    await freqBtn.click();
    await pageM.waitForTimeout(500);
    await pageM.screenshot({ path: path.join(ROOT, '.deploy-mobile-modal-added.png'), fullPage: false });
    console.log('Saved .deploy-mobile-modal-added.png (ingredient selected)');
  } else {
    console.log('Could not find a frequent ingredient to click');
  }
}

await browser.close();
