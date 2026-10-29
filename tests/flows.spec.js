const { test, expect } = require('@playwright/test');
async function mockBackend(page, { fail = false, signedIn = true } = {}) {
  await page.route('https://**/*', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.route('**/js/firebase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: `
    window.saved = []; window.signedOut = false;
    const firebase = { firestore: { FieldValue: { serverTimestamp: () => 'now' } } };
    const auth = {
      currentUser: ${signedIn ? "{email:'test@example.com',uid:'test'}" : 'null'},
      onAuthStateChanged(cb) { setTimeout(() => cb(this.currentUser), 0); return () => {}; },
      signOut() { window.signedOut = true; return Promise.resolve(); },
      signInWithEmailAndPassword() { return Promise.reject({code:'auth/invalid-credential'}); }
    };
    const db = { collection(name) {
      const records = [{id:'one', data:()=>({title:'Youth assembly',name:'Test Official',position:'Member',category:'Sports',content:'Community update',date:'2026-10-30',status:'upcoming',active:true,order:0})}, {id:'two',data:()=>({title:'Scholarship notice',name:'Second Official',position:'Member',category:'Education',order:1})}];
      const snapshot = {empty:false, docs:records, forEach:cb=>records.forEach(cb)};
      return { orderBy(){return this}, limit(){return this},
        get(){return ${fail ? "Promise.reject(new Error('Offline'))" : 'Promise.resolve(snapshot)'}},
        onSnapshot(cb,error){setTimeout(()=>${fail ? 'error(new Error("Offline"))' : 'cb(snapshot)'},0);return ()=>{}},
        add(payload){window.saved.push(payload);return Promise.resolve()},
        doc(){return {update:payload=>{window.saved.push(payload);return Promise.resolve()},delete:()=>Promise.resolve()}}
      };
    }};
    const storage = { ref(){return {put(){throw new Error('Upload unavailable')}}} };
  ` }));
}
for (const file of ['index','events','announcements','gallery-admin','officials']) {
  test(`admin navigation and data: ${file}`, async ({ page }) => {
    await mockBackend(page);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('/admin/' + file + '.html');
    await page.locator('#adminHamburger').click();
    await expect(page.locator('#adminHamburger')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('#adminHamburger')).toHaveAttribute('aria-expanded', 'false');
    if (file !== 'index') {
      await expect(page.locator('.admin-table tbody tr')).toHaveCount(2);
      await page.getByRole('searchbox').fill(file === 'officials' ? 'Second' : 'Scholarship');
      await expect(page.locator('.admin-table tbody tr:visible')).toHaveCount(1);
      const download = page.waitForEvent('download');
      await page.getByRole('button', {name:'Export visible records'}).click();
      expect((await download).suggestedFilename()).toBe('sk-records.csv');
    }
    expect(errors).toEqual([]);
  });
}
test('announcement save and failed image upload', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/admin/announcements.html');
  await page.locator('#btnAddAnnouncement').click();
  await page.locator('#annTitle').fill('Test notice');
  await page.locator('#annContent').fill('Test content');
  await page.locator('#modalSave').click();
  await expect.poll(() => page.evaluate(() => window.saved.length)).toBe(1);
  await page.locator('#btnAddAnnouncement').click();
  await page.locator('#annTitle').fill('Failed upload');
  await page.locator('#annImageFile').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from('test')});
  await page.locator('#modalSave').click();
  await expect(page.locator('#toastContainer')).toContainText('Your changes have not been saved');
  expect(await page.evaluate(() => window.saved.length)).toBe(1);
  await expect(page.locator('#announcementModal')).toHaveClass(/show/);
});
test('load failures show recovery instead of endless spinner', async ({ page }) => {
  await mockBackend(page, {fail:true});
  await page.goto('/admin/announcements.html');
  await expect(page.locator('#announcementsTableContainer')).toContainText('Unable to load records');
});
test('public notices render at phone width and source link exists', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/index.html');
  await expect(page.locator('#firestoreAnnouncements')).toContainText('Youth assembly');
  await expect(page.locator('#october-30-event a').first()).toHaveAttribute('href', 'https://www.facebook.com/share/p/1KFNXN2iKn/');
  const columns = await page.locator('#firestoreAnnouncements .update-item-row').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(1);
});
test('signed-out admin redirects to login', async ({ page }) => {
  await mockBackend(page, {signedIn:false});
  await page.goto('/admin/events.html');
  await expect(page).toHaveURL(/login.html/);
  await page.getByRole('button', {name:'Show password'}).click();
  await expect(page.locator('#password')).toHaveAttribute('type', 'text');
});
