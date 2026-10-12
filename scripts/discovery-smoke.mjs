import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.HOMEBUYER_BASE_URL || 'http://localhost:3000';
const browser = await chromium.launch({
  executablePath: process.env.HOMEBUYER_CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  proxy: process.env.HTTPS_PROXY
    ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }
    : undefined,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [];
context.on('page', (current) => current.on('pageerror', (error) => errors.push(error.message)));
page.on('pageerror', (error) => errors.push(error.message));
await mkdir('test-results', { recursive: true });
const chooseTheme = async (current, name) => {
  await current.getByRole('button', { name: 'Theme settings' }).click();
  await current
    .locator('.theme-popover')
    .getByRole('button', { name: new RegExp(`^${name} `) })
    .click();
};
const themeIs = async (current, theme) =>
  current.waitForFunction((expected) => document.documentElement.dataset.theme === expected, theme);

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await themeIs(page, 'dark');
  assert.equal(await page.locator('html').getAttribute('data-theme-preference'), 'system');
  await page.screenshot({ path: 'test-results/landing-dark.png', fullPage: true });
  await chooseTheme(page, 'Light');
  await themeIs(page, 'light');
  await page.reload({ waitUntil: 'networkidle' });
  await themeIs(page, 'light');
  assert.equal(await page.evaluate(() => localStorage.getItem('homebuyer:theme')), 'light');
  await page.emulateMedia({ colorScheme: 'light' });
  await chooseTheme(page, 'System');
  await themeIs(page, 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await themeIs(page, 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await themeIs(page, 'light');
  await chooseTheme(page, 'Dark');
  const second = await context.newPage();
  await second.goto(base, { waitUntil: 'networkidle' });
  await themeIs(second, 'dark');
  await chooseTheme(page, 'Light');
  await themeIs(second, 'light');
  await chooseTheme(page, 'Dark');
  await second.close();
  await page.goto(`${base}/check/`, { waitUntil: 'networkidle' });
  await themeIs(page, 'dark');
  assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), '#121810');
  assert.equal(await page.locator('meta[name="theme-color"]').count(), 1);
  await page.getByRole('button', { name: 'Make these numbers mine' }).click();
  assert.equal(
    await page.getByRole('dialog').evaluate((dialog) => getComputedStyle(dialog).backgroundColor),
    'rgb(28, 36, 24)',
  );
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'test-results/workspace-dark.png', fullPage: true });
  for (const path of ['/', '/check/', '/methodology/', '/guides/home-ownership-costs/']) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    await page.setViewportSize({ width: 320, height: 812 });
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
    await themeIs(page, 'dark');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/methodology/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-results/methodology-dark-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Theme settings' }).click();
  assert.equal(
    await page.locator('.theme-popover').evaluate((element) => element.matches(':popover-open')),
    true,
  );
  await page.keyboard.press('Escape');
  assert.equal(
    await page.locator('.theme-popover').evaluate((element) => element.matches(':popover-open')),
    false,
  );

  for (const path of [
    '/llms.txt',
    '/LLM.txt',
    '/llms-full.txt',
    '/index.md',
    '/methodology/index.md',
    '/guides/home-ownership-costs/index.md',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.webmanifest',
    '/social-preview/og.png',
  ]) {
    const response = await page.request.get(`${base}${path}`);
    assert.equal(response.status(), 200, path);
    if (path.endsWith('.md') || path.includes('llms'))
      assert.match(await response.text(), /HomeBuyer|South Africa/);
  }
  assert.equal(
    await (await page.request.get(`${base}/LLM.txt`)).text(),
    await (await page.request.get(`${base}/llms.txt`)).text(),
  );
  const png = await (await page.request.get(`${base}/social-preview/og.png`)).body();
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  const withoutJs = await browser.newContext({ javaScriptEnabled: false });
  const document = await withoutJs.newPage();
  await document.goto(`${base}/methodology/`);
  assert.match(await document.locator('main').textContent(), /financial year 2023\/24/);
  assert.match(
    await document.locator('main').textContent(),
    /do not assign an address-level safety score/,
  );
  await document.goto(base);
  const schema = JSON.parse(
    await document.locator('script[type="application/ld+json"]').textContent(),
  );
  assert.equal(
    schema['@graph'].find((value) => value['@type'] === 'WebApplication').offers.price,
    '0',
  );
  await withoutJs.close();
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        passed: [
          'system preference',
          'persisted light and dark',
          'live device preference changes',
          'cross-tab preference sync',
          'theme retained across navigation',
          'dark modal',
          'keyboard dismissal',
          '320px layouts',
          'AI discovery files',
          'social image',
          'server-rendered public documentation',
          'noindex workspace',
          'honest free-MVP schema',
          'no runtime errors',
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
