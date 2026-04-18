#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = 'http://localhost:3000/fridge-home';
const out = (name) => `/Users/obqo/claude/naelum/.fridge-backups/${name}.png`;

const browser = await chromium.launch();

// Desktop
const ctxD = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const pageD = await ctxD.newPage();
await pageD.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await pageD.waitForTimeout(1500);
await pageD.screenshot({ path: out('page-desktop'), fullPage: true });
console.log('saved desktop');

// Mobile (iPhone 14)
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const pageM = await ctxM.newPage();
await pageM.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await pageM.waitForTimeout(1500);
await pageM.screenshot({ path: out('page-mobile'), fullPage: true });
console.log('saved mobile');

await browser.close();
