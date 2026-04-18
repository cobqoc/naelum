#!/usr/bin/env node
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HTML = 'file://' + path.join(ROOT, 'fridge-preview.html');
const OUT = process.argv[2] || path.join(ROOT, '.fridge-backups/current.png');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(HTML, { waitUntil: 'networkidle' });
await page.locator('.wrap').screenshot({ path: OUT });
await browser.close();
console.log('saved →', path.relative(ROOT, OUT));
