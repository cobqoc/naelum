#!/usr/bin/env node
/**
 * 모바일 viewport로 /fridge-home 캡처.
 */
import { chromium, devices } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const URL = process.argv[2] || 'https://naelum-git-develop-hudadaks-projects.vercel.app/fridge-home';
const OUT = path.join(ROOT, '.fridge-backups/deployed-mobile.png');

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1500);

try {
  const acceptBtn = page.locator('button', { hasText: /Accept All|모두 수락|Necessary Only/i }).first();
  if (await acceptBtn.count() > 0) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }
} catch {}

await page.screenshot({ path: OUT, fullPage: true });
await browser.close();
console.log('→ ' + path.relative(ROOT, OUT));
