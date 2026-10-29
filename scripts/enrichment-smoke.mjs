import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.HOMEBUYER_BASE_URL || 'http://localhost:3000';
const snapshot = JSON.parse(await readFile('src/lib/municipal-snapshot.json', 'utf8'));
const browser = await chromium.launch({
  executablePath:
    process.env.HOMEBUYER_CHROMIUM_PATH ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
// Exercise the recorded SARS table at its research date; timers run normally.
await page.clock.setFixedTime(new Date('2026-10-13T12:00:00Z'));
page.on('pageerror', (error) => errors.push(error.message));
// The financial story must work during provider outages, using the shipped snapshot.
await page.route('**/*', (route) =>
  new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort(),
);
await mkdir('test-results', { recursive: true });

try {
  await page.goto(`${base}/check/?tab=evidence`, { waitUntil: 'networkidle' });
  const municipalPanel = page.locator('.municipal-panel').filter({
    has: page.getByText('MUNICIPAL FINANCES', { exact: true }),
  });
  await page.waitForSelector('.municipal-indicator');
  assert.equal(await municipalPanel.count(), 1);
  assert.equal(await municipalPanel.locator('.municipal-indicator').count(), 7);
  assert.ok(
    (await municipalPanel.textContent()).includes(
      `${snapshot.municipalities.CPT.indicators.cash_coverage.values[0].value.toFixed(1)} months`,
    ),
  );
  const latestAudit = snapshot.municipalities.CPT.audits[0].year;
  assert.ok(
    (await municipalPanel.textContent()).includes(
      `FY ${latestAudit - 1}/${String(latestAudit).slice(-2)}`,
    ),
  );
  await page.getByText('Audit history & original reports', { exact: true }).click();
  assert.equal(
    await municipalPanel.locator('details').first().locator('li').count(),
    snapshot.municipalities.CPT.audits.length,
  );
  assert.match(
    await municipalPanel.locator('details a').first().getAttribute('href'),
    /^https:\/\/lg.treasury.gov.za\/supportingdocs\/CPT\//,
  );
  await page.screenshot({ path: 'test-results/enriched-evidence-desktop.png', fullPage: true });

  await page.getByRole('tab', { name: 'Ownership budget' }).click();
  await page.waitForSelector('#acquisition-date');
  await page.locator('#acquisition-date').fill('2026-10-12');
  assert.match(await page.locator('.purchase-costs-panel').textContent(), /R63\s200/);
  const monthly = await page.locator('.gauge-wrap strong').textContent();
  await page.locator('#acquisition-date').fill('2026-03-31');
  assert.match(
    await page.locator('.purchase-costs-panel').textContent(),
    /Confirm with conveyancer/,
  );
  await page.locator('#acquisition-date').fill('2026-10-12');
  await page
    .getByRole('checkbox', { name: 'VAT transaction or another possible exemption' })
    .check();
  assert.match(
    await page.locator('.purchase-costs-panel').textContent(),
    /No duty estimate is applied/,
  );
  assert.equal(await page.locator('.gauge-wrap strong').textContent(), monthly);
  await page.getByRole('button', { name: 'Save home', exact: true }).click();
  const report = await page.evaluate(() => JSON.parse(localStorage.getItem('homebuyer:saved'))[0]);
  assert.equal(report.budget.acquisitionDate, '2026-10-12');
  assert.equal(report.budget.transferDutyExempt, true);
  await page
    .getByRole('checkbox', { name: 'VAT transaction or another possible exemption' })
    .uncheck();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report', exact: true }).click();
  await (await pending).saveAs('test-results/enriched-report.pdf');
  await page.reload({ waitUntil: 'networkidle' });
  await page
    .locator('.sidebar')
    .getByRole('button', { name: /Saved homes/ })
    .click();
  await page.getByRole('button', { name: 'Open reality check' }).click();
  await page.getByRole('tab', { name: 'Ownership budget' }).click();
  assert.equal(await page.locator('#acquisition-date').inputValue(), '2026-10-12');
  assert.equal(
    await page
      .getByRole('checkbox', { name: 'VAT transaction or another possible exemption' })
      .isChecked(),
    true,
  );
  await page.screenshot({ path: 'test-results/enriched-budget-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: 'test-results/enriched-budget-mobile.png', fullPage: true });

  const cities = {
    CPT: 'Cape Town',
    JHB: 'Johannesburg',
    ETH: 'Durban',
    TSH: 'Pretoria',
    BUF: 'East London',
    EKU: 'Benoni',
    MAN: 'Bloemfontein',
    NMA: 'Gqeberha',
  };
  for (const [code, city] of Object.entries(cities)) {
    await page.evaluate(
      ({ code, city }) => {
        sessionStorage.setItem(
          'homebuyer:selected',
          JSON.stringify({
            id: `smoke-${code}`,
            address: 'Selected address',
            suburb: 'Selected suburb',
            city,
            lat: -30,
            lng: 25,
            price: 2450000,
            rates: 0,
            levy: 0,
            utilities: 0,
            image: '/images/hero-house.jpg',
            example: false,
            amenities: [],
          }),
        );
      },
      { code, city },
    );
    await page.goto(`${base}/check/?tab=evidence`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.municipal-indicator');
    assert.equal(await page.locator('.municipal-indicator').count(), 7);
    assert.match(
      await municipalPanel.textContent(),
      /Confirm the municipal boundary/,
    );
    assert.equal(
      await municipalPanel.locator(':scope > .source-link').getAttribute('href'),
      snapshot.municipalities[code].source,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    if (snapshot.municipalities[code].indicators.repairs_maintenance_spending.values[0].note)
      assert.match(await page.locator('.evidence-warning').textContent(), /outside 0–100%/);
  }
  await page.screenshot({ path: 'test-results/enriched-evidence-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        passed: [
          'offline evidence',
          'all eight metros',
          'original audit links',
          'financial periods',
          'duty and exemptions',
          'saved tax settings',
          'PDF export',
          'mobile overflow',
          'no runtime errors',
        ],
        screenshots: 'test-results/',
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
