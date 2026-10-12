import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { brand } from '@/lib/brand';

export const dynamic = 'force-static';
export async function GET() {
  const [font, photo, icon] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/manrope-500.ttf')),
    readFile(join(process.cwd(), 'public/images/hero-house.jpg')),
    readFile(join(process.cwd(), 'public/icon.svg')),
  ]);
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        padding: '57px 62px',
        background: '#f5f4ee',
        color: '#2c3028',
        fontFamily: 'Manrope',
        gap: 30,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: 615, height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <img
            src={`data:image/svg+xml;base64,${icon.toString('base64')}`}
            width={49}
            height={49}
            alt=""
          />
          <span style={{ fontSize: 35, letterSpacing: -1.6 }}>{brand.name}.</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 12,
            letterSpacing: 2.1,
            color: '#6c7858',
            marginTop: 55,
          }}
        >
          PROPERTY DUE DILIGENCE · SOUTH AFRICA
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 65,
            lineHeight: 1.12,
            letterSpacing: -3.5,
            marginTop: 23,
          }}
        >
          <span>Fall for the home.</span>
          <span style={{ color: '#788763' }}>Know the reality.</span>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 25,
            fontSize: 20,
            lineHeight: 1.6,
            color: '#768066',
            maxWidth: 460,
          }}
        >
          Ownership costs. Local evidence. A clearer next step.
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 14,
            color: '#6d795a',
            marginTop: 'auto',
            paddingTop: 23,
          }}
        >
          {brand.descriptor} · {brand.tagline}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          width: 395,
          height: '100%',
          borderRadius: '165px 165px 23px 23px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <img
          src={`data:image/jpeg;base64,${photo.toString('base64')}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          alt="Representative modern residential architecture"
        />
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 23,
            left: 20,
            right: 20,
            padding: '16px 18px',
            borderRadius: 14,
            background: '#ecf2dce8',
            color: '#455838',
            fontSize: 16,
            lineHeight: 1.5,
          }}
        >
          A home is more than an address.
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Manrope', data: font, style: 'normal', weight: 500 }],
    },
  );
}
