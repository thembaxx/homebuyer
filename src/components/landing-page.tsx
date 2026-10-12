'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  ArrowDown,
  Check,
  CheckCircle,
  Buildings,
  ShieldCheck,
  Wallet,
  MapPin,
  BookmarkSimple,
  Plus,
  Minus,
  List,
  X,
  HouseLine,
  Heart,
} from '@phosphor-icons/react';
import { Logo } from '@/components/logo';
import { ThemePicker } from '@/components/theme-picker';
import { brand } from '@/lib/brand';
import { AddressSearch } from '@/components/address-search';
import { defaultBudget, monthlyTotal, rand } from '@/lib/budget';
import { properties, type Property } from '@/lib/data';

const HouseScene = dynamic(() => import('@/components/house-scene').then((m) => m.HouseScene), {
  ssr: false,
});
const copyrightYear = new Date().getFullYear();
const features = [
  {
    icon: Wallet,
    title: 'The cost after the keys.',
    text: 'Bond, rates, levies, utilities, maintenance. One honest monthly number you can make your own.',
    tag: 'OWNERSHIP BUDGET',
  },
  {
    icon: MapPin,
    title: 'Life around your home.',
    text: 'Explore real maps, nearby essentials and your commute assumptions. Picture your everyday.',
    tag: 'NEIGHBOURHOOD',
  },
  {
    icon: ShieldCheck,
    title: 'Evidence, in context.',
    text: 'Municipal finances and precinct-level crime trends, with sources and the limits made clear.',
    tag: 'LOCAL INTELLIGENCE',
  },
];
const faqs = [
  [
    'Is this a property valuation?',
    'No. The purchase price comes from you. We help you understand ongoing ownership costs and questions to investigate. Licensed valuations, deed transactions and legal title checks are outside this MVP.',
  ],
  [
    'Can you tell me if a specific street is safe?',
    'No dataset can promise that. SAPS statistics describe a police precinct, not a particular address. We show dated precinct evidence with its source, and recommend visits, conversations with neighbours and the local community policing forum.',
  ],
  [
    'Where does the information come from?',
    'Addresses and maps use OpenStreetMap. Our Cape Town example cites a dated City audit release, National Treasury Municipal Money and Cape Town Data’s aggregation of SAPS records. Other locations clearly show where verified data is unavailable. Your budget is based on your own assumptions.',
  ],
  [
    'How do reports and payment work?',
    'The intended report range is R99–R299. This working MVP lets you explore examples, enter costs, compare saved homes and export PDFs free of charge. Payment processing is not connected, and choosing a tier never charges you.',
  ],
  [
    'Are my saved homes private?',
    'Saved reports and your budget inputs stay in this browser’s local storage. There is no account or cloud sync in this MVP. You can remove a home at any time from Saved homes.',
  ],
];

