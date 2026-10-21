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
    title: 'Interior Designers in Malappuram',
    meta:
      'Looking for interior designers in Malappuram? Aurevo Interiors delivers premium home and commercial interior design across Malappuram district.',
  },
  {
    slug: 'interior-designers-in-kochi',
    city: 'Kochi',
    title: 'Interior Designers in Kochi',
    meta:
      'Looking for interior designers in Kochi? Aurevo Interiors offers bespoke interior design for homes and offices across Ernakulam and Kochi.',
  },
  {
    slug: 'interior-designers-in-kerala',
    city: 'Kerala',
    title: 'Interior Designers in Kerala',
    meta:
      'Looking for interior designers in Kerala? Aurevo Interiors delivers award-winning home and office interior design across Calicut, Kochi, Malappuram and all of Kerala.',
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
