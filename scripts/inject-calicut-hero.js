#!/usr/bin/env node
/**
 * Replace Calicut page hero with Home 03 hero slider (Interiqué demo).
 * Everything else on the page stays unchanged.
 */

const fs = require('fs-extra');
const path = require('path');
const { LOCATION_PAGES } = require('./location-pages.config');

const root = process.cwd();
const home03Path = path.join(root, 'static-site/home-03/index.html');
const staticRoot = path.join(root, 'static-site');
const heroImgDir = path.join(root, 'wp-content/uploads/custom/calicut-hero');
const heroElementorCssPath = path.join(
  staticRoot,
  'wp-content/uploads/sites/2/elementor/css/post-17837__q_P3Zlcj0xNzQ4MzQ1Mzc2.css'
);

const HERO_IMAGES = [
  'wp-content/uploads/sites/2/2025/04/Modern-Sage-Armchair-2-1920x1200.jpeg',
  'wp-content/uploads/sites/2/2025/04/stylish-compositon-modern-living-room-interior-with-frotte-armchair-sofa-plants-painting-wooden-commode-side-table-elegant-home-accessories-template-copy-spacexa-1920x1200.jpg',
  'wp-content/uploads/sites/2/2025/04/Modern-Translucent-Green-Chair-1920x1200.jpeg',
  'wp-content/uploads/sites/2/2025/04/3d-rendering-loft-style-living-room-interior-design.jpg',
];

const HERO_IMAGE_MAP = {
  'Modern-Sage-Armchair-2-1920x1200.jpeg': 'slide-1.jpeg',
  'stylish-compositon-modern-living-room-interior-with-frotte-armchair-sofa-plants-painting-wooden-commode-side-table-elegant-home-accessories-template-copy-spacexa-1920x1200.jpg': 'slide-2.jpg',
  'Modern-Translucent-Green-Chair-1920x1200.jpeg': 'slide-3.jpeg',
  '3d-rendering-loft-style-living-room-interior-design.jpg': 'slide-4.jpg',
};

function extractHero(html) {
  const start = html.indexOf('elementor-element-1725d48');
  if (start === -1) throw new Error('Home 03 hero not found');
  const open = html.lastIndexOf('<div class="elementor-element elementor-element-1725d48', start);
  const endMarker = '<div class="elementor-element elementor-element-185a85d5';
  const end = html.indexOf(endMarker, open);
  if (end === -1) throw new Error('Home 03 hero end not found');
  return html.slice(open, end);
}

const HERO_IMAGE = '/wp-content/uploads/custom/calicut-hero/slide-1.jpeg';
const HERO_IMAGE_MOBILE = '/wp-content/uploads/custom/calicut-hero/slide-1-mobile.jpeg';
const HERO_BTN_ARROW =
  '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polyline fill="none" stroke="currentColor" points="10 5 15 9.5 10 14"></polyline><line fill="none" stroke="currentColor" x1="4" y1="9.5" x2="15" y2="9.5"></line></svg>';

function pickHeroText(html, pattern, fallback) {
  const match = html.match(pattern);
  return match ? match[1].replace(/\s+/g, ' ').trim() : fallback;
}

function buildStaticHero(sourceHtml, pageTitle) {
  const eyebrow = pickHeroText(sourceHtml, /class="bdt-ps-sub-title"[^>]*>\s*([\s\S]*?)\s*<\/h4>/, 'Furniture Selection');
  const title = pageTitle;
  const text = pickHeroText(sourceHtml, /class="bdt-slider-excerpt"[^>]*>\s*<p>([\s\S]*?)<\/p>/, 'Welcome to Interique, where exceptional design meets innovative solutions. We specialize in creating spaces that are both beautiful and functional, reflecting your individuality and style.');

  return `<div class="elementor-element elementor-element-1725d48 e-con-full e-flex e-con e-parent" data-id="1725d48" data-element_type="container">
				<div class="elementor-element elementor-element-9e51013 elementor-widget-tablet__width-inherit full elementor-widget elementor-widget-prime-slider-general" data-id="9e51013" data-element_type="widget" data-widget_type="prime-slider-general.crelly">
				<div class="elementor-widget-container">
      <section class="calicut-static-hero" id="calicut-static-hero" aria-label="Hero">
        <div class="calicut-static-hero__media" role="img" aria-label="Interior design hero image" style="background-image: url('${HERO_IMAGE}')"></div>
        <div class="calicut-static-hero__shade" aria-hidden="true"></div>
        <div class="calicut-static-hero__inner">
          <div class="calicut-static-hero__content">
            <p class="calicut-static-hero__eyebrow">${eyebrow}</p>
            <h1 class="calicut-static-hero__title">${title}</h1>
            <div class="calicut-static-hero__rule" aria-hidden="true"></div>
            <p class="calicut-static-hero__text">${text}</p>
            <div class="calicut-static-hero__actions">
            <a class="calicut-static-hero__btn calicut-static-hero__btn--primary" href="/contact/">
              <span>Get Free Design Consultation</span>
              ${HERO_BTN_ARROW}
            </a>
            <a class="calicut-static-hero__btn calicut-static-hero__btn--secondary" href="/portfolio/">
              <span>View Projects</span>
              ${HERO_BTN_ARROW}
            </a>
            </div>
          </div>
        </div>
      </section>
				</div>
				</div>
				</div>`;
}

