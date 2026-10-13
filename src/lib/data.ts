export type Amenity = {
  name: string;
  category: 'health' | 'transport' | 'green' | 'shop';
  lat: number;
  lng: number;
  source: string;
};
export type AuditTone = 'clean' | 'findings' | 'qualified';
export type MunicipalProfile = {
  id: string;
  name: string;
  match: string[];
  opinionLabel: string;
  insight: string;
  year: string;
  tone: AuditTone;
  summary: string;
  detail?: string;
  years?: string[];
  source: string;
  sourceLabel: string;
  extraSource?: string;
  extraSourceLabel?: string;
  treasury: string;
};
export type Property = {
  id: string;
  address: string;
  suburb: string;
  city: string;
  lat: number;
  lng: number;
  price: number;
  rates: number;
  levy: number;
  utilities: number;
  image: string;
  municipality?: string;
  municipalityId?: string;
  station?: string;
  stationNote?: string;
  amenities: Amenity[];
  example: boolean;
};

export const sources = {
  audit:
    'https://www.capetown.gov.za/media-and-news/mayor-welcomes-cape-town-s-clean-audit-from-ag/',
  westernCape: 'https://mfma-2024.agsareports.co.za/pages/province-western-cape',
  gauteng: 'https://mfma-2024.agsareports.co.za/pages/province-gauteng',
  metros: 'https://mfma-2024.agsareports.co.za/pages/metros-performance',
  johannesburg: 'https://mfma-2024.agsareports.co.za/municipality/3-city-of-johannesburg-metro',
  ethekwini: 'https://mfma-2024.agsareports.co.za/district/4-ethekwini-metro',
  treasury: 'https://municipalmoney.gov.za/profiles/municipality-CPT-cape-town/',
  johannesburgTreasury:
    'https://municipalmoney.gov.za/profiles/municipality-JHB-city-of-johannesburg/',
  ethekwiniTreasury: 'https://municipalmoney.gov.za/profiles/municipality-ETH-ethekwini/',
  tshwaneTreasury: 'https://municipalmoney.gov.za/profiles/municipality-TSH-city-of-tshwane/',
  police: 'https://www.saps.gov.za/services/crimestats.php',
  precinct:
    'https://obsid.org.za/wp-content/uploads/2024/04/OBSID-5-year-implementation-plan-2017-2022.pdf',
  crime: 'https://capetowndata.com/en/reports/crime/woodstock/',
};

export const municipalities: MunicipalProfile[] = [
  {
    id: 'cape-town',
    name: 'City of Cape Town',
    match: ['cape town'],
    opinionLabel: 'Clean audit',
    insight: 'Clean audit · 2023/24',
    year: 'FY 2023/24',
    tone: 'clean',
    summary:
      'The City reported a clean audit for 2023/24. AGSA’s Western Cape chapter says Cape Town has sustained a clean audit each year since moving on from an unqualified opinion with findings in 2020/21.',
    years: ['2021/22', '2022/23', '2023/24'],
    source: sources.audit,
    sourceLabel: 'City of Cape Town · FY 2023/24 release',
    treasury: sources.treasury,
  },
  {
    id: 'johannesburg',
    name: 'City of Johannesburg',
    match: [
      'johannesburg',
      'sandton',
      'randburg',
      'roodepoort',
      'soweto',
      'midrand',
      'rosebank',
      'alexandra',
    ],
    opinionLabel: 'Unqualified with findings',
    insight: 'Unqualified · 2023/24',
    year: 'FY 2023/24',
    tone: 'findings',
    summary:
      'AGSA records an unqualified opinion with findings for 2023-24, unchanged from the year before. There were findings on the performance report and on compliance with legislation.',
    detail:
      'The same municipal page says the City took an average of 311 days to pay creditors, and that 92% of municipal debt was unlikely to be recovered. Those are metro-wide indicators, not this property’s account.',
    source: sources.johannesburg,
    sourceLabel: 'AGSA · City of Johannesburg 2023-24',
    treasury: sources.johannesburgTreasury,
  },
  {
    id: 'ethekwini',
    name: 'eThekwini Municipality',
    match: ['ethekwini', 'durban', 'umhlanga', 'pinetown'],
    opinionLabel: 'Unqualified with findings',
    insight: 'Unqualified · 2023/24',
    year: 'FY 2023/24',
    tone: 'findings',
    summary:
      'AGSA’s 2023-24 eThekwini table records an unqualified opinion with findings. The five-year table shows that same opinion each year from 2019/20 to 2023/24, and no clean audit in that period.',
    source: sources.ethekwini,
    sourceLabel: 'AGSA · eThekwini Metro 2023-24',
    treasury: sources.ethekwiniTreasury,
  },
  {
    id: 'tshwane',
    name: 'City of Tshwane',
    match: ['tshwane', 'pretoria', 'centurion', 'menlo'],
    opinionLabel: 'Qualified opinion',
    insight: 'Qualified · 2023/24',
    year: 'FY 2023/24',
    tone: 'qualified',
    summary:
      'AGSA’s 2023-24 Gauteng report says the City of Tshwane received a qualified opinion, with fewer qualification areas than before.',
    detail:
      'The metros performance chapter says Tshwane has disclosed significant doubt about its ability to continue as a going concern for four years or more. That is a municipal finance warning, not a comment on one house.',
    source: sources.gauteng,
    sourceLabel: 'AGSA · Gauteng 2023-24',
    extraSource: sources.metros,
    extraSourceLabel: 'AGSA · metro financial performance',
    treasury: sources.tshwaneTreasury,
  },
];

