const { chromium } = require('@playwright/test');
const fs = require('fs');
(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 320, height: 844 } });
  await page.route('https://**/*', r => r.abort());
  for (const route of ['contact.html', 'index.html', 'events.html', 'admin/announcements.html']) {
    await page.goto('http://127.0.0.1:4173/' + route);
    console.log(route, await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed').map(el => ({tag:el.tagName, cls:el.className, width:Math.round(el.getBoundingClientRect().width)})).slice(0, 15)));
    if (route === 'index.html') await page.locator('#october-30-event').evaluate(el => el.scrollIntoView({block:'start', behavior:'instant'}));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'artifacts/' + route.replace('/', '-') + '.png' });
  }
  await browser.close();
})();
