'use client';

import { useEffect, useRef, useState } from 'react';
import { MagnifyingGlass, ArrowUpRight, MapPin, CircleNotch, X } from '@phosphor-icons/react';
import { properties, type Property } from '@/lib/data';

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id: number;
    countrycode?: string;
    country?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    locality?: string;
    district?: string;
    state?: string;
  };
};
export function AddressSearch({
  onSelect,
  compact = false,
  initialFocus = false,
}: {
  onSelect: (p: Property) => void;
  compact?: boolean;
  initialFocus?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [remote, setRemote] = useState<Property[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (initialFocus) inputRef.current?.focus();
  }, [initialFocus]);
  const local = properties.filter((p) =>
    `${p.address} ${p.suburb} ${p.city}`.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    if (query.trim().length < 3) {
      setRemote([]);
      setError('');
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setBusy(true);
    setError('');
    const timer = window.setTimeout(async () => {
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query + ', South Africa')}&limit=8&lang=en&lat=-30.56&lon=22.94`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('Search unavailable');
        const data = (await response.json()) as { features: PhotonFeature[] };
        setRemote(
          data.features
            .filter(
              (f) => f.properties.countrycode === 'ZA' || f.properties.country === 'South Africa',
            )
            .map((f) => {
              const v = f.properties;
              const [lng, lat] = f.geometry.coordinates;
              return {
                id: `osm-${v.osm_id}`,
                address: [v.housenumber, v.street || v.name].filter(Boolean).join(' ') || query,
                suburb: v.locality || v.district || v.city || v.state || 'South Africa',
                city: v.city || v.state || 'South Africa',
                lat,
                lng,
                price: 2450000,
                rates: 1650,
                levy: 0,
                utilities: 2400,
                image: '/images/hero-house.jpg',
                amenities: [],
                example: false,
              };
            }),
        );
      } catch {
        if (cancelled) return;
        if (!controller.signal.aborted)
          setError('Live address search is unavailable. Try one of the example reports below.');
        else setError('Address search timed out. Try again or explore an example.');
      } finally {
        window.clearTimeout(timeout);
        if (!cancelled) setBusy(false);
      }
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const select = (p: Property) => {
    setFocused(false);
    onSelect(p);
  };
  const results = [...local, ...remote];
  return (
    <div ref={ref} className={`address-search ${compact ? 'compact' : ''}`}>
      <form
        className="search-field"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) select(results[0]);
          else setFocused(true);
        }}
      >
        <MapPin size={23} weight="regular" />
        <input
          ref={inputRef}
          aria-label="Search a South African address"
          placeholder="Enter a South African address"
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocused(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setFocused(false);
          }}
          autoComplete="off"
        />
        {query && (
          <button
            className="search-clear"
            type="button"
            onClick={() => {
              setQuery('');
              setRemote([]);
            }}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        <button className="search-submit" aria-label="Search address" type="submit">
          {busy ? <CircleNotch size={22} className="spin" /> : <ArrowUpRight size={23} />}
        </button>
      </form>
      {focused && (
        <div className="search-results">
          <div className="results-label">
            <MagnifyingGlass size={14} />
            {query ? 'MATCHING ADDRESSES' : 'EXPLORE AN EXAMPLE'}
          </div>
          {error && (
            <p className="search-error" role="status">
              {error}
            </p>
          )}
          {results.slice(0, 6).map((p) => (
            <button key={p.id} type="button" className="search-result" onClick={() => select(p)}>
              <span className="result-pin">
                <MapPin size={20} />
              </span>
              <span>
                <strong>{p.address}</strong>
                <small>
                  {p.suburb}, {p.city} · {p.example ? 'Example report' : 'OpenStreetMap address'}
                </small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          ))}
          {!results.length && !busy && (
            <p className="search-error">
              No address found. Include the suburb and city, or try Observatory.
            </p>
          )}
          {busy && <p className="search-error">Searching South African addresses…</p>}
          <div className="search-attribution">
            Address search by Photon · © OpenStreetMap contributors
          </div>
        </div>
      )}
    </div>
  );
}
