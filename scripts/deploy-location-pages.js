#!/usr/bin/env node
/**
 * Build location landing pages (Calicut, Malappuram, Kochi, Kerala) from the homepage template.
 */

const fs = require('fs-extra');
const path = require('path');
const { SITE, LOCATION_PAGES, TEMPLATE_SLUG } = require('./location-pages.config');
const { injectLocationHero } = require('./inject-calicut-hero');
const { injectLocationCta } = require('./inject-location-cta');
const { injectLocationFaq } = require('./inject-location-faq');
const { injectLocationModel } = require('./inject-location-model-section');

const root = process.cwd();
const homepage = path.join(root, 'index.html');
const calicutTemplate = path.join(root, TEMPLATE_SLUG, 'index.html');

function applyLocationMeta(html, page) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title} | Aurevo Interiors</title>`)
    .replace(
      /content="Looking for interior designers in [^"]*"/i,
      `content="${page.meta}"`
    )
    .replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${SITE}/${page.slug}/" />`
    )
    .replace(
      /<h1 class="calicut-static-hero__title">[^<]*<\/h1>/,
      `<h1 class="calicut-static-hero__title">${page.title}</h1>`
    );
}

async function deployLocationPages(slugs = null) {
  const pages = slugs
    ? LOCATION_PAGES.filter((page) => slugs.includes(page.slug))
    : LOCATION_PAGES;

  const templatePath = (await fs.pathExists(calicutTemplate)) ? calicutTemplate : homepage;
  const template = await fs.readFile(templatePath, 'utf8');

  for (const page of pages) {
    const destDir = path.join(root, page.slug);
    const dest = path.join(destDir, 'index.html');
    let html = page.slug === TEMPLATE_SLUG && templatePath === calicutTemplate
      ? template
      : applyLocationMeta(template, page);

    await fs.ensureDir(destDir);
    await fs.writeFile(dest, html, 'utf8');
    console.log(`Wrote ${page.slug}/index.html`);
    await injectLocationHero(page);
    injectLocationCta(page);
    injectLocationModel(page);
    injectLocationFaq(page);
  }
}

module.exports = { deployLocationPages, applyLocationMeta };

if (require.main === module) {
  const slugs = process.argv.slice(2).filter(Boolean);
  deployLocationPages(slugs.length ? slugs : null).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
