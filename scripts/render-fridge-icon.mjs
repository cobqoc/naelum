import { chromium } from 'playwright';

const fridge = `
<svg viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="60" height="92" rx="6" fill="#e85a3a" stroke="#7a1810" stroke-width="5"/>
  <rect x="4" y="4" width="28" height="62" rx="6" fill="#c93820"/>
  <rect x="4" y="66" width="60" height="4" fill="#7a1810"/>
  <rect x="9" y="14" width="17" height="10" rx="2" fill="#f4c030" stroke="#7a1810" stroke-width="2.5"/>
  <rect x="32" y="4" width="32" height="62" fill="#e8f7ff"/>
  <rect x="55" y="12" width="3" height="16" rx="1" fill="#7a1810" opacity="0.4"/>
  <rect x="59" y="12" width="3" height="16" rx="1" fill="#7a1810" opacity="0.4"/>
  <ellipse cx="47" cy="30" rx="7" ry="5" fill="#e09848" stroke="#7a3c10" stroke-width="2"/>
  <path d="M42 42 L52 42 L50 50 L44 50 Z" fill="#b07840" stroke="#7a1810" stroke-width="2"/>
  <rect x="42" y="52" width="4" height="8" rx="1" fill="#e85040" stroke="#7a1810" stroke-width="2"/>
  <rect x="48" y="52" width="4" height="8" rx="1" fill="#e85040" stroke="#7a1810" stroke-width="2"/>
  <rect x="64" y="4" width="20" height="62" rx="4" fill="#e85a3a" stroke="#7a1810" stroke-width="4"/>
  <rect x="68" y="18" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35"/>
  <rect x="68" y="26" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35"/>
  <rect x="68" y="34" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35"/>
  <rect x="28" y="20" width="8" height="14" rx="4" fill="#7a1810"/>
  <rect x="28" y="42" width="8" height="14" rx="4" fill="#7a1810"/>
  <rect x="4" y="70" width="60" height="26" rx="6" fill="#e85a3a"/>
  <rect x="28" y="80" width="12" height="6" rx="3" fill="#7a1810"/>
</svg>`;

const item = (size, label) => `
  <div style="text-align:center">
    <div style="width:${size}px;height:${size}px;display:inline-block">${fridge.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>
    <div style="margin-top:6px;color:#888;font-size:11px;font-family:system-ui">${label}</div>
  </div>
`;

const html = `<!doctype html><html><body style="margin:0;background:#1a1a1a;padding:40px;display:flex;gap:40px;align-items:flex-end;font-family:system-ui">
  ${item(30, '30px 실제')}
  ${item(60, '60px')}
  ${item(120, '120px')}
  ${item(240, '240px')}
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 620, height: 340 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.screenshot({ path: '/Users/obqo/claude/naelum/.fridge-icon-sizes.png', omitBackground: false });
await browser.close();
console.log('Rendered: .fridge-icon-sizes.png');
