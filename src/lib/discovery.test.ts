import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { parseSiteOrigin, jsonLd } from './site';
import { llmsIndex, llmsFull } from './discovery';
import { brand } from './brand';

test('canonical origin is explicit and rejects paths, credentials and non-web schemes', () => {
  assert.equal(parseSiteOrigin(undefined), undefined);
  assert.equal(parseSiteOrigin('  '), undefined);
  assert.equal(parseSiteOrigin('https://example.org/'), 'https://example.org');
  for (const input of [
    'javascript:alert(1)',
    'https://user:password@example.org/',
    'https://example.org/subpath/',
    'https://example.org/?query=true',
    'https://example.org/#section',
  ])
    assert.throws(() => parseSiteOrigin(input));
});
test('configured discovery uses the origin and excludes personal reports from the sitemap', () => {
  const code = `const {default:sitemap}=require('./src/app/sitemap.ts'); const {default:robots}=require('./src/app/robots.ts'); const {pageMetadata,structuredData}=require('./src/lib/site.ts'); console.log(JSON.stringify({sitemap:sitemap(),robots:robots(),metadata:pageMetadata('Methodology','Sources','/methodology/','/methodology/index.md'),schema:structuredData()}));`;
  const output = execFileSync(
    process.execPath,
    ['--import', 'tsx', '--input-type=commonjs', '--eval', code],
    {
      cwd: process.cwd(),
      env: { ...process.env, NEXT_PUBLIC_SITE_URL: 'https://example.org' },
      encoding: 'utf8',
    },
  );
  const result = JSON.parse(output);
  assert.equal(result.metadata.title.absolute, `Methodology | ${brand.name}`);
  assert.equal(result.metadata.alternates.canonical, 'https://example.org/methodology/');
  assert.equal(
    result.metadata.openGraph.images[0].url,
    'https://example.org/social-preview/og.png',
  );
  assert.equal(result.robots.sitemap, 'https://example.org/sitemap.xml');
  assert.equal(result.sitemap.length, 3);
  assert.ok(
    result.sitemap.every(
      (entry: { url: string }) =>
        entry.url.startsWith('https://example.org/') && !entry.url.includes('/check/'),
    ),
  );
  const app = result.schema['@graph'].find(
    (entry: { '@type': string }) => entry['@type'] === 'WebApplication',
  );
  assert.equal(app.offers.price, '0');
  assert.equal(app.offers.priceCurrency, 'ZAR');
  assert.equal(app.isAccessibleForFree, true);
  assert.equal(app.aggregateRating, undefined);
});
test('unconfigured previews do not advertise a fabricated canonical origin', () => {
  const code = `const {default:sitemap}=require('./src/app/sitemap.ts'); const {default:robots}=require('./src/app/robots.ts'); const {pageMetadata}=require('./src/lib/site.ts'); console.log(JSON.stringify({sitemap:sitemap(),robots:robots(),metadata:pageMetadata('Methodology','Sources','/methodology/')}));`;
  const output = execFileSync(
    process.execPath,
    ['--import', 'tsx', '--input-type=commonjs', '--eval', code],
    { cwd: process.cwd(), env: { ...process.env, NEXT_PUBLIC_SITE_URL: '' }, encoding: 'utf8' },
  );
  const result = JSON.parse(output);
  assert.deepEqual(result.sitemap, []);
  assert.equal(result.robots.sitemap, undefined);
  assert.equal(result.metadata.alternates, undefined);
  assert.equal(result.metadata.openGraph.url, undefined);
});
test('AI documentation preserves pricing and precinct limitations', () => {
  assert.ok(llmsIndex().startsWith('# '));
  assert.match(llmsIndex(), /free early access/);
  assert.match(llmsIndex(), /no checkout or charges/);
  assert.match(llmsIndex(), /never measures a street/);
  assert.match(llmsFull(), /primary SAPS download was unavailable/);
  assert.match(llmsFull(), /financial year 2023\/24/);
  assert.match(llmsFull(), /Transfer duty, conveyancing, bond registration/);
  assert.match(llmsIndex(), /methodology\/index\.md/);
});
test('JSON-LD cannot close its containing script element', () => {
  const safe = jsonLd({ name: '</script><script>alert(1)</script>' });
  assert.equal(safe.includes('</script>'), false);
  assert.deepEqual(JSON.parse(safe), { name: '</script><script>alert(1)</script>' });
});