function adaptHero(html, pageTitle) {
  return buildStaticHero(html, pageTitle);
}

function replaceCalicutHero(html, hero) {
  const endMarker = '<div class="elementor-element elementor-element-6d5b6a0';
  const bodyStart = html.indexOf('<body');
  const searchFrom = bodyStart === -1 ? 0 : bodyStart;
  for (const id of ['0e19e94', '1725d48']) {
    const openNeedle = `<div class="elementor-element elementor-element-${id}`;
    const open = html.indexOf(openNeedle, searchFrom);
    if (open === -1) continue;
    const end = html.indexOf(endMarker, open);
    if (end === -1) throw new Error('Calicut hero end not found');
    return html.slice(0, open) + hero + html.slice(end);
  }
  throw new Error('Calicut hero start not found');
}

function ensureHeadAssets(html) {
  let out = html;
  if (!out.includes('ps-general-css')) {
    out = out.replace(
      /(<link[^>]*id=['"]ps-blog-css['"][^>]*>)/,
      `$1\n<link rel='stylesheet' id='ps-general-css' href='/wp-content/plugins/bdthemes-prime-slider-lite/assets/css/ps-general.css?ver=4.1.1' type='text/css' media='all' />`
    );
  }
  const preload = `<link rel="preload" as="image" href="${HERO_IMAGE_MOBILE}" media="(max-width: 767px)" fetchpriority="high" />\n<link rel="preload" as="image" href="${HERO_IMAGE}" media="(min-width: 768px)" fetchpriority="high" />`;
  if (!out.includes('slide-1-mobile.jpeg')) {
    out = out.replace('</head>', `${preload}\n</head>`);
  }
  return out;
}

function stripMediaQueries(css) {
  let result = '';
  let i = 0;
  while (i < css.length) {
    if (css.startsWith('@media', i)) {
      let depth = 0;
      let j = css.indexOf('{', i);
      if (j === -1) break;
      depth = 1;
      j += 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth += 1;
        else if (css[j] === '}') depth -= 1;
        j += 1;
      }
      i = j;
      continue;
    }
    result += css[i];
    i += 1;
  }
  return result;
}

function loadHeroElementorCss() {
  if (!fs.existsSync(heroElementorCssPath)) return '';
  const css = stripMediaQueries(fs.readFileSync(heroElementorCssPath, 'utf8'));
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const start = css.indexOf('.elementor-17837', i);
    if (start === -1) break;
    const end = css.indexOf('}', start);
    const rule = css.slice(start, end + 1);
    if (rule.includes('9e51013') || rule.includes('1725d48')) {
      rules.push(rule.replace(/\.elementor-17837\s+/g, ''));
    }
    i = end + 1;
  }
  return rules.join('\n');
}

function heroTypographyCss() {
  return `
  .elementor-element-9e51013 .bdt-prime-slider .bdt-prime-slider-desc .bdt-ps-sub-title {
    font-size: 14px !important;
    font-weight: 400 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
  }
  .elementor-element-9e51013 .bdt-prime-slider .bdt-prime-slider-desc .bdt-main-title {
    width: min(760px, 90vw) !important;
    margin-bottom: 29px !important;
  }
  .elementor-element-9e51013 .bdt-prime-slider .bdt-prime-slider-desc .bdt-main-title .bdt-title-tag {
    font-size: clamp(3.5rem, 10vw, 9rem) !important;
    font-weight: 600 !important;
    line-height: 0.85em !important;
    letter-spacing: -0.07em !important;
  }
  .elementor-element-9e51013 .bdt-prime-slider .bdt-slider-excerpt {
    font-size: 17px !important;
    line-height: 1.5em !important;
    max-width: 583px !important;
  }
  @media (max-width: 1024px) {
    .elementor-element-9e51013 .bdt-prime-slider .bdt-prime-slider-desc .bdt-main-title .bdt-title-tag {
      font-size: clamp(2.8rem, 7.4vw, 5.5rem) !important;
    }
    .elementor-element-9e51013 .bdt-prime-slider .bdt-prime-slider-desc .bdt-main-title {
      width: min(540px, 90vw) !important;
    }
  }
  @media (max-width: 767px) {
    .elementor-element-9e51013 .bdt-prime-slider .bdt-prime-slider-desc .bdt-main-title .bdt-title-tag {
      font-size: clamp(2.4rem, 12vw, 3.4rem) !important;
    }
    .elementor-element-9e51013 .bdt-prime-slider .bdt-prime-slider-desc .bdt-main-title {
      width: min(320px, 92vw) !important;
    }
    .elementor-element-9e51013 .bdt-prime-slider .bdt-slider-excerpt {
      font-size: 15px !important;
    }
  }`;
}

