const name = 'HomeBuyer';
export const brand = {
  name,
  initials: name.match(/[A-Z]/g)?.join('') || name.slice(0, 2).toUpperCase(),
  productName: `${name} Reality Check`,
  descriptor: 'Homebuyer’s Reality Check',
  tagline: 'Evidence before emotion.',
  description:
    'South African property due diligence: estimate monthly ownership costs, explore local evidence and compare homes before you buy.',
  shortDescription: 'A clearer picture of what owning a home in South Africa could cost.',
  locale: 'en_ZA',
  language: 'en-ZA',
  country: 'ZA',
  currency: 'ZAR',
  themeStorageKey: 'homebuyer:theme',
} as const;

export const publicPages = [
  { path: '/', title: 'South African Property Due Diligence', description: brand.description },
  {
    path: '/methodology/',
    title: 'Data Sources & Report Methodology',
    description: `How ${brand.name} estimates ownership costs and uses South African municipal, police-precinct and OpenStreetMap data, with clear limits.`,
  },
  {
    path: '/guides/home-ownership-costs/',
    title: 'The Monthly Cost of Owning a Home in South Africa',
    description:
      'Plan for bond repayments, rates, levies, utilities, insurance, maintenance and commuting before buying a South African home.',
  },
] as const;
