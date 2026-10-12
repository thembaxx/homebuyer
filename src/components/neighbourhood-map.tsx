'use client';

import { useEffect, useRef, useState } from 'react';
import type { Property } from '@/lib/data';
import type { Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function NeighbourhoodMap({
  property: p,
  filter = 'all',
}: {
  property: Property;
  filter?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    let destroyed = false;
    import('leaflet').then((L) => {
      if (destroyed || !host.current) return;
      const m = L.map(host.current, { scrollWheelZoom: false, zoomControl: false }).setView(
        [p.lat, p.lng],
        14,
      );
      map.current = m;
      L.control.zoom({ position: 'bottomright' }).addTo(m);
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(m);
      tiles.on('tileerror', () => setTileError(true));
      const pin = L.divIcon({
        className: 'property-map-pin',
        html: '<span>⌂</span>',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });
      const popup = document.createElement('div');
      popup.textContent = `${p.address} · ${p.example ? 'approximate example location' : 'verify address pin'}`;
      L.marker([p.lat, p.lng], { icon: pin }).addTo(m).bindPopup(popup);
      L.circle([p.lat, p.lng], {
        radius: 1000,
        color: '#6e7950',
        weight: 1,
        fillColor: '#c9d7ad',
        fillOpacity: 0.12,
        dashArray: '4 5',
      }).addTo(m);
      p.amenities
        .filter((a) => filter === 'all' || a.category === filter)
        .forEach((a) => {
          const icon = L.divIcon({
            className: `amenity-map-pin ${a.category}`,
            html: `<span>${a.category === 'health' ? '+' : a.category === 'green' ? '♧' : a.category === 'transport' ? '↗' : '•'}</span>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });
          const content = document.createElement('div');
          content.textContent = a.name;
          L.marker([a.lat, a.lng], { icon }).addTo(m).bindPopup(content);
        });
      requestAnimationFrame(() => m.invalidateSize());
    });
    return () => {
      destroyed = true;
      map.current?.remove();
      map.current = null;
      setTileError(false);
    };
  }, [p, filter]);
  return (
    <div className="map-wrap">
      <div
        ref={host}
        className="neighbourhood-map"
        aria-label={`Interactive map around ${p.address}, ${p.suburb}`}
      />
      {tileError && (
        <a
          className="map-error"
          href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=15/${p.lat}/${p.lng}`}
          target="_blank"
          rel="noreferrer"
        >
          Map tiles unavailable · Open in OpenStreetMap ↗
        </a>
      )}
      <div className="map-legend">
        <span />
        <span>1 km radius · approximate location</span>
      </div>
    </div>
  );
}
