import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findNearbyPlaces } from './places';
import { properties } from './data';

test('OSM schools keep their category, geometry, source and retrieval date', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async (url: string | URL | Request) => {
    assert.match(decodeURIComponent(String(url)), /pharmacy\|school/);
    return new Response(
      JSON.stringify({
        elements: [
          {
            id: 1,
            type: 'way',
            center: { lat: -25.775, lon: 28.265 },
            tags: { name: 'Example school', amenity: 'school' },
          },
          {
            id: 2,
            type: 'node',
            lat: -25.78,
            lon: 28.265,
            tags: { name: 'Example clinic', amenity: 'clinic' },
          },
          {
            id: 3,
            type: 'node',
            lat: -25.78,
            lon: 28.265,
            tags: { name: 'Example school', amenity: 'school' },
          },
          { id: 4, type: 'way', tags: { name: 'Missing coordinates', amenity: 'school' } },
        ],
      }),
    );
  });
  const places = await findNearbyPlaces(properties[3], new AbortController().signal);
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(places.length, 2);
  assert.equal(places[0].category, 'school');
  assert.equal(places[0].source, 'https://www.openstreetmap.org/way/1');
  assert.match(places[0].retrievedAt ?? '', /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(places[1].category, 'health');
});
