const SITE = 'https://aurevointerios.vercel.app';

const LOCATION_PAGES = [
  {
    slug: 'interior-designers-in-calicut',
    city: 'Calicut',
    title: 'Interior Designers in Calicut',
    meta:
      'Looking for interior designers in Calicut? Aurevo Interiors brings the same award-winning home design expertise to Kozhikode and across Kerala.',
  },
  {
    slug: 'interior-designers-in-malappuram',
    city: 'Malappuram',
    title: 'Interior design company | Interior Designers in Malappuram',
    meta:
      'Aurevo Interiors is a leading interior design company in Malappuram with 6+ years of experience and 100+ completed projects. Transform your space with expert interior designers.',
  },
  {
    slug: 'interior-designers-in-kochi',
    city: 'Kochi',
    title: 'Interior Designers in Kochi, Ernakulam | Aurevo Interiors',
    meta:
      'Aurevo Interiors offers expert home and office interiors in Kochi, Ernakulam, with 6+ years of experience and 100+ completed projects. Book a consultation today!',
  },
  {
    slug: 'interior-designers-in-kerala',
    city: 'Kerala',
    title: 'Interior Designers in Kerala',
    meta:
      'Aurevo Interiors is an interior design company in Kerala with 6+ years of experience and 100+ completed projects. Book a consultation today.',
  },
];

const TEMPLATE_SLUG = 'interior-designers-in-calicut';

const LEGACY_LOCATION_SLUGS = {
  calicut: 'interior-designers-in-calicut',
  malappuram: 'interior-designers-in-malappuram',
  kochi: 'interior-designers-in-kochi',
  kerala: 'interior-designers-in-kerala',
};

module.exports = { SITE, LOCATION_PAGES, TEMPLATE_SLUG, LEGACY_LOCATION_SLUGS };
