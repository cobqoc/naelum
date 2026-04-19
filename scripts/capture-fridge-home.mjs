#!/usr/bin/env node
/**
 * Vercel Preview URL의 /fridge-home 페이지 스크린샷.
 * 쿠키 배너 자동 dismiss.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const URL = process.argv[2] || 'https://naelum-git-develop-hudadaks-projects.vercel.app/fridge-home';
const OUT = path.join(ROOT, '.fridge-backups/deployed-fridge-home.png');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1500);

// 쿠키 배너 dismiss
try {
  const acceptBtn = page.locator('button', { hasText: /Accept All|모두 수락|Necessary Only/i }).first();
  if (await acceptBtn.count() > 0) {
    await acceptBtn.click();
    await page.waitForTimeout(600);
  }
} catch {}

await page.screenshot({ path: OUT, fullPage: true });
await browser.close();
console.log('→ ' + path.relative(ROOT, OUT));
