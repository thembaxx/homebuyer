import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { municipalityFor, properties } from './data';
import crime from './crime-snapshot.json';

test('example reports carry a sourced metro audit and nearby places', () => {
  assert.deepEqual(
    properties.map((property) => property.municipalityId),
    ['cape-town', 'johannesburg', 'ethekwini', 'tshwane'],
  );
  for (const property of properties) {
    const profile = municipalityFor(property);
    assert.ok(profile);
    assert.equal(profile.name, property.municipality);
    assert.ok(property.amenities.length >= 3);
    assert.ok(property.amenities.every((place) => place.source.startsWith('https://')));
  }
  assert.equal(municipalityFor(properties[0])?.tone, 'clean');
  assert.equal(municipalityFor(properties[1])?.tone, 'findings');
  assert.equal(municipalityFor(properties[2])?.tone, 'findings');
  assert.equal(municipalityFor(properties[3])?.tone, 'qualified');
  assert.equal(municipalityFor({ city: 'Sandton', suburb: 'Morningside' })?.id, 'johannesburg');
  assert.equal(municipalityFor({ city: 'Cape Town', suburb: 'Rosebank' })?.id, 'cape-town');
  assert.equal(municipalityFor({ city: 'Polokwane', suburb: 'Flora Park' }), undefined);
});

test('Woodstock snapshot keeps the break-in series and adds the latest categories', () => {
  assert.deepEqual(crime.counts, [196, 201, 224, 138, 116]);
  assert.equal(crime.categories.find((item) => item.name === 'Residential break-ins')?.count, 116);
  assert.equal(crime.categories.find((item) => item.name === 'Residential break-ins')?.prior, 138);
  assert.equal(crime.categories.find((item) => item.name === 'Car crime')?.prior, 656);
  assert.equal(
    crime.categories.reduce((sum, item) => sum + item.count, 0),
    crime.allTypes[4],
  );
  assert.match(crime.coverage, /Observatory/);
  assert.equal(crime.retrievedAt, '2026-10-13');
});

test('text inputs stay at 16px so mobile browsers do not zoom', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  for (const match of css.matchAll(/([^{}]*input[^{}]*)\{([^}]*)\}/g)) {
    const sizes = [...match[2].matchAll(/font-size:\s*([^;]+)/g)].map((item) => item[1].trim());
    for (const size of sizes) assert.equal(size, '16px', match[1].replace(/\s+/g, ' '));
  }
});
