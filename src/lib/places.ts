import type { Amenity, Property } from './data';
import { distanceKm } from './data';

type OSMPlace = {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: { name?: string; amenity?: string; leisure?: string; shop?: string; railway?: string };
};

export async function findNearbyPlaces(
  property: Property,
  signal: AbortSignal,
): Promise<Amenity[]> {
  const around = `around:2000,${property.lat},${property.lng}`;
  const query = `[out:json][timeout:15];(nwr(${around})[amenity~"^(hospital|clinic|pharmacy|school)$"][name];nwr(${around})[leisure=park][name];nwr(${around})[shop=supermarket][name];nwr(${around})[railway=station][name];);out center 40;`;
  const response = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
    { signal },
  );
  if (!response.ok) throw new Error('Nearby-place service unavailable');
  const data = (await response.json()) as { elements: OSMPlace[] };
  const unique = new Set<string>();
  return data.elements
    .flatMap((place): Amenity[] => {
      const lat = place.lat ?? place.center?.lat;
      const lng = place.lon ?? place.center?.lon;
      const name = place.tags?.name;
      if (!name || lat === undefined || lng === undefined || unique.has(name)) return [];
      unique.add(name);
      return [
        {
          name,
          lat,
          lng,
          category:
            place.tags?.amenity === 'school'
              ? 'school'
              : place.tags?.amenity
                ? 'health'
                : place.tags?.leisure
                  ? 'green'
                  : place.tags?.railway
                    ? 'transport'
                    : 'shop',
          source: `https://www.openstreetmap.org/${place.type}/${place.id}`,
          retrievedAt: new Date().toISOString().slice(0, 10),
        },
      ];
    })
    .sort(
      (a, b) =>
        distanceKm(property.lat, property.lng, a.lat, a.lng) -
        distanceKm(property.lat, property.lng, b.lat, b.lng),
    )
    .slice(0, 8);
}
