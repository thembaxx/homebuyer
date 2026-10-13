'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  ArrowRight,
  BookmarkSimple,
  Buildings,
  Car,
  Check,
  CheckCircle,
  CircleNotch,
  Compass,
  FilePdf,
  HouseLine,
  Info,
  MapPin,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Train,
  Tree,
  Wallet,
  WarningCircle,
  X,
  Trash,
  DownloadSimple,
  Heart,
  FirstAid,
  Storefront,
  Lightning,
  UsersThree,
  Receipt,
} from '@phosphor-icons/react';
import { Logo } from './logo';
import { ThemePicker } from './theme-picker';
import { brand } from '@/lib/brand';
import { AddressSearch } from './address-search';
import { BudgetGauge } from './budget-gauge';
import { BudgetEditor } from './budget-editor';
import { Modal } from './modal';
import {
  budgetLines,
  defaultBudget,
  monthlyTotal,
  rand,
  type Budget,
  type SavedReport,
} from '@/lib/budget';
import {
  properties,
  checklist,
  sources,
  distanceKm,
  distanceLabel,
  municipalityFor,
  type Property,
} from '@/lib/data';
import crime from '@/lib/crime-snapshot.json';
import { downloadReport } from '@/lib/pdf';
import { findNearbyPlaces } from '@/lib/places';

const NeighbourhoodMap = dynamic(
  () => import('./neighbourhood-map').then((m) => m.NeighbourhoodMap),
  { ssr: false },
);
const HouseScene = dynamic(() => import('./house-scene').then((m) => m.HouseScene), { ssr: false });
const placeIcons = { transport: Train, green: Tree, health: FirstAid, shop: Storefront };
type Tab = 'overview' | 'local' | 'budget' | 'evidence';
type View = 'report' | 'saved';