export function LandingPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [menu, setMenu] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const select = (p: Property) => {
    sessionStorage.setItem('homebuyer:selected', JSON.stringify(p));
    router.push('/check/');
  };
  const reveal = {
    initial: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.7 },
  };
  return (
    <div className="landing">
      <header className="site-header">
        <Logo />
        <nav className={menu ? 'site-nav open' : 'site-nav'} aria-label="Main navigation">
          <a href="#how-it-works" onClick={() => setMenu(false)}>
            How it works
          </a>
          <a href="#the-full-picture" onClick={() => setMenu(false)}>
            The full picture
          </a>
          <a href="#pricing" onClick={() => setMenu(false)}>
            Pricing
          </a>
        </nav>
        <Link href="/check/?view=saved" className="header-saved">
          <BookmarkSimple size={19} />
          <span>Saved homes</span>
        </Link>
        <ThemePicker />
        <button
          className="mobile-menu icon-button"
          onClick={() => setMenu((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={menu}
        >
          {menu ? <X size={24} /> : <List size={24} />}
        </button>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="landing-hero wrap">
          <motion.div className="hero-copy" {...reveal}>
            <div className="eyebrow">
              <span className="status-dot" />A LITTLE CLARITY. A BIG DECISION.
            </div>
            <h1>
              Fall for the home.
              <br />
              <span>Know the reality.</span>
            </h1>
            <p className="hero-description">
              The listing shows you the dream.
              <br />
              We help you see the whole picture.
            </p>
            <div className="hero-search">
              <AddressSearch onSelect={select} />
              <div className="search-hint">
                <span>Built for South African homebuyers</span>
                <span>
                  Reports from <strong>R99</strong>
                </span>
              </div>
            </div>
            <button className="text-link example-link" onClick={() => select(properties[0])}>
              Take a look inside an example report <ArrowUpRight size={20} />
            </button>
            <div className="hero-footnote">
              <span className="mini-house">
                <HouseLine size={19} />
              </span>
              <span>Your next chapter. With fewer surprises.</span>
            </div>
          </motion.div>
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <img
              className="hero-photo"
              src="/images/hero-house.jpg"
              alt="A sunlit contemporary home, glass doors opening onto a pool and garden"
              fetchPriority="high"
            />
            <div className="hero-photo-shade" />
            <div className="visual-topline">
              <span>
                <span className="live-dot" />
                MORE THAN A LISTING
              </span>
              <Heart size={20} />
            </div>
            <motion.div
              className="floating-evidence"
              animate={reduce ? {} : { y: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="evidence-icon">
                <CheckCircle size={25} weight="fill" />
              </span>
              <span>
                <strong>A little more peace of mind.</strong>
                <small>Clear costs. Local context. Better questions.</small>
              </span>
            </motion.div>
            <div className="photo-location">
              <MapPin size={17} />
              <span>A home is more than an address.</span>
              <small>Representative photography</small>
            </div>
            <motion.div
              className="floating-budget"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="floating-budget-top">
                <span className="small-icon">
                  <Wallet size={19} />
                </span>
                <span>Your monthly reality</span>
                <ArrowUpRight size={19} />
              </div>
              <div className="budget-figure">
                {rand(monthlyTotal(defaultBudget(properties[0])))}
                <small>/ month</small>
              </div>
              <div className="cost-strip">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="floating-budget-footer">
                <span>More than just the bond.</span>
                <span>Example estimate</span>
              </div>
            </motion.div>
          </motion.div>
        </section>
        <div className="trust-strip wrap">
          <span>
            GOOD DECISIONS START
            <br />
            <strong>with the right information.</strong>
          </span>
          <div>
            <Buildings size={25} />
            <span>
              Municipal
              <br />
              Money
            </span>
          </div>
          <div>
            <ShieldCheck size={26} />
            <span>
              SAPS
              <br />
              public statistics
            </span>
          </div>
          <div>
            <MapPin size={26} />
            <span>
              OpenStreetMap
              <br />
              real local context
            </span>
          </div>
          <a href="#the-full-picture">
            Always with sources.
            <br />
            Always in context. <ArrowUpRight size={15} />
          </a>
        </div>
        <section className="picture-section wrap" id="the-full-picture">
          <motion.div className="section-heading" {...reveal}>
            <div>
              <span className="eyebrow">01 / SEE BEYOND THE LISTING</span>
              <h2>
                A beautiful home.
                <br />
                <span>A clearer picture.</span>
              </h2>
            </div>
            <p>
              The price tag is only the beginning.
              <br />
              Meet the details that make a house
              <br />
              feel right for your life.
            </p>
          </motion.div>
          <div className="feature-grid">
            {features.map((f, i) => (
              <motion.article
                className="feature-card"
                key={f.tag}
                {...reveal}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <div className="feature-icon">
                  <f.icon size={28} weight="light" />
                </div>
                <span className="micro-label">{f.tag}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <Link
                  href={`/check/?tab=${i === 0 ? 'budget' : i === 1 ? 'local' : 'evidence'}`}
                  className="round-link"
                  aria-label={`Explore ${f.title}`}
                >
                  <ArrowUpRight size={20} />
                </Link>
              </motion.article>
            ))}
          </div>
        </section>
        <section className="model-section wrap" id="how-it-works">
          <div className="model-stage">
            <div className="model-stage-label">
              <span className="status-dot" />
              YOUR HOME, FROM EVERY ANGLE
            </div>
            <HouseScene hero />
            <span className="model-note">
              An illustration of the possibilities. Not a property survey.
            </span>
          </div>
          <motion.div className="model-copy" {...reveal}>
            <span className="eyebrow">02 / FROM ADDRESS TO ASSURANCE</span>
            <h2>
              Big decision.
              <br />
              <span>Simple steps.</span>
            </h2>
            <p>You bring the address. We bring the perspective.</p>
            <div className="steps">
              <div>
                <span>01</span>
                <section>
                  <h3>Find your maybe-home.</h3>
                  <p>Search a South African address or explore an example.</p>
                </section>
              </div>
              <div>
                <span>02</span>
                <section>
                  <h3>Make the numbers yours.</h3>
                  <p>Adjust your deposit, bond, bills and everyday costs.</p>
                </section>
              </div>
              <div>
                <span>03</span>
                <section>
                  <h3>See it. Save it. Sleep on it.</h3>
                  <p>Compare homes and take your PDF to the next viewing.</p>
                </section>
              </div>
            </div>
            <Link className="button dark" href="/check/">
              Find my reality check <ArrowUpRight size={21} />
            </Link>
          </motion.div>
        </section>
        <section className="life-section wrap">
          <img
            src="/images/interior.jpg"
            alt="Warm, light-filled living room with a sofa, wood furniture and leafy plants"
            loading="lazy"
          />
          <div className="life-shade" />
          <motion.div className="life-copy" {...reveal}>
            <span className="eyebrow">FOR THE LIFE YOU WANT TO LIVE</span>
            <h2>
              Less “what if”.
              <br />
              More welcome home.
            </h2>
            <p>
              Because confidence feels good.
              <br />
              Especially when it comes with the keys.
            </p>
            <Link href="/check/" className="button ivory">
              Explore a reality check <ArrowUpRight size={20} />
            </Link>
          </motion.div>
          <div className="life-badge">
            <Check size={20} />
            <span>Evidence before emotion.</span>
          </div>
        </section>
        <section className="pricing-section wrap" id="pricing">
          <motion.div className="section-heading" {...reveal}>
            <div>
              <span className="eyebrow">03 / A SMALL INVESTMENT IN CLARITY</span>
              <h2>
                Your home. Your homework.
                <br />
                <span>Your choice.</span>
              </h2>
            </div>
            <p>
              No subscriptions. No estate-agent spin.
              <br />
              Choose the perspective you need.
            </p>
          </motion.div>
          <div className="pricing-note">
            <span className="status-dot" />
            MVP EARLY ACCESS · Explore all reports free. Paid checkout coming later.
          </div>
          <div className="pricing-grid">
            {[
              {
                name: 'The first look',
                price: 99,
                desc: 'For the address that caught your eye.',
                items: [
                  'Local evidence & source links',
                  'Nearby places on a real map',
                  'Your ownership budget',
                ],
                cta: 'Explore the first look',
              },
              {
                name: 'The reality check',
                price: 199,
                desc: 'For the home you’re getting serious about.',
                items: [
                  'Everything in The first look',
                  'Adjustable commute allowance',
                  'Viewing checklist & PDF export',
                ],
                cta: 'Explore the reality check',
              },
              {
                name: 'The bigger picture',
                price: 299,
                desc: 'For the shortlist, before the final call.',
                items: [
                  'Everything in The reality check',
                  'Save and compare your homes',
                  'Side-by-side monthly budgets',
                ],
                cta: 'Explore comparisons',
              },
            ].map((p, i) => (
              <motion.article
                className={`pricing-card ${i === 1 ? 'featured' : ''}`}
                key={p.name}
                {...reveal}
              >
                {i === 1 && <span className="popular-label">A LITTLE MORE PERSPECTIVE</span>}
                <h3>{p.name}</h3>
                <p>{p.desc}</p>
                <div className="price">
                  R{p.price}
                  <span>/ report</span>
                </div>
                <div className="pricing-divider" />
                {p.items.map((item) => (
                  <div className="pricing-item" key={item}>
                    <Check size={17} />
                    {item}
                  </div>
                ))}
                <Link
                  href={i === 2 ? '/check/?view=saved' : '/check/'}
                  className={`button ${i === 1 ? 'dark' : 'outline'}`}
                >
                  {p.cta}
                  <ArrowUpRight size={18} />
                </Link>
              </motion.article>
            ))}
          </div>
        </section>
        <section className="faq-section wrap">
          <motion.div {...reveal}>
            <span className="eyebrow">A FEW GOOD QUESTIONS</span>
            <h2>Clarity starts here.</h2>
            <p>
              Knowing what we can tell you
              <br />
              matters as much as knowing what we can’t.
            </p>
          </motion.div>
          <div className="faq-list">
            {faqs.map(([q, a], i) => (
              <div className={`faq-item ${faq === i ? 'expanded' : ''}`} key={q}>
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  aria-expanded={faq === i}
                  aria-controls={`faq-${i}`}
                >
                  {q}
                  {faq === i ? <Minus size={20} /> : <Plus size={20} />}
                </button>
                {faq === i && (
                  <motion.p id={`faq-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {a}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="final-cta wrap">
          <div>
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS WITH CLARITY.</span>
            <h2>
              Make yourself
              <br />
              <span>informed.</span>
            </h2>
          </div>
          <div>
            <Link href="/check/" className="button dark">
              Let’s check your next home <ArrowUpRight size={23} />
            </Link>
            <p>South African homes. Real-life perspective.</p>
          </div>
          <ArrowDown size={80} weight="thin" className="cta-arrow" />
        </section>
      </main>
      <footer className="site-footer wrap">
        <div>
          <Logo />
          <p>
            {brand.productName}.
            <br />
            Evidence before emotion.
          </p>
        </div>
        <div className="footer-links">
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <Link href="/methodology/">Data & methodology</Link>
          <Link href="/guides/home-ownership-costs/">Ownership cost guide</Link>
        </div>
        <div className="footer-bottom">
          <span>
            © {copyrightYear} {brand.name}. Made for South Africa.
          </span>
          <span>Independent property intelligence. No property advertising.</span>
          <span className="south-africa">🇿🇦 With a little perspective.</span>
        </div>
      </footer>
    </div>
  );
}
