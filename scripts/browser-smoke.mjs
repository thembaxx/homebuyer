import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.HOMEBUYER_BASE_URL || 'http://localhost:3000';
const executablePath = process.env.HOMEBUYER_CHROMIUM_PATH || '/usr/bin/chromium';
const proxy = process.env.HTTPS_PROXY
  ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }
  : undefined;
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  proxy,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await mkdir('test-results', { recursive: true });

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.match(await page.locator('h1').textContent(), /Fall for the home/);
  assert.equal(
    await page.locator('.hero-photo').evaluate((img) => img.complete && img.naturalWidth > 0),
    true,
  );
  await page.screenshot({ path: 'test-results/landing-desktop.png', fullPage: true });
  await page.getByRole('button', { name: /Take a look inside an example report/ }).click();
  await page.waitForURL('**/check/');
  await page.getByRole('button', { name: 'Make these numbers mine' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('input[name="price"]').fill('2000000');
  await dialog.locator('input[name="rate"]').fill('0');
  await dialog.locator('#deposit').fill('20');
  await dialog.getByRole('button', { name: 'Use these numbers' }).click();
  await page.getByRole('button', { name: /Get the electrical compliance certificate/ }).click();
  await page.getByRole('button', { name: /Experience the neighbourhood/ }).click();
  await page.getByRole('button', { name: 'Save home', exact: true }).click();
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem('homebuyer:saved'))[0]);
  assert.equal(first.budget.price, 2000000);
  assert.equal(first.budget.rate, 0);
  assert.equal(first.budget.deposit, 20);
  assert.deepEqual(first.checked, [0, 3]);
  assert.ok(await page.locator('.gauge-wrap strong').textContent());

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report', exact: true }).click();
  const download = await downloading;
  assert.match(download.suggestedFilename(), /homebuyer-observatory-reality-check\.pdf/);
  await download.saveAs('test-results/observatory-report.pdf');

  await page.getByRole('button', { name: 'Change home', exact: true }).click();
  await page.locator('.modal-examples button').filter({ hasText: '8 Fourth Avenue' }).click();
  await page.getByRole('button', { name: 'Save home', exact: true }).click();
  await page
    .locator('.sidebar')
    .getByRole('button', { name: /Saved homes/ })
    .click();
  await page.getByRole('button', { name: 'Compare side by side' }).click();
  assert.equal(await page.locator('.comparison-panel thead th').count(), 3);
  assert.match(await page.locator('.comparison-panel').textContent(), /14 Lower Main Road/);
  assert.match(await page.locator('.comparison-panel').textContent(), /8 Fourth Avenue/);
  await page.screenshot({ path: 'test-results/comparisons.png', fullPage: true });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.saved-card').count(), 2);
  await page
    .locator('.saved-card')
    .filter({ hasText: '14 Lower Main Road' })
    .getByRole('button', { name: 'Open reality check' })
    .click();
  assert.match(await page.locator('.ownership-panel').textContent(), /0% rate/);
  await page.getByRole('tab', { name: 'Evidence & sources' }).click();
  assert.match(await page.locator('.crime-panel').textContent(), /116/);
  assert.match(await page.locator('.context-warning').textContent(), /don’t measure a street/);
  await page.screenshot({ path: 'test-results/evidence.png', fullPage: true });
  await page.getByRole('tab', { name: 'Overview', exact: true }).click();
  await page
    .waitForFunction(() => document.querySelectorAll('.leaflet-tile-loaded').length > 0, {
      timeout: 20000,
    })
    .catch(() => {});
  const tileCount = await page.locator('.leaflet-tile-loaded').count();
  await page.getByRole('button', { name: 'Switch to evening' }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Switch to daytime' }).getAttribute('aria-pressed'),
    'true',
  );
  await page.getByRole('button', { name: 'Toggle roof cutaway' }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Toggle roof cutaway' }).getAttribute('aria-pressed'),
    'true',
  );
  await page.getByRole('button', { name: 'Reset model' }).click();
  await page.screenshot({ path: 'test-results/workspace-desktop.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: 'test-results/workspace-mobile.png', fullPage: true });
  await page.locator('.mobile-bottom-nav').getByRole('button', { name: /Saved/ }).click();
  assert.equal(await page.locator('.saved-card').count(), 2);
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Toggle navigation' }).getAttribute('aria-expanded'),
    'true',
  );
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.screenshot({ path: 'test-results/landing-mobile.png', fullPage: true });

  const input = page.getByRole('textbox', { name: 'Search a South African address' });
  await input.fill('Observatory');
  await page.locator('.search-result').filter({ hasText: '14 Lower Main Road' }).first().click();
  await page.waitForURL('**/check/');
  assert.match(await page.locator('.property-heading').textContent(), /Observatory/);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        passed: [
          'landing',
          'editable budget',
          'checklist',
          'saved persistence',
          'comparison snapshots',
          'PDF download',
          'sourced precinct series',
          '3D controls',
          'mobile navigation',
          'address selection',
          'no horizontal overflow',
          'no runtime errors',
        ],
        loadedMapTiles: tileCount,
        screenshots: 'test-results/',
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