function heroVisibilityCss() {
  return `<style id="calicut-home03-hero-fix">
  .elementor-element-1725d48,
  .elementor-element-9e51013,
  .elementor-element-9e51013 > .elementor-widget-container {
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .calicut-static-hero {
    position: relative;
    width: 100%;
    min-height: clamp(620px, 92vh, 920px);
    height: clamp(620px, 92vh, 920px);
    overflow: hidden;
    display: block;
    background-color: #3d4a3a;
  }
  .calicut-static-hero__media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    z-index: 0;
  }
  .calicut-static-hero__shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.02) 100%);
    z-index: 1;
    pointer-events: none;
  }
  .calicut-static-hero__inner {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 8% 7%;
    box-sizing: border-box;
  }
  .calicut-static-hero__content {
    max-width: 760px;
  }
  .calicut-static-hero__eyebrow {
    color: rgba(255,255,255,0.85);
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0 0 17px;
  }
  .calicut-static-hero__title {
    color: #ffffff;
    font-size: clamp(2rem, 4.2vw, 4.25rem);
    font-weight: 600;
    line-height: 1.08;
    letter-spacing: -0.04em;
    margin: 0 0 24px;
    max-width: 20ch;
    text-transform: none;
  }
  .calicut-static-hero__rule {
    width: 56px;
    height: 1px;
    background: rgba(255,255,255,0.35);
    margin-bottom: 28px;
  }
  .calicut-static-hero__text {
    color: rgba(255,255,255,0.8);
    font-size: 17px;
    line-height: 1.5;
    max-width: 583px;
    margin: 0 0 40px;
  }
  .calicut-static-hero__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    width: 100%;
  }
  .calicut-static-hero__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-sizing: border-box;
    background: #ffffff;
    color: #000000;
    border: 1px solid #ffffff;
    font-weight: 400;
    line-height: 1.2;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    text-align: center;
    transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
  }
  .calicut-static-hero__btn--primary,
  .calicut-static-hero__btn--secondary {
    flex: 0 0 auto;
    min-height: 52px;
    padding: 16px 28px;
    border-radius: 8px;
    font-size: 14px;
    letter-spacing: 0.08em;
  }
  .calicut-static-hero__btn--primary svg,
  .calicut-static-hero__btn--secondary svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
  .calicut-static-hero__btn:hover {
    background: rgba(255,255,255,0.9);
    color: #000000;
    border-color: #ffffff;
  }
  @media (max-width: 1024px) {
    .calicut-static-hero__title { font-size: clamp(1.85rem, 5vw, 3.25rem); max-width: 18ch; }
    .calicut-static-hero__inner { padding: 10% 6%; }
  }
  @media (max-width: 991px) {
    html.is-header-transparent .site-header:not(.clone) .site-branding-wrap {
      padding: 0 !important;
    }
  }
  @media (max-width: 767px) {
    html.is-header-float.is-header-small .site-header ~ .elementor,
    html.is-header-float.is-header-small .site-header ~ .elementor.elementor-14997 {
      margin-top: 0 !important;
      padding-top: 0 !important;
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
      gap: 0 !important;
    }
    html.is-header-transparent .site-header:not(.clone) {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 120;
    }
    .elementor-element-1725d48,
    .elementor-element-9e51013,
    .elementor-element-9e51013 > .elementor-widget-container {
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .elementor-element-1725d48 + .elementor-element {
      margin-top: 0 !important;
      padding-top: 28px !important;
    }
    .calicut-static-hero {
      position: relative;
      height: 72vh;
      min-height: 72vh;
      max-height: none;
      margin: 0 !important;
      padding: 0 !important;
      background-color: #3d4a3a;
    }
    .calicut-static-hero__media {
      background-image: url('${HERO_IMAGE_MOBILE}') !important;
      background-position: center center;
      background-size: cover;
    }
    .calicut-static-hero__shade {
      background: linear-gradient(
        180deg,
        rgba(6, 6, 6, 0.14) 0%,
        rgba(6, 6, 6, 0.22) 50%,
        rgba(6, 6, 6, 0.34) 100%
      );
    }
    html.is-header-transparent .site-header:not(.clone) .header-wrap,
    html.is-header-transparent .site-header:not(.clone) .header-wrap-inner {
      min-height: 0 !important;
      height: auto !important;
    }
    html.is-header-transparent .site-header:not(.clone) .header-wrap-inner {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px !important;
    }
    html.is-header-transparent .site-header:not(.clone) .header-wrap {
      line-height: 1 !important;
    }
    html.is-header-transparent .site-header:not(.clone) .site-branding,
    html.is-header-transparent .site-header:not(.clone) .site-branding-wrap {
      padding: 0 !important;
      margin: 0 !important;
      max-height: 40px !important;
      min-height: 0 !important;
    }
    html.is-header-transparent .site-header:not(.clone) .site-navigation {
      position: static !important;
      flex: 0 0 auto;
      margin: 0 !important;
      padding: 0 !important;
    }
    html.is-header-transparent .site-header:not(.clone) .site-branding-center img,
    html.is-header-transparent .site-header:not(.clone) .site-branding-center .logo-negative {
      max-height: 34px !important;
      width: auto !important;
      height: auto !important;
      object-fit: contain !important;
    }
    html.is-header-transparent .site-header:not(.clone) .site-title {
      margin: 0 !important;
      line-height: 1 !important;
    }
    html.is-header-transparent .site-header:not(.clone) .site-title a {
      padding: 0 !important;
    }
    html.is-header-transparent .site-header:not(.clone) .header-wrap-inner {
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }
    html.is-header-transparent .site-header:not(.clone) .menu-wrap {
      line-height: 1 !important;
    }
    .calicut-static-hero__inner {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      min-height: 0;
      height: 100%;
      padding: 0 22px;
      box-sizing: border-box;
    }
    .calicut-static-hero__content {
      max-width: none;
      width: 100%;
      margin: 0;
      text-align: left;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .calicut-static-hero__eyebrow {
      font-size: 10px;
      letter-spacing: 0.14em;
      margin: 0 0 10px;
    }
    .calicut-static-hero__title {
      font-size: clamp(1.55rem, 7.4vw, 2rem);
      max-width: 12ch;
      line-height: 1.06;
      letter-spacing: -0.03em;
      margin: 0 0 12px;
      text-align: left;
    }
    .calicut-static-hero__rule {
      width: 40px;
      margin: 0 0 12px;
    }
    .calicut-static-hero__text {
      font-size: 13px;
      line-height: 1.42;
      margin: 0 0 18px;
      max-width: 32ch;
      color: rgba(255,255,255,0.88);
      text-align: left;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .calicut-static-hero__actions {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      width: 100%;
    }
    .calicut-static-hero__btn--primary,
    .calicut-static-hero__btn--secondary {
      min-height: 44px;
      padding: 12px 20px;
      font-size: 12px;
      border-radius: 6px;
    }
    .calicut-static-hero__btn--primary svg,
    .calicut-static-hero__btn--secondary svg {
      width: 14px;
      height: 14px;
    }
    html.is-header-transparent .site-header:not(.clone) .site-description {
      display: none;
    }
  }
  @media (max-width: 390px) {
    html.is-header-transparent .site-header:not(.clone) .site-branding-center img,
    html.is-header-transparent .site-header:not(.clone) .site-branding-center .logo-negative {
      max-height: 30px !important;
    }
    .calicut-static-hero__inner {
      padding: 0 18px;
    }
    .calicut-static-hero__title {
      font-size: clamp(1.45rem, 7vw, 1.85rem);
      max-width: none;
    }
    .calicut-static-hero__text {
      max-width: none;
      margin-bottom: 16px;
      font-size: 12px;
      -webkit-line-clamp: 2;
    }
  }
  ${calicutHeaderCss()}
  </style>`;
}

