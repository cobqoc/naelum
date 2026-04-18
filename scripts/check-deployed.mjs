#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = 'https://naelum-git-develop-hudadaks-projects.vercel.app/fridge-home';
const OUT = '/Users/obqo/claude/naelum/.fridge-backups/deployed-fridge-home.png';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 1600 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
console.log('final url:', page.url());
await page.screenshot({ path: OUT, fullPage: true });
console.log('saved →', OUT);
await browser.close();
