import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.HOMEBUYER_BASE_URL || 'http://localhost:3000';
const browser = await chromium.launch({
  executablePath:
    process.env.HOMEBUYER_CHROMIUM_PATH ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
  acceptDownloads: true,
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.clock.setFixedTime(new Date('2026-10-14T12:00:00Z'));
await page.route('**/*', (route) =>
  new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort(),
);
await mkdir('test-results', { recursive: true });
const choose = async (address) => {
  await page.getByRole('button', { name: 'Change home', exact: true }).click();
  await page.locator('.modal-examples button').filter({ hasText: address }).click();
};
const save = () => page.getByRole('button', { name: /^(Save home|Update saved)$/ }).click();

try {
  await page.goto(`${base}/check/`, { waitUntil: 'networkidle' });
  await choose('27 Atterbury Road');
  await page.getByRole('tab', { name: 'Ownership budget' }).click();
  await page.getByRole('button', { name: 'Adjust my budget' }).click();
  const dialog = page.getByRole('dialog');
  for (const [key, value] of Object.entries({
    price: 1500000,
    rate: 10,
    years: 20,
    rates: 1800,
    levy: 400,
    utilities: 1200,
    insurance: 650,
    maintenance: 750,
    commuteKm: 0,
    income: 40000,
  })) {
    await dialog.locator(`input[name="${key}"]`).fill(String(value));
  }
  await dialog.locator('#deposit').fill('10');
  await dialog.getByRole('button', { name: 'Use these numbers' }).click();
  assert.match(await page.locator('.scenario-table tbody tr').first().textContent(), /R13\s028/);
  assert.equal(await page.locator('.scenario-table tbody tr').count(), 3);
  assert.match(await page.locator('.upfront-total').textContent(), /incomplete/);
  for (const [key, value] of Object.entries({
    transferFees: 25000,
    bondFees: 22000,
    movingCosts: 5000,
    immediateRepairs: 0,
    otherUpfront: 0,
  })) {
    await page.locator(`input[name="${key}"]`).fill(String(value));
  }
  assert.match(
    await page.locator('.upfront-total').textContent(),
    /Estimated upfront cash.*R210\s700/,
  );
  await page.getByRole('button', { name: /Review the seller’s condition disclosure/ }).click();
  assert.equal(await page.locator('.checklist-item').count(), 8);
  await save();
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem('homebuyer:saved'))[0]);
  assert.equal(first.snapshot.purchase.duty, 8700);
  assert.equal(first.snapshot.purchase.knownSubtotal, 210700);
  assert.equal(first.snapshot.municipality.code, 'TSH');
  assert.equal(first.budget.acquisitionDate, '2026-10-14');
  assert.deepEqual(first.checked, [4]);
  await page.screenshot({ path: 'test-results/decision-budget-desktop.png', fullPage: true });

  for (const address of ['8 Fourth Avenue', '14 Lower Main Road', '22 Chartwell Drive']) {
    await choose(address);
    await save();
  }
  await page
    .locator('.sidebar')
    .getByRole('button', { name: /Saved homes/ })
    .click();
  assert.equal(await page.locator('.saved-card').count(), 4);
  await page.getByRole('button', { name: 'Compare side by side' }).click();
  assert.equal(await page.locator('.comparison-picker input:checked').count(), 3);
  const fourth = page.getByRole('checkbox', { name: /22 Chartwell Drive/ });
  assert.equal(await fourth.isDisabled(), true);
  await page.getByRole('checkbox', { name: /14 Lower Main Road/ }).uncheck();
  await fourth.check();
  assert.equal(await page.locator('.comparison-panel thead th').count(), 4);
  assert.match(await page.locator('.comparison-panel tbody').textContent(), /R210\s700/);
  const compareDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export comparison PDF' }).click();
  const comparison = await compareDownload;
  assert.equal(comparison.suggestedFilename(), 'homebuyer-property-comparison.pdf');
  await comparison.saveAs('test-results/decision-comparison.pdf');
  await page.screenshot({ path: 'test-results/decision-comparison-desktop.png', fullPage: true });
  await page.getByRole('checkbox', { name: /27 Atterbury Road/ }).uncheck();
  await page.getByRole('checkbox', { name: /8 Fourth Avenue/ }).uncheck();
  assert.match(await page.locator('.comparison-panel').textContent(), /Select at least two/);
  assert.equal(await page.locator('.comparison-panel table').count(), 0);

  // A later export must use the saved evidence even after the duty table expires.
  await page.clock.setFixedTime(new Date('2027-06-01T12:00:00Z'));
  await page.reload({ waitUntil: 'networkidle' });
  const menlo = page.locator('.saved-card').filter({ hasText: '27 Atterbury Road' });
  const frozenDownload = page.waitForEvent('download');
  await menlo.getByRole('button', { name: 'Download PDF' }).click();
  const frozen = await frozenDownload;
  await frozen.saveAs('test-results/decision-frozen.pdf');
  const pdfText = (await readFile('test-results/decision-frozen.pdf')).toString('latin1');
  assert.match(pdfText, /R8\s700/);
  assert.ok(pdfText.includes('2026-10-14'));
  await menlo.getByRole('button', { name: 'Open reality check' }).click();
  await page.getByRole('tab', { name: 'Ownership budget' }).click();
  assert.match(
    await page.locator('.purchase-costs-panel').textContent(),
    /Confirm with conveyancer/,
  );
  const retained = await page.evaluate(
    () => JSON.parse(localStorage.getItem('homebuyer:saved'))[0],
  );
  assert.deepEqual(retained, first);
  assert.equal(
    await page
      .getByRole('button', { name: /Review the seller’s condition disclosure/ })
      .getAttribute('aria-pressed'),
    'true',
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Theme settings' }).click();
  await page.getByRole('button', { name: /Dark/ }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: 'test-results/decision-budget-mobile-dark.png', fullPage: true });
  await page.locator('.mobile-bottom-nav').getByRole('button', { name: /Saved/ }).click();
  await page.getByRole('button', { name: 'Compare side by side' }).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({
    path: 'test-results/decision-comparison-mobile-dark.png',
    fullPage: true,
  });
  // Representative provider responses exercise the live address/amenity boundary.
  await page.route('https://photon.komoot.io/api/**', (route) =>
    route.fulfill({
      json: {
        features: [
          {
            geometry: { coordinates: [28.265, -25.774] },
            properties: {
              osm_id: 300,
              countrycode: 'ZA',
              housenumber: '1',
              street: 'Fixture Road',
              locality: 'Menlo Park',
              city: 'Pretoria',
            },
          },
        ],
      },
    }),
  );
  await page.route('https://overpass-api.de/api/interpreter?**', (route) =>
    route.fulfill({
      json: {
        elements: [
          {
            id: 301,
            type: 'way',
            center: { lat: -25.775, lon: 28.265 },
            tags: { name: 'Fixture school', amenity: 'school' },
          },
        ],
      },
    }),
  );
  await page.locator('.mobile-bottom-nav').getByRole('button', { name: 'Find a home' }).click();
  await page
    .getByRole('dialog')
    .getByRole('textbox', { name: 'Search a South African address' })
    .fill('Fixture Pretoria');
  await page.locator('.search-result').filter({ hasText: '1 Fixture Road' }).click();
  await page.getByRole('tab', { name: 'Around the home' }).click();
  await page.getByRole('button', { name: 'Schools', exact: true }).click();
  await page.getByRole('link', { name: /Fixture school/ }).waitFor();
  assert.match(
    await page.locator('.amenities').textContent(),
    /Confirm admissions and catchment.*retrieved 2027-06-01/,
  );
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole('button', { name: 'Green spaces', exact: true }).click();
  assert.match(await page.locator('.amenities').textContent(), /missing data does not mean/);
  await save();
  const live = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('homebuyer:saved')).find((r) => r.property.id === 'osm-300'),
  );
  assert.equal(live.property.amenities[0].category, 'school');
  assert.equal(live.property.amenities[0].retrievedAt, '2027-06-01');
  assert.deepEqual(errors, []);
  console.log(
    'Verified: Pretoria costs → quotes → eight checks → frozen save → selectable three-home comparison → PDF → later re-export → mobile/dark, with external services unavailable.',
  );
} finally {
  await browser.close();
}