function calicutHeaderCss() {
  return `
  html.is-header-transparent .site-header:not(.clone) .header-wrap,
  html.is-header-transparent .site-header:not(.clone) .header-wrap:before,
  html.is-header-transparent .site-header:not(.clone) .menu-wrap {
    background: transparent !important;
    background-color: transparent !important;
  }
  @media (min-width: 768px) {
    html.is-header-float.is-header-small .site-header ~ .elementor {
      margin-top: -80px !important;
      padding-top: 0 !important;
    }
  }
  @media (min-width: 768px) and (max-width: 991px) {
    html.is-header-float.is-header-small .site-header ~ .elementor {
      margin-top: -64px !important;
    }
  }
  @media (max-width: 767px) {
    html.is-header-float.is-header-small .site-header ~ .elementor {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
  }
  html.is-header-transparent .site-header:not(.clone) {
    color: #ffffff !important;
  }
  html.is-header-transparent .site-header:not(.clone) .site-description,
  html.is-header-transparent .site-header:not(.clone) .nav-menu a,
  html.is-header-transparent .site-header:not(.clone) .search-toggle,
  html.is-header-transparent .site-header:not(.clone) .social-link {
    color: #ffffff !important;
  }
  html.is-header-transparent .site-header:not(.clone) .site-branding-center img {
    filter: brightness(0) invert(1);
  }
  html.is-header-transparent .site-header.clone .header-wrap {
    background-color: #fffefc !important;
  }
  html.is-header-transparent .site-header.clone {
    color: inherit !important;
  }
  html.is-header-transparent .site-header.clone .site-branding-center img {
    filter: none !important;
  }`;
}

