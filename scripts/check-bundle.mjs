import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const jsFiles = [];
page.on('response', (r) => {
  const u = r.url();
  if (u.includes('/_next/static/chunks/app/fridge-home') || u.match(/fridge.*\.js/)) {
    jsFiles.push(u);
  }
});
await page.goto('https://naelum-git-develop-hudadaks-projects.vercel.app/fridge-home', { waitUntil: 'networkidle', timeout: 20000 });
console.log('Current URL:', page.url());
console.log('Fridge JS files:');
jsFiles.forEach(f => console.log(' ', f));
await browser.close();
