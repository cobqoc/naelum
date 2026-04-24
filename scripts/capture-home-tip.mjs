#!/usr/bin/env node
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function capture(viewport, outFile) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.removeItem('naelum_seen_home_tip'); } catch {}
  });
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  try {
    const accept = page.locator('button', { hasText: /Accept All|모두 수락|Necessary Only/i }).first();
    if (await accept.count() > 0) { await accept.click(); await page.waitForTimeout(400); }
  } catch {}
  await page.waitForTimeout(1500);
  const out = path.join(ROOT, outFile);
  await page.screenshot({ path: out, fullPage: false });
  await browser.close();
  console.log('→ ' + path.relative(ROOT, out));
}

await capture({ width: 1280, height: 900 }, '.fridge-backups/home-tip-desktop.png');
await capture({ width: 390, height: 844 }, '.fridge-backups/home-tip-mobile.png');
