import { ImageResponse } from 'next/og';

// The installed icon uses the same vector artwork as public/icon.svg.
// Keep this source in sync if the brand logo is updated.
const brandedLogo = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"a\" x2=\"1\" y2=\"1\"><stop stop-color=\"#50594a\"/><stop offset=\"1\" stop-color=\"#20271e\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"18\" fill=\"url(#a)\"/><path d=\"M14 30 32 16 49 29v18l-18 6-17-10z\" fill=\"#dedfce\"/><path d=\"m32 16 19 11-19 8-19-9z\" fill=\"#fffdf1\"/><path d=\"m32 35 17-6v18l-17 6z\" fill=\"#aeb39c\"/><path d=\"m22 37 6 3v8l-6-3z\" fill=\"#50594a\"/><circle cx=\"46\" cy=\"44\" r=\"11\" fill=\"#e5f5a6\"/><path d=\"m41 44 3 3 6-7\" fill=\"none\" stroke=\"#343e23\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\n";
const svgDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(brandedLogo).toString('base64');

export function brandedPwaIcon(size: number, maskable = false) {
  // Android adaptive masks can crop outside the centre safe area.
  const artworkSize = maskable ? Math.round(size * 0.70) : size;
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#30392b',
        }}
      >
        <img src={svgDataUrl} width={artworkSize} height={artworkSize} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
