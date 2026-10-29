const {test, expect} = require('@playwright/test');
const fs = require('fs');
for (const width of [320, 1440]) {
  test(`public layouts at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});
    await page.route('https://**/*', route => route.abort());
    for (const file of fs.readdirSync('.').filter(f=>f.endsWith('.html'))) {
      await page.goto('/'+file);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),file).toBe(true);
    }
  });
}
test('announcement formatting strips active markup and unsafe URLs',async ({page})=>{
  await page.route('https://**/*',route=>route.abort());
  await page.goto('/index.html');
  const result=await page.evaluate(()=>safeAnnouncementHTML('<strong>Notice</strong><img src=x onerror=alert(1)><script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(1)">link</a>'));
  expect(result).toBe('<strong>Notice</strong><a>link</a>');
});
