export type Amenity = {
  name: string;
  category: 'health' | 'transport' | 'green' | 'shop';
  lat: number;
  lng: number;
  source: string;
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
  station?: string;
  amenities: Amenity[];
  example: boolean;
};

export const sources = {
  audit:
    'https://www.capetown.gov.za/media-and-news/mayor-welcomes-cape-town-s-clean-audit-from-ag/',
  treasury: 'https://municipalmoney.gov.za/profiles/municipality-CPT-cape-town/',
  police: 'https://www.saps.gov.za/services/crimestats.php',
  precinct:
    'https://obsid.org.za/wp-content/uploads/2024/04/OBSID-5-year-implementation-plan-2017-2022.pdf',
  crime: 'https://capetowndata.com/en/reports/crime/woodstock/',
};

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
    station: 'Woodstock SAPS',
    example: true,
    amenities: [
      {
        name: 'Observatory railway station',
        category: 'transport',
        lat: -33.938,
        lng: 18.4716,
        source: 'https://www.openstreetmap.org/search?query=Observatory%20Station%20Cape%20Town',
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
    station: 'Linden SAPS (verify boundary)',
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
        name: 'Gateway Theatre of Shopping',
        category: 'shop',
        lat: -29.7254,
        lng: 31.0666,
        source: 'https://gatewayworld.co.za/',
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