function applyCalicutPageTweaks(html) {
  if (html.includes('is-header-transparent is-header-float')) return html;
  return html.replace(
    'is-header-sticky-shadow-soft-shorter',
    'is-header-sticky-shadow-soft-shorter is-header-transparent is-header-float'
  );
}

async function createMobileHeroCrop(srcPath, destPath) {
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const execFileAsync = promisify(execFile);
  await execFileAsync('sips', ['--cropToHeightWidth', '1200', '810', srcPath, '--out', destPath]);
}

async function copyHeroImages() {
  await fs.ensureDir(heroImgDir);
  for (const rel of HERO_IMAGES) {
    const name = path.basename(rel);
    const destName = HERO_IMAGE_MAP[name];
    const src = path.join(staticRoot, rel);
    const dest = path.join(heroImgDir, destName);
    if (await fs.pathExists(src)) {
      await fs.copy(src, dest);
    } else {
      console.warn(`  missing source image: ${rel}`);
    }
  }

  const slide1 = path.join(heroImgDir, 'slide-1.jpeg');
  const slide1Mobile = path.join(heroImgDir, 'slide-1-mobile.jpeg');
  if (await fs.pathExists(slide1)) {
    try {
      await createMobileHeroCrop(slide1, slide1Mobile);
    } catch (err) {
      console.warn(`  could not create mobile hero crop: ${err.message}`);
    }
  }
}

function resolveLocationPage(slug) {
  const page = LOCATION_PAGES.find((entry) => entry.slug === slug);
  if (!page) {
    throw new Error(`Unknown location slug: ${slug}`);
  }
  return page;
}

async function injectLocationHero(pageOrSlug) {
  const page = typeof pageOrSlug === 'string' ? resolveLocationPage(pageOrSlug) : pageOrSlug;
  const pagePath = path.join(root, `${page.slug}/index.html`);

  if (!(await fs.pathExists(pagePath))) {
    throw new Error(`${page.slug}/index.html not found — run npm run deploy:locations first`);
  }
  if (!(await fs.pathExists(home03Path))) {
    throw new Error('static-site/home-03/index.html not found — run npm run static:generate first');
  }

  console.log(`Copying hero images for ${page.slug}…`);
  await copyHeroImages();

  const home03 = await fs.readFile(home03Path, 'utf8');
  let html = await fs.readFile(pagePath, 'utf8');

  const hero = adaptHero(extractHero(home03), page.title);
  html = replaceCalicutHero(html, hero);
  html = applyCalicutPageTweaks(html);
  html = ensureHeadAssets(html);
  html = html.replace(/<style id="calicut-home03-hero-fix">[\s\S]*?<\/style>\s*/m, '');
  html = html.replace(/<script id="calicut-home03-hero-init">[\s\S]*?<\/script>\s*/m, '');
  html = html.replace('</head>', `${heroVisibilityCss()}\n</head>`);

  await fs.writeFile(pagePath, html, 'utf8');
  console.log(`Injected hero into ${page.slug}/index.html`);
}

async function injectCalicutHero() {
  await injectLocationHero('calicut');
}

module.exports = { injectCalicutHero, injectLocationHero };

if (require.main === module) {
  const slug = process.argv[2] || 'calicut';
  injectLocationHero(slug).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