export function municipalityFor(property: Pick<Property, 'city' | 'suburb' | 'municipalityId'>) {
  if (property.municipalityId)
    return municipalities.find((item) => item.id === property.municipalityId);
  const hay = `${property.suburb} ${property.city}`.toLowerCase();
  return municipalities.find((item) => item.match.some((key) => hay.includes(key)));
}

export function withMunicipality(property: Property): Property {
  const profile = municipalityFor(property);
  if (!profile) return property;
  return { ...property, municipality: profile.name, municipalityId: profile.id };
}

export const properties: Property[] = [
  {
    id: 'observatory',
    address: '14 Lower Main Road',
    suburb: 'Observatory',
    city: 'Cape Town',
    lat: -33.9364,
    lng: 18.4683,
    price: 2450000,
    rates: 1650,
    levy: 0,
    utilities: 2400,
    image: '/images/hero-house.jpg',
    municipality: 'City of Cape Town',
    municipalityId: 'cape-town',
    station: 'Woodstock SAPS',
    example: true,
    amenities: [
      {
        name: 'Observatory railway station',
        category: 'transport',
        lat: -33.93796,
        lng: 18.4715,
        source: 'https://www.openstreetmap.org/node/25537975',
      },
      {
        name: 'Groote Schuur Hospital',
        category: 'health',
        lat: -33.9418,
        lng: 18.4622,
        source: 'https://www.westerncape.gov.za/health-wellness/groote-schuur-hospital',
      },
      {
        name: 'Liesbeek River Trail',
        category: 'green',
        lat: -33.9446,
        lng: 18.4773,
        source: 'https://www.openstreetmap.org/search?query=Liesbeek%20River%20Cape%20Town',
      },
      {
        name: 'Checkers, Liesbeek Parkway',
        category: 'shop',
        lat: -33.934753,
        lng: 18.475362,
        source: 'https://www.openstreetmap.org/node/12484509168',
      },
      {
        name: 'The Old Biscuit Mill',
        category: 'shop',
        lat: -33.9276,
        lng: 18.4572,
        source: 'https://theoldbiscuitmill.co.za/',
      },
    ],
  },
  {
    id: 'parkhurst',
    address: '8 Fourth Avenue',
    suburb: 'Parkhurst',
    city: 'Johannesburg',
    lat: -26.1395,
    lng: 28.0195,
    price: 3150000,
    rates: 2350,
    levy: 0,
    utilities: 3600,
    image: '/images/interior.jpg',
    municipality: 'City of Johannesburg',
    municipalityId: 'johannesburg',
    station: 'Parkview SAPS',
    stationNote:
      'OpenStreetMap places Parkview police station about 2.3 km south of this example pin. Confirm the precinct boundary; no station time series is stored here.',
    example: true,
    amenities: [
      {
        name: 'Delta Park',
        category: 'green',
        lat: -26.1235,
        lng: 28.0126,
        source: 'https://www.openstreetmap.org/search?query=Delta%20Park%20Johannesburg',
      },
      {
        name: 'Rosebank Gautrain station',
        category: 'transport',
        lat: -26.1463,
        lng: 28.0438,
        source: 'https://www.gautrain.co.za/',
      },
      {
        name: 'Netcare Rosebank Hospital',
        category: 'health',
        lat: -26.14634,
        lng: 28.0393,
        source: 'https://www.openstreetmap.org/way/791285353',
      },
      {
        name: 'Woolworths Food, 2nd Avenue',
        category: 'shop',
        lat: -26.13755,
        lng: 28.00778,
        source: 'https://www.openstreetmap.org/node/5159087927',
      },
    ],
  },
  {
    id: 'umhlanga',
    address: '22 Chartwell Drive',
    suburb: 'Umhlanga',
    city: 'Durban',
    lat: -29.7285,
    lng: 31.0846,
    price: 4980000,
    rates: 3900,
    levy: 1800,
    utilities: 4200,
    image: '/images/living.jpg',
    municipality: 'eThekwini Municipality',
    municipalityId: 'ethekwini',
    stationNote:
      'No police station is assigned. The nearest confidently named OpenStreetMap station was too far to treat as this precinct.',
    example: true,
    amenities: [
      {
        name: 'Umhlanga promenade',
        category: 'green',
        lat: -29.7274,
        lng: 31.0888,
        source: 'https://www.openstreetmap.org/search?query=Umhlanga%20Promenade',
      },
      {
        name: 'Umhlanga Lagoon Nature Reserve',
        category: 'green',
        lat: -29.71293,
        lng: 31.092187,
        source: 'https://www.openstreetmap.org/node/345458720',
      },
      {
        name: 'Netcare uMhlanga Hospital',
        category: 'health',
        lat: -29.728092,
        lng: 31.069319,
        source: 'https://www.openstreetmap.org/way/743150546',
      },
      {
        name: 'Gateway Theatre of Shopping',
        category: 'shop',
        lat: -29.726,
        lng: 31.06529,
        source: 'https://www.openstreetmap.org/way/40943223',
      },
    ],
  },
  {
    id: 'menlo',
    address: '27 Atterbury Road',
    suburb: 'Menlo Park',
    city: 'Pretoria',
    lat: -25.774,
    lng: 28.265,
    price: 2290000,
    rates: 1480,
    levy: 0,
    utilities: 2800,
    image: '/images/hero-house.jpg',
    municipality: 'City of Tshwane',
    municipalityId: 'tshwane',
    station: 'Brooklyn SAPS',
    stationNote:
      'OpenStreetMap places Brooklyn police station in Pretoria about 3.4 km from this example pin. Confirm the precinct boundary; no station time series is stored here.',
    example: true,
    amenities: [
      {
        name: 'Menlyn Park',
        category: 'shop',
        lat: -25.7828,
        lng: 28.275,
        source: 'https://www.menlynpark.co.za/',
      },
      {
        name: 'Checkers Hyper, Menlyn',
        category: 'shop',
        lat: -25.78317,
        lng: 28.27465,
        source: 'https://www.openstreetmap.org/node/288565568',
      },
      {
        name: 'Brooklyn Mall',
        category: 'shop',
        lat: -25.7712,
        lng: 28.2341,
        source: 'https://www.brooklynmall.co.za/',
      },
    ],
  },
];

export const checklist = [
  {
    title: 'Get the electrical compliance certificate',
    detail:
      'Request a valid certificate and have an electrician assess any changes or solar installation.',
    icon: 'electric',
  },
  {
    title: 'Look beyond the fresh coat of paint',
    detail:
      'Book an independent inspection. Check the roof, damp, drainage and cracks, ideally after rain.',
    icon: 'house',
  },
  {
    title: 'Ask for the actual monthly bills',
    detail:
      'Request recent municipal accounts, insurance quotes, levies and any special levy notices.',
    icon: 'bill',
  },
  {
    title: 'Experience the neighbourhood',
    detail:
      'Visit on a weekday and after dark. Talk to neighbours and the local community policing forum.',
    icon: 'people',
  },
];

export function distanceKm(lat: number, lng: number, lat2: number, lng2: number) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat) / 2) ** 2 +
    Math.cos(rad(lat)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export function distanceLabel(km: number) {
  return km < 1 ? `${Math.round((km * 1000) / 10) * 10} m` : `${km.toFixed(1)} km`;
}