export function ReportWorkspace() {
  const [property, setProperty] = useState<Property>(properties[0]);
  const [budget, setBudget] = useState<Budget>(defaultBudget(properties[0]));
  const [saved, setSaved] = useState<SavedReport[]>([]);
  const [checked, setChecked] = useState<number[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [view, setView] = useState<View>('report');
  const [modal, setModal] = useState<'search' | 'budget' | null>(null);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState('');
  const [exporting, setExporting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [compare, setCompare] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesUnavailable, setPlacesUnavailable] = useState(false);
  useEffect(() => {
    if (property.example || property.amenities.length > 0) return;
    const controller = new AbortController();
    let cancelled = false;
    setPlacesLoading(true);
    setPlacesUnavailable(false);
    const timeout = window.setTimeout(() => controller.abort(), 18000);
    findNearbyPlaces(property, controller.signal)
      .then((amenities) => {
        if (!cancelled && amenities.length > 0)
          setProperty((current) =>
            current.id === property.id ? { ...current, amenities } : current,
          );
      })
      .catch(() => {
        if (!cancelled) setPlacesUnavailable(true);
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (!cancelled) setPlacesLoading(false);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [property]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('homebuyer:saved') || '[]');
      if (Array.isArray(raw))
        setSaved(
          raw.filter(
            (r: SavedReport) =>
              r.property?.id &&
              r.budget &&
              Number.isFinite(r.budget.price) &&
              Array.isArray(r.checked),
          ),
        );
      const selected = sessionStorage.getItem('homebuyer:selected');
      if (selected) {
        const p = JSON.parse(selected) as Property;
        if (p.id && Number.isFinite(p.lat) && Array.isArray(p.amenities)) {
          setProperty(p);
          setBudget(defaultBudget(p));
        }
      }
    } catch {
      setToast('Some browser data could not be restored. You can start a new report.');
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'saved') setView('saved');
    const initialTab = params.get('tab');
    if (['overview', 'local', 'budget', 'evidence'].includes(initialTab || ''))
      setTab(initialTab as Tab);
    setLoaded(true);
    const back = () => {
      const q = new URLSearchParams(window.location.search);
      setView(q.get('view') === 'saved' ? 'saved' : 'report');
      setTab(
        (['local', 'budget', 'evidence'].includes(q.get('tab') || '')
          ? q.get('tab')
          : 'overview') as Tab,
      );
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const navigate = (v: View, t: Tab = tab) => {
    setView(v);
    setTab(t);
    setCompare(false);
    window.history.pushState({}, '', `/check/?${v === 'saved' ? 'view=saved' : `tab=${t}`}`);
  };
  const choose = (p: Property) => {
    setProperty(p);
    setBudget(defaultBudget(p));
    setChecked([]);
    setFilter('all');
    setPlacesLoading(false);
    setPlacesUnavailable(false);
    setModal(null);
    navigate('report', 'overview');
    try {
      sessionStorage.setItem('homebuyer:selected', JSON.stringify(p));
    } catch {
      setToast('Browser storage is unavailable; this report will stay open for this visit.');
    }
  };
  const persist = useCallback((reports: SavedReport[]) => {
    setSaved(reports);
    try {
      localStorage.setItem('homebuyer:saved', JSON.stringify(reports));
      return true;
    } catch {
      setToast('Browser storage is unavailable. Your homes are saved for this visit only.');
      return false;
    }
  }, []);
  const save = () => {
    const report = { property, budget, checked, savedAt: new Date().toISOString() };
    const exists = saved.some((r) => r.property.id === property.id);
    if (persist([...saved.filter((r) => r.property.id !== property.id), report]))
      setToast(
        exists
          ? 'Saved report updated with your latest numbers.'
          : 'Home saved. Your numbers are ready to compare.',
      );
  };
  const exportPdf = async (
    report: SavedReport = { property, budget, checked, savedAt: new Date().toISOString() },
  ) => {
    setExporting(true);
    try {
      await downloadReport(report);
      setToast('Your PDF report is ready. Check your downloads.');
    } catch {
      setToast('The PDF could not be created. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  const lines = budgetLines(budget),
    total = monthlyTotal(budget);
  const ratio = budget.income > 0 ? Math.round((total / budget.income) * 100) : 0;
  const hasSaved = saved.some((r) => r.property.id === property.id);
  const profile = municipalityFor(property);
  const hasCrime = property.id === 'observatory';
  const crimePeak = Math.max(...crime.counts);
  const crimeChange = Math.round(((crime.counts[4] - crime.counts[3]) / crime.counts[3]) * 100);
  const localPanel = (
    <section className="panel local-panel">
      <div className="panel-heading">
        <div>
          <span className="micro-label">THE EVERYDAY AROUND YOU</span>
          <h2>Your neighbourhood</h2>
        </div>
        <Compass size={25} weight="light" />
      </div>
      <div className="map-filters">
        {[
          ['all', 'All places'],
          ['transport', 'Transport'],
          ['green', 'Green spaces'],
          ['health', 'Health'],
        ].map(([key, label]) => (
          <button
            className={filter === key ? 'active' : ''}
            onClick={() => setFilter(key)}
            key={key}
          >
            {label}
          </button>
        ))}
      </div>
      <NeighbourhoodMap property={property} filter={filter} />
      <div className="amenities">
        {property.amenities
          .filter((a) => filter === 'all' || a.category === filter)
          .map((a) => {
            const Icon = placeIcons[a.category];
            return (
              <a
                key={a.name}
                href={a.source}
                target="_blank"
                rel="noreferrer"
                className="amenity-row"
              >
                <span className={`amenity-icon ${a.category}`}>
                  <Icon size={20} />
                </span>
                <span>
                  <strong>{a.name}</strong>
                  <small>
                    {a.category === 'green'
                      ? 'A little breathing room'
                      : a.category === 'transport'
                        ? 'Getting around'
                        : a.category === 'health'
                          ? 'Care nearby'
                          : 'Local essentials'}
                  </small>
                </span>
                <span>{distanceLabel(distanceKm(property.lat, property.lng, a.lat, a.lng))}</span>
                <ArrowUpRight size={16} />
              </a>
            );
          })}
        {placesLoading && (
          <p className="data-note">
            <CircleNotch size={18} className="spin" />
            Finding nearby essentials in OpenStreetMap…
          </p>
        )}
        {!property.amenities.length && !placesLoading && (
          <p className="data-note">
            <Info size={19} />
            {placesUnavailable
              ? 'The nearby-place service is unavailable. Explore the map and confirm amenities locally.'
              : 'No named nearby places were found in this dataset. Explore the map and confirm amenities locally.'}
          </p>
        )}
      </div>
      <p className="panel-note">
        Distances are approximate and straight-line, not walking routes. Example map pins are
        approximate.
      </p>
    </section>
  );
  const evidencePanel = (
    <>
      <section className="panel municipal-panel">
        <div className="panel-heading">
          <span className="panel-icon">
            <Buildings size={25} />
          </span>
          <span className="tag muted">MUNICIPAL FINANCES</span>
        </div>
        <h2>{profile?.name || property.municipality || 'Your municipality'}</h2>
        {profile ? (
          <>
            <div className={`audit-result ${profile.tone}`}>
              {profile.tone === 'clean' ? (
                <CheckCircle size={23} weight="fill" />
              ) : (
                <Info size={23} />
              )}
              <strong>{profile.opinionLabel}</strong>
              <span>{profile.year}</span>
            </div>
            <p>{profile.summary}</p>
            {profile.years && (
              <div className="audit-years">
                {profile.years.map((y) => (
                  <div key={y}>
                    <Check size={17} />
                    <span>{y}</span>
                  </div>
                ))}
              </div>
            )}
            {profile.detail && <p>{profile.detail}</p>}
            <p className="panel-note">
              Dated audit evidence for the municipality, not this stand. An audit outcome does not
              guarantee services or future municipal performance.
            </p>
            <a href={profile.source} target="_blank" rel="noreferrer" className="source-link">
              {profile.sourceLabel}
              <ArrowUpRight size={16} />
            </a>
            {profile.extraSource && profile.extraSourceLabel && (
              <a
                href={profile.extraSource}
                target="_blank"
                rel="noreferrer"
                className="source-link"
              >
                {profile.extraSourceLabel}
                <ArrowUpRight size={16} />
              </a>
            )}
          </>
        ) : (
          <>
            <div className="audit-result">
              <Info size={23} />
              <strong>Verify the latest audit</strong>
            </div>
            <p>
              A verified audit snapshot is not available for this address. Check National Treasury
              before drawing conclusions.
            </p>
          </>
        )}
        <a
          href={profile?.treasury || 'https://municipalmoney.gov.za/'}
          target="_blank"
          rel="noreferrer"
          className="source-link"
        >
          Explore National Treasury Municipal Money
          <ArrowUpRight size={16} />
        </a>
      </section>
      <section className="panel crime-panel">
        <div className="panel-heading">
          <span className="panel-icon">
            <ShieldCheck size={25} />
          </span>
          <span className="tag muted">PRECINCT CONTEXT</span>
        </div>
        <h2>{property.station || 'Police precinct'}</h2>
        {hasCrime ? (
          <>
            <div className="crime-stat">
              <strong>{crime.counts[4]}</strong>
              <span>
                reported residential break-ins
                <br />
                <small>July 2025–June 2026</small>
              </span>
              <span className="trend">{crimeChange}% YoY</span>
            </div>
            <div className="crime-bars">
              {crime.counts.map((count, i) => (
                <div key={crime.periods[i]}>
                  <span>{count}</span>
                  <i style={{ height: `${(count / crimePeak) * 76}px` }} />
                  <small>{crime.periods[i]}</small>
                </div>
              ))}
            </div>
            <div className="crime-mix">
              {crime.categories.map((item) => (
                <div key={item.name}>
                  <span>{item.name}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
            <p className="panel-note">
              {crime.latestLabel}. Cape Town Data’s aggregation of SAPS station records for{' '}
              {crime.coverage}; release 28 Aug 2026. Break-ins in the chart are homes only. Primary
              download was unavailable during verification.
            </p>
            <a href={crime.source} target="_blank" rel="noreferrer" className="source-link">
              View trend source & category definitions
              <ArrowUpRight size={16} />
            </a>
          </>
        ) : (
          <p>
            {property.stationNote ||
              'A verified station time series is not available for this address. Confirm your police precinct and compare matching periods in SAPS releases.'}
          </p>
        )}
        <div className="context-warning">
          <WarningCircle size={20} />
          <span>
            Precinct-level statistics don’t measure a street’s safety. Visit, ask neighbours and
            speak to the local CPF.
          </span>
        </div>
        <a href={sources.police} target="_blank" rel="noreferrer" className="source-link">
          Official SAPS statistics
          <ArrowUpRight size={16} />
        </a>
      </section>
    </>
  );
  const costPanel = (
    <section className="panel ownership-panel">
      <div className="panel-heading">
        <div>
          <span className="micro-label">THE COST AFTER THE KEYS</span>
          <h2>Your monthly reality</h2>
        </div>
        <button
          className="icon-button"
          onClick={() => setModal('budget')}
          aria-label="Edit ownership budget"
        >
          <SlidersHorizontal size={21} />
        </button>
      </div>
      <div className="gauge-wrap">
        <BudgetGauge percent={Math.min(100, ratio)} />
        <div>
          <strong>{rand(total)}</strong>
          <span>estimated per month</span>
        </div>
      </div>
      <div className="income-note">
        <span className="status-dot" />
        {budget.income > 0
          ? `${ratio}% of your ${rand(budget.income)} take-home income`
          : 'Add your income to see the budget share'}
      </div>
      <div className="budget-lines">
        {lines
          .filter((l) => l.value > 0)
          .map((l) => (
            <div key={l.label}>
              <span>
                <i style={{ background: l.color }} />
                {l.label}
              </span>
              <strong>{rand(l.value)}</strong>
            </div>
          ))}
      </div>
      <button className="button outline" onClick={() => setModal('budget')}>
        Make these numbers mine
        <SlidersHorizontal size={18} />
      </button>
      <p className="panel-note">
        User-adjustable assumptions, not a quote.
        <br />
        {budget.deposit}% deposit · {budget.rate}% rate · {budget.years}-year bond
      </p>
    </section>
  );

  return (
    <div className="workspace">
      <aside className="sidebar">
        <Logo />
        <div className="sidebar-subtitle">A LITTLE PERSPECTIVE.</div>
        <nav aria-label="Workspace navigation">
          <button
            className={view === 'report' ? 'active' : ''}
            onClick={() => navigate('report', 'overview')}
          >
            <HouseLine size={22} weight={view === 'report' ? 'fill' : 'regular'} />
            Reality check
            <ArrowUpRight size={17} />
          </button>
          <button className={view === 'saved' ? 'active' : ''} onClick={() => navigate('saved')}>
            <BookmarkSimple size={22} weight={view === 'saved' ? 'fill' : 'regular'} />
            Saved homes<span className="nav-count">{saved.length}</span>
          </button>
          <button onClick={() => setModal('search')}>
            <MagnifyingGlass size={22} />
            Find another home
            <Plus size={18} />
          </button>
        </nav>
        <div className="sidebar-card">
          <span className="sidebar-card-icon">
            <Heart size={23} weight="light" />
          </span>
          <h3>
            A home you love.
            <br />A decision you trust.
          </h3>
          <p>
            Keep the dream.
            <br />
            Check the details.
          </p>
          <Link href="/#how-it-works">
            Meet {brand.name}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <span>🇿🇦 Built for South Africa</span>
          <small>Your homes stay in this browser.</small>
          <Link href="/">
            Back to {brand.name} <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="mobile-brand">
            <Logo compact />
          </div>
          <span className="breadcrumb">
            Your homebuying companion<span>/</span>
            {view === 'saved' ? 'Saved homes' : 'Reality check'}
          </span>
          <button className="topbar-search" onClick={() => setModal('search')}>
            <MagnifyingGlass size={19} />
            <span>Find a home</span>
            <kbd>⌕</kbd>
          </button>
          <span className="local-avatar" aria-label="Local browser workspace">
            {brand.initials}
          </span>
          <ThemePicker />
        </header>
        <main className="workspace-content" id="main-content" tabIndex={-1}>
          {view === 'report' ? (
            <>
              <div className="workspace-title">
                <div>
                  <span className="eyebrow">EVIDENCE BEFORE EMOTION</span>
                  <h1>A little more perspective.</h1>
                  <p>For the home that could be yours.</p>
                </div>
                <div className="report-actions">
                  <button className={`button outline ${hasSaved ? 'is-saved' : ''}`} onClick={save}>
                    <BookmarkSimple size={18} weight={hasSaved ? 'fill' : 'regular'} />
                    {hasSaved ? 'Update saved' : 'Save home'}
                  </button>
                  <button className="button dark" onClick={() => exportPdf()} disabled={exporting}>
                    {exporting ? <CircleNotch className="spin" size={18} /> : <FilePdf size={18} />}
                    <span>{exporting ? 'Preparing…' : 'Export report'}</span>
                  </button>
                </div>
              </div>
              <div className="report-tabs" role="tablist" aria-label="Report sections">
                {[
                  ['overview', 'Overview'],
                  ['local', 'Around the home'],
                  ['budget', 'Ownership budget'],
                  ['evidence', 'Evidence & sources'],
                ].map(([key, label]) => (
                  <button
                    role="tab"
                    id={`tab-${key}`}
                    aria-controls="report-panel"
                    aria-selected={tab === key}
                    className={tab === key ? 'active' : ''}
                    onClick={() => navigate('report', key as Tab)}
                    key={key}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div id="report-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
                <div className="property-heading">
                  <div>
                    <MapPin size={17} />
                    <strong>{property.address}</strong>
                    <span>
                      {property.suburb}, {property.city}
                    </span>
                  </div>
                  <button className="text-link" onClick={() => setModal('search')}>
                    Change home
                    <ArrowUpRight size={16} />
                  </button>
                </div>
                {tab === 'overview' && (
                  <>
                    <div className="overview-grid">
                      <section className="property-card">
                        <img
                          src={property.image}
                          alt="Representative residential architecture; not a photograph of the selected address"
                        />
                        <div className="property-shade" />
                        <div className="property-tags">
                          <span className="tag glass">
                            <span className="live-dot" />
                            {property.example ? 'EXAMPLE REPORT' : 'YOUR SELECTED ADDRESS'}
                          </span>
                          <button
                            className="property-heart"
                            onClick={save}
                            aria-label="Save this home"
                          >
                            <BookmarkSimple size={20} weight={hasSaved ? 'fill' : 'regular'} />
                          </button>
                        </div>
                        <div className="property-image-copy">
                          <span>YOUR MAYBE-HOME</span>
                          <h2>{property.address}</h2>
                          <p>
                            <MapPin size={17} />
                            {property.suburb}, {property.city}
                          </p>
                          <div>
                            <strong>{rand(budget.price)}</strong>
                            <span>your purchase-price assumption</span>
                          </div>
                        </div>
                        <small className="representative-note">
                          Representative photography ·{' '}
                          {property.example ? 'illustrative property' : 'verify address pin'}
                        </small>
                      </section>
                      {costPanel}
                    </div>
                    <div className="insight-strip">
                      <div>
                        <span className="insight-icon">
                          <Buildings size={21} />
                        </span>
                        <section>
                          <small>MUNICIPAL EVIDENCE</small>
                          <strong>
                            {profile ? profile.insight : 'Audit requires verification'}
                          </strong>
                        </section>
                        <button
                          aria-label="View municipal evidence"
                          onClick={() => navigate('report', 'evidence')}
                        >
                          <ArrowUpRight size={20} />
                        </button>
                      </div>
                      <div>
                        <span className="insight-icon">
                          <ShieldCheck size={21} />
                        </span>
                        <section>
                          <small>CRIME CONTEXT</small>
                          <strong>{property.station || 'Confirm local precinct'}</strong>
                        </section>
                        <button
                          aria-label="View police precinct evidence"
                          onClick={() => navigate('report', 'evidence')}
                        >
                          <ArrowUpRight size={20} />
                        </button>
                      </div>
                      <div>
                        <span className="insight-icon">
                          <Car size={21} />
                        </span>
                        <section>
                          <small>YOUR COMMUTE ASSUMPTION</small>
                          <strong>
                            {budget.commuteKm} km · {budget.workdays} days/month
                          </strong>
                        </section>
                        <button
                          aria-label="Edit commute assumptions"
                          onClick={() => setModal('budget')}
                        >
                          <ArrowUpRight size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="lower-grid">
                      {localPanel}
                      <section className="panel model-panel">
                        <div className="panel-heading">
                          <div>
                            <span className="micro-label">EXPLORE THE POSSIBILITIES</span>
                            <h2>A different perspective</h2>
                          </div>
                          <span className="tag muted">INTERACTIVE 3D</span>
                        </div>
                        <HouseScene />
                        <p className="panel-note">
                          Representative architecture. Toggle evening lighting or lift the roof.
                          This model is not a survey of your property.
                        </p>
                        <div className="commute-mini">
                          <Car size={22} />
                          <div>
                            <strong>{budget.destination || 'Your daily commute'}</strong>
                            <span>Return trips · {rand(lines[6].value)} / month</span>
                          </div>
                          <button
                            className="icon-button"
                            aria-label="Edit commute"
                            onClick={() => setModal('budget')}
                          >
                            <SlidersHorizontal size={18} />
                          </button>
                        </div>
                      </section>
                    </div>
                  </>
                )}
                {tab === 'local' && (
                  <div className="local-page-grid">
                    {localPanel}
                    <section className="panel commute-panel">
                      <Car size={30} weight="light" />
                      <span className="micro-label">THE DAILY JOURNEY</span>
                      <h2>Your commute, your call.</h2>
                      <p>Make the everyday journey part of your decision.</p>
                      <div className="commute-stat">
                        <strong>
                          {budget.commuteKm}
                          <small> km</small>
                        </strong>
                        <span>one way · your assumption</span>
                      </div>
                      <h3>{budget.destination || 'Add your destination'}</h3>
                      <div className="compact-row">
                        <span>Workdays per month</span>
                        <strong>{budget.workdays}</strong>
                      </div>
                      <div className="compact-row">
                        <span>Fuel & wear per km</span>
                        <strong>R{budget.costPerKm.toFixed(2)}</strong>
                      </div>
                      <div className="compact-row">
                        <span>Monthly return trips</span>
                        <strong>{rand(lines[6].value)}</strong>
                      </div>
                      <button className="button dark" onClick={() => setModal('budget')}>
                        Adjust my commute
                        <SlidersHorizontal size={18} />
                      </button>
                      <p className="panel-note">
                        No live traffic or travel-time estimate. Distance, workdays and cost per km
                        are your assumptions.
                      </p>
                      <a
                        className="source-link"
                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${property.address}, ${property.suburb}, ${property.city}`)}&destination=${encodeURIComponent(budget.destination)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Check a route in Google Maps
                        <ArrowUpRight size={18} />
                      </a>
                    </section>
                  </div>
                )}
                {tab === 'budget' && (
                  <div className="budget-page-grid">
                    {costPanel}
                    <section className="panel budget-detail">
                      <Wallet size={30} weight="light" />
                      <span className="micro-label">KNOW WHERE IT GOES</span>
                      <h2>The price tag is just the start.</h2>
                      <p>Build a monthly budget that fits your real life.</p>
                      <div className="cost-bar">
                        {lines.map((l) => (
                          <span
                            key={l.label}
                            style={{ flex: l.value, background: l.color }}
                            title={`${l.label}: ${rand(l.value)}`}
                          />
                        ))}
                      </div>
                      {lines.map((l) => (
                        <div className="detail-line" key={l.label}>
                          <span>
                            <i style={{ background: l.color }} />
                            {l.label}
                          </span>
                          <strong>{rand(l.value)}</strong>
                          <small>
                            {l.label === 'Bond repayment'
                              ? `${budget.deposit}% deposit · ${budget.rate}% annual · ${budget.years} years`
                              : l.label === 'Commute allowance'
                                ? `${budget.commuteKm} km × 2 × ${budget.workdays} days × R${budget.costPerKm.toFixed(2)}`
                                : 'Monthly user-entered assumption'}
                          </small>
                        </div>
                      ))}
                      <div className="data-note">
                        <Info size={20} />
                        <span>
                          This estimate excludes transfer duty, conveyancing and bond registration
                          fees. Get written quotes and recent municipal bills before you commit.
                        </span>
                      </div>
                      <button className="button dark" onClick={() => setModal('budget')}>
                        Adjust my budget
                        <SlidersHorizontal size={18} />
                      </button>
                    </section>
                  </div>
                )}
                {tab === 'evidence' && (
                  <>
                    <div className="evidence-intro">
                      <ShieldCheck size={28} weight="light" />
                      <div>
                        <h2>Useful evidence. Honest boundaries.</h2>
                        <p>
                          Check the period, the source and what each number can actually tell you.
                        </p>
                      </div>
                    </div>
                    <div className="evidence-grid">{evidencePanel}</div>
                    <section className="panel methodology">
                      <h2>What goes into your reality check</h2>
                      <div>
                        {[
                          [
                            'Addresses & maps',
                            'Photon and OpenStreetMap. Address coverage varies; always verify the pin. Example coordinates are approximate.',
                          ],
                          [
                            'Ownership costs',
                            'Standard amortisation formula plus user-entered bills and assumptions. No bank quote, current prime-rate feed or property valuation.',
                          ],
                          [
                            'Municipal finances',
                            'Dated AGSA audit opinions for Cape Town, Johannesburg, eThekwini and Tshwane in 2023/24. Other municipalities still need a manual check. Not a bill for this stand.',
                          ],
                          [
                            'Police statistics',
                            'Woodstock residential break-ins and the seven recorded categories for July 2025–June 2026, from a secondary aggregation of SAPS station records. Not an address-level safety measure.',
                          ],
                          [
                            'What needs more data',
                            'Licensed valuations, historical deeds transactions, legal title, building condition and granular crime risk need additional sources or professional checks.',
                          ],
                        ].map(([title, body]) => (
                          <div key={title}>
                            <CheckCircle size={21} />
                            <section>
                              <h3>{title}</h3>
                              <p>{body}</p>
                            </section>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
                <section className="viewing-checklist">
                  <div className="checklist-heading">
                    <div>
                      <span className="micro-label">GOOD QUESTIONS. FEWER SURPRISES.</span>
                      <h2>Before you fall all the way.</h2>
                    </div>
                    <span>
                      {checked.length} / {checklist.length} checked
                    </span>
                  </div>
                  <div className="checklist-grid">
                    {checklist.map((item, i) => {
                      const Icon = [Lightning, HouseLine, Receipt, UsersThree][i];
                      return (
                        <button
                          key={item.title}
                          className={`checklist-item ${checked.includes(i) ? 'checked' : ''}`}
                          onClick={() =>
                            setChecked((v) =>
                              v.includes(i) ? v.filter((x) => x !== i) : [...v, i],
                            )
                          }
                          aria-pressed={checked.includes(i)}
                        >
                          <Icon size={25} weight="light" />
                          <span>
                            <strong>{item.title}</strong>
                            <small>{item.detail}</small>
                          </span>
                          <span className="check-square">
                            {checked.includes(i) && <Check size={16} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="panel-note">
                    Save the home to keep your checklist and budget together.
                  </p>
                </section>
                <div className="report-bottom-cta">
                  <div>
                    <FilePdf size={27} />
                    <span>
                      <strong>Take a little clarity with you.</strong>
                      <small>Your numbers, sources and checklist. In one PDF.</small>
                    </span>
                  </div>
                  <button className="button dark" onClick={() => exportPdf()} disabled={exporting}>
                    Download my report
                    <DownloadSimple size={19} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="workspace-title">
                <div>
                  <span className="eyebrow">ROOM TO THINK IT OVER</span>
                  <h1>Your maybe-homes.</h1>
                  <p>A shortlist with a little more perspective.</p>
                </div>
                <button className="button dark" onClick={() => setModal('search')}>
                  Find another home
                  <Plus size={20} />
                </button>
              </div>
              <div className="saved-toolbar">
                <span>
                  {saved.length} saved {saved.length === 1 ? 'home' : 'homes'} · stored in this
                  browser
                </span>
                {saved.length >= 2 && (
                  <button className="button outline" onClick={() => setCompare((v) => !v)}>
                    {compare ? 'Show home cards' : 'Compare side by side'}
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
              {!loaded ? (
                <p>Loading your saved homes…</p>
              ) : !saved.length ? (
                <section className="empty-state">
                  <div className="empty-scene">
                    <HouseScene />
                  </div>
                  <BookmarkSimple size={30} weight="light" />
                  <h2>Your next chapter is out there.</h2>
                  <p>
                    Save a home from its reality check, then compare
                    <br />
                    the everyday costs before you choose.
                  </p>
                  <button className="button dark" onClick={() => navigate('report', 'overview')}>
                    Explore an example
                    <ArrowUpRight size={20} />
                  </button>
                </section>
              ) : compare ? (
                <section className="comparison-panel">
                  <div className="comparison-scroll">
                    <table>
                      <caption>The monthly reality, side by side</caption>
                      <thead>
                        <tr>
                          <th>YOUR SHORTLIST</th>
                          {saved.map((r) => (
                            <th key={r.property.id}>
                              <strong>{r.property.address}</strong>
                              <small>{r.property.suburb}</small>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['Purchase assumption', ...saved.map((r) => rand(r.budget.price))],
                          ['Monthly total', ...saved.map((r) => rand(monthlyTotal(r.budget)))],
                          ...budgetLines(saved[0].budget).map((line, i) => [
                            line.label,
                            ...saved.map((r) => rand(budgetLines(r.budget)[i].value)),
                          ]),
                          ['Deposit', ...saved.map((r) => `${r.budget.deposit}%`)],
                          ['Bond rate', ...saved.map((r) => `${r.budget.rate}%`)],
                          ['Commute (one way)', ...saved.map((r) => `${r.budget.commuteKm} km`)],
                          ['Checklist progress', ...saved.map((r) => `${r.checked.length} / 4`)],
                        ].map((row, i) => (
                          <tr key={row[0]} className={i === 1 ? 'comparison-total' : ''}>
                            {row.map((cell, j) =>
                              j === 0 ? <th key={j}>{cell}</th> : <td key={j}>{cell}</td>,
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="panel-note">
                    Each column uses the assumptions saved with that report. No valuation or safety
                    ranking is implied.
                  </p>
                </section>
              ) : (
                <div className="saved-grid">
                  {saved.map((r) => (
                    <article className="saved-card" key={r.property.id}>
                      <div className="saved-photo">
                        <img src={r.property.image} alt="Representative property photography" />
                        <span className="tag glass">
                          {r.property.example ? 'EXAMPLE PROPERTY' : 'SELECTED ADDRESS'}
                        </span>
                        <button
                          aria-label={`Remove ${r.property.address} from saved homes`}
                          className="icon-button"
                          onClick={() => {
                            if (persist(saved.filter((x) => x.property.id !== r.property.id)))
                              setToast('Home removed from your shortlist.');
                          }}
                        >
                          <Trash size={19} />
                        </button>
                      </div>
                      <div className="saved-card-content">
                        <small>
                          <MapPin size={14} />
                          {r.property.suburb}, {r.property.city}
                        </small>
                        <h2>{r.property.address}</h2>
                        <div className="saved-monthly">
                          <span>Monthly reality</span>
                          <strong>{rand(monthlyTotal(r.budget))}</strong>
                        </div>
                        <div className="saved-assumptions">
                          <span>{r.budget.deposit}% deposit</span>
                          <span>{r.budget.rate}% bond rate</span>
                          <span>{r.checked.length}/4 checks</span>
                        </div>
                        <button
                          className="button outline"
                          onClick={() => {
                            setProperty(r.property);
                            setBudget(r.budget);
                            setChecked(r.checked);
                            navigate('report', 'overview');
                          }}
                        >
                          Open reality check
                          <ArrowUpRight size={20} />
                        </button>
                        <button
                          className="text-link saved-pdf"
                          onClick={() => exportPdf(r)}
                          disabled={exporting}
                        >
                          <FilePdf size={17} />
                          Download PDF
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <p className="saved-privacy">
                <Info size={17} />
                Your saved homes stay in this browser. Export a PDF to keep a copy elsewhere.
              </p>
            </>
          )}
          <footer className="workspace-footer">
            <span>
              {brand.productName} · {brand.tagline}
            </span>
            <button onClick={() => navigate('report', 'evidence')}>
              Data & methodology
              <ArrowUpRight size={14} />
            </button>
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Mobile workspace navigation">
        <button
          onClick={() => navigate('report', 'overview')}
          className={view === 'report' ? 'active' : ''}
        >
          <HouseLine size={23} />
          <span>Reality check</span>
        </button>
        <button onClick={() => setModal('search')}>
          <MagnifyingGlass size={23} />
          <span>Find a home</span>
        </button>
        <button onClick={() => navigate('saved')} className={view === 'saved' ? 'active' : ''}>
          <BookmarkSimple size={23} />
          <span>Saved{saved.length ? ` (${saved.length})` : ''}</span>
        </button>
      </nav>
      {modal === 'search' && (
        <Modal title="Find your next maybe-home." onClose={() => setModal(null)}>
          <p className="modal-description">Search an address or explore a South African example.</p>
          <AddressSearch onSelect={choose} initialFocus />
          <div className="modal-examples">
            {properties.map((p) => (
              <button key={p.id} onClick={() => choose(p)}>
                <img src={p.image} alt="Representative residential photography" />
                <span>
                  <strong>{p.address}</strong>
                  <small>
                    {p.suburb}, {p.city} · example
                  </small>
                </span>
                <ArrowUpRight size={20} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {modal === 'budget' && (
        <Modal title="Your numbers. Your reality." onClose={() => setModal(null)}>
          <BudgetEditor
            value={budget}
            onSave={(b) => {
              setBudget(b);
              setModal(null);
              setToast('Your ownership budget has been updated. Save the home to keep it.');
            }}
          />
        </Modal>
      )}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <CheckCircle size={21} />
            {toast}
            <button aria-label="Dismiss notification" onClick={() => setToast('')}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
