import Link from 'next/link';
import { brand } from '@/lib/brand';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label={`${brand.name} home`}>
      <svg
        className="brand-icon"
        width="42"
        height="42"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tile" x1="6" y1="2" x2="60" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#50594a" />
            <stop offset="1" stopColor="#20271e" />
          </linearGradient>
          <linearGradient id="wall" x1="16" y1="24" x2="43" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffdf1" />
            <stop offset="1" stopColor="#c9c8b4" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity=".25" />
          </filter>
        </defs>
        <rect x="1" y="1" width="62" height="62" rx="18" fill="url(#tile)" />
        <rect x="2" y="2" width="60" height="60" rx="17" stroke="white" strokeOpacity=".12" />
        <g filter="url(#shadow)">
          <path d="M14 30L32 16L49 29V47L31 53L14 43V30Z" fill="url(#wall)" />
          <path d="M32 16L51 27L32 35L13 26L32 16Z" fill="#ececdd" />
          <path d="M32 35L49 29V47L32 53V35Z" fill="#b9bca5" />
          <path d="M14 30L32 36V52L14 43V30Z" fill="#eeeee0" />
          <path d="M22 37L28 40V48L22 45V37Z" fill="#565e48" />
        </g>
        <circle cx="46" cy="44" r="11" fill="#e5f5a6" />
        <path
          d="M41 44L44 47L50 40"
          stroke="#343e23"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <span>
          {brand.name}
          <span className="brand-dot">.</span>
        </span>
      )}
    </Link>
  );
}
