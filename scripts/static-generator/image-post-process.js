/**
 * Post-process mirrored HTML so images display without WordPress/Elementor JS.
 */

const fs = require('fs-extra');
const path = require('path');
const https = require('https');

const DEMO = 'https://themes.pixelwars.org/interique/demo-01/';
const GOOGLE_FONTS =
  'https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap';

const BLOG_THUMBS = [
  { slug: 'functional-beauty', img: 'wp-content/uploads/sites/2/2025/04/Cozy-Reading-Nook-1300x650.jpeg' },
  { slug: 'cozy-minimalism', img: 'wp-content/uploads/sites/2/2025/04/Minimalist-Beige-Chair-1300x650.jpeg' },
  { slug: 'space-harmony', img: 'wp-content/uploads/sites/2/2025/04/Modern-Sculptural-Chair-1300x650.jpeg' },
  { slug: 'earthy-elegance', img: 'wp-content/uploads/sites/2/2025/04/green-interior-modern-interior-living-room-style-with-soft-sofa-green-wall-3d-rendering-1300x650.jpg' },
];

const VISIBILITY_CSS = `<style id="static-export-visibility-fix">
  .elementor-element[style*="background-image"] {
    background-size: cover !important;
    background-position: center !important;
  }
  img, video, .elementor-background-video-hosted {
    opacity: 1 !important;
    visibility: visible !important;
  }
  .elementor-invisible,
  .elementor-widget.elementor-invisible {
    visibility: visible !important;
    opacity: 1 !important;
    animation: none !important;
  }
  .qodef-qi-animated-text .qodef-e-word,
  .qodef-qi-animated-text .qodef-e-character {
    opacity: 1 !important;
    transform: none !important;
  }
  .qodef-qi-interactive-link-showcase {
    visibility: visible !important;
    min-height: 420px;
  }
  .qodef-qi-interactive-link-showcase.qodef-layout--background .qodef-m-images {
    display: block !important;
  }
  .qodef-qi-interactive-link-showcase .qodef-e-image {
    opacity: 0 !important;
    transition: opacity 0.3s ease !important;
  }
  .qodef-qi-interactive-link-showcase .qodef-e-image.qodef--active,
  .qodef-qi-interactive-link-showcase .qodef-e-image:first-child {
    opacity: 1 !important;
    z-index: 5 !important;
  }
  .qodef-qi-interactive-link-showcase .qodef-e-image.qodef-background {
    background-size: cover !important;
    background-position: center !important;
  }
  .swiper-lazy-preloader { display: none !important; }
  img.swiper-lazy, img.swiper-lazy-loaded { opacity: 1 !important; }
  .bdt-pacific-slider, .qodef-qi-swiper-container { min-height: 280px; }
  .bdt-pacific-slider .bdt-image-wrap,
  .bdt-pacific-slider .bdt-img {
    display: block !important;
    opacity: 1 !important;
    height: 100% !important;
    width: 100% !important;
    object-fit: cover !important;
  }
  .swiper-slide { opacity: 1 !important; visibility: visible !important; }
  .swiper-wrapper { display: flex !important; }
  .qodef-qi-image-gallery img,
  .qodef-qi-image-slider img {
    display: block !important;
    width: 100% !important;
    height: auto !important;
    object-fit: cover !important;
  }
  .qodef-addons-blog-list .qodef-e-media {
    display: block !important;
    margin-bottom: 16px;
  }
  .qodef-addons-blog-list .qodef-e-media-image img {
    width: 100%;
    height: 220px;
    object-fit: cover;
    border-radius: 8px;
  }
  .elementor-background-slideshow__slide__image {
    opacity: 1 !important;
    visibility: visible !important;
  }
  .elementor-element-4a48a4c .elementor-element-7882eb5 {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 10% !important;
    width: 34% !important;
    min-height: 90px !important;
  }
  .elementor-element-4a48a4c .elementor-element-ded85bb,
  .elementor-element-4a48a4c .elementor-element-29cccb1 {
    width: auto !important;
    max-width: none !important;
    flex: 0 0 auto !important;
  }
  .elementor-element-4a48a4c .elementor-element-ded85bb .elementor-widget-container,
  .elementor-element-4a48a4c .elementor-element-29cccb1 .elementor-widget-container {
    overflow: hidden !important;
    border-radius: 122px !important;
    line-height: 0 !important;
  }
  .elementor-element-4a48a4c .elementor-element-7882eb5.elementor-hidden-mobile {
    display: flex !important;
  }
  .elementor-element-4a48a4c .elementor-element-ded85bb img,
  .elementor-element-4a48a4c .elementor-element-29cccb1 img {
    display: block !important;
    width: 120px !important;
    height: 90px !important;
    min-width: 90px !important;
    max-width: none !important;
    object-fit: cover !important;
    object-position: center center !important;
    border-radius: 122px !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  .elementor-element-4a48a4c {
    min-height: 85vh !important;
    position: relative !important;
    overflow: hidden !important;
  }
  .elementor-element-4a48a4c .elementor-background-video-hosted {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    z-index: 0 !important;
  }
  .elementor-element-4a48a4c > .e-con-inner,
  .elementor-element-4a48a4c > .e-child {
    position: relative !important;
    z-index: 2 !important;
  }
  [data-settings*="background_slideshow"] {
    min-height: 60vh !important;
    background-size: cover !important;
    background-position: center !important;
  }
  .elementor-background-slideshow,
  .elementor-background-slideshow__slide,
  .elementor-background-slideshow__slide__image {
    opacity: 1 !important;
    visibility: visible !important;
  }
  .qodef-tabs-horizontal-navigation {
    display: flex !important;
    gap: 24px !important;
    list-style: none !important;
    padding: 0 !important;
    margin: 0 0 24px !important;
    border-bottom: 1px solid rgba(0,0,0,0.1) !important;
  }
  .qodef-tabs-horizontal-navigation li {
    cursor: pointer !important;
    padding: 8px 0 !important;
    opacity: 0.5 !important;
  }
  .qodef-tabs-horizontal-navigation li.ui-state-active,
  .qodef-tabs-horizontal-navigation li:first-child {
    opacity: 1 !important;
    border-bottom: 2px solid currentColor !important;
  }
  .qodef-tabs-horizontal-content { display: none !important; }
  .qodef-tabs-horizontal-content:first-of-type,
  .qodef-tabs-horizontal-content.active-tab {
    display: block !important;
  }
  .bdt-pacific-slider .swiper-slide:first-child,
  .bdt-pacific-slider .swiper-slide-active {
    opacity: 1 !important;
    visibility: visible !important;
  }
  .qodef-qi-image-slider .swiper-slide,
  .qodef-qi-image-gallery .qodef-e {
    opacity: 1 !important;
  }
</style>`;

const BOOT_SCRIPT = `<script id="static-export-boot">
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () {
    document.querySelectorAll('.qodef-qi--has-appear').forEach(function (el) {
      el.classList.add('qodef-qi--appeared');
    });
    document.querySelectorAll('.qodef-qi-interactive-link-showcase').forEach(function (wrap) {
      wrap.classList.add('qodef--init');
      var images = wrap.querySelectorAll('.qodef-e-image');
      var items = wrap.querySelectorAll('.qodef-m-item');
      if (images[0]) images[0].classList.add('qodef--active');
      if (items[0]) items[0].classList.add('qodef--active');
      items.forEach(function (item, i) {
        item.addEventListener('mouseenter', function () {
          images.forEach(function (img) { img.classList.remove('qodef--active'); });
          items.forEach(function (it) { it.classList.remove('qodef--active'); });
          if (images[i]) images[i].classList.add('qodef--active');
          item.classList.add('qodef--active');
        });
      });
    });
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      img.loading = 'eager';
    });
    document.querySelectorAll('.elementor-invisible').forEach(function (el) {
      el.classList.remove('elementor-invisible');
    });
    document.querySelectorAll('.e-con.e-parent').forEach(function (el) {
      el.classList.add('e-lazyloaded');
    });
    document.querySelectorAll('video.elementor-background-video-hosted').forEach(function (v) {
      if (!v.src && v.dataset && v.dataset.src) v.src = v.dataset.src;
      v.play && v.play().catch(function () {});
    });

    document.querySelectorAll('.qodef-tabs-horizontal').forEach(function (wrap) {
      var nav = wrap.querySelector('.qodef-tabs-horizontal-navigation');
      var panels = wrap.querySelectorAll('.qodef-tabs-horizontal-content');
      if (!nav || !panels.length) return;
      var items = nav.querySelectorAll('li');
      function show(i) {
        items.forEach(function (li, idx) {
          li.classList.toggle('ui-state-active', idx === i);
        });
        panels.forEach(function (panel, idx) {
          panel.classList.toggle('active-tab', idx === i);
          panel.style.display = idx === i ? 'block' : 'none';
        });
      }
      show(0);
      items.forEach(function (li, i) {
        li.addEventListener('click', function () { show(i); });
      });
    });

    document.querySelectorAll('[data-settings*="background_slideshow"]').forEach(function (el) {
      var raw = el.getAttribute('data-settings') || '';
      var m = raw.match(/wp-content\\\\\/uploads\\\\\/[^"&]+|wp-content\\/uploads\\/[^"&]+/);
      if (!m) return;
      var url = '/' + m[0].replace(/\\\\\//g, '/').replace(/\\\//g, '/');
      if (!el.style.backgroundImage) {
        el.style.backgroundImage = "url('" + url + "')";
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
      }
    });
  });
})();
</script>`;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.ensureDirSync(path.dirname(dest));
    const file = fs.createWriteStream(dest);
    const req = (target, redirects = 0) => {
      https.get(target, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects > 5) return reject(new Error('too many redirects'));
          req(res.headers.location, redirects + 1);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`${res.statusCode} ${target}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(dest)));
      }).on('error', reject);
    };
    req(url);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fixSrcsetPaths(html, base) {
  const prefix = base === '/' ? '' : base.replace(/\/$/, '');
  return html.replace(/srcset="([^"]+)"/g, (_, srcset) => {
    if (prefix && srcset.includes(`${prefix}/wp-content/`)) return `srcset="${srcset}"`;
    const fixed = srcset.replace(/(^|[\s,])\/wp-content\//g, `$1${prefix}/wp-content/`);
    return `srcset="${fixed}"`;
  });
}

function promoteLazyImages(html) {
  let out = html;
  for (const attr of ['data-src', 'data-lazy-src', 'data-original']) {
    out = out.replace(
      new RegExp(`<img([^>]*?)\\s${attr}="([^"]+)"([^>]*?)>`, 'gi'),
      (match, before, url, after) => {
        const full = `${before} ${attr}="${url}" ${after}`;
        if (/\ssrc="[^"]+"/i.test(full) && !/\ssrc="(?:data:|about:blank)/i.test(full)) {
          return match;
        }
        const cleaned = match
          .replace(new RegExp(`\\s${attr}="[^"]+"`, 'i'), '')
          .replace(/<img/i, `<img src="${url}"`);
        return cleaned;
      }
    );
  }
  return out;
}

function fixHeroChairImages(html) {
  let out = html
    .replace(/alt="Red accent chair"/g, 'alt=""')
    .replace(/alt="Green accent chair"/g, 'alt=""');
  out = out.replace(
    /(<div class="elementor-element elementor-element-ded85bb[\s\S]*?<img[^>]*?) srcset="[^"]*"/,
    '$1'
  );
  out = out.replace(
    /(<div class="elementor-element elementor-element-ded85bb[\s\S]*?<img[^>]*?) sizes="[^"]*"/,
    '$1'
  );
  out = out.replace(
    /(<div class="elementor-element elementor-element-29cccb1[\s\S]*?<img[^>]*?) srcset="[^"]*"/,
    '$1'
  );
  out = out.replace(
    /(<div class="elementor-element elementor-element-29cccb1[\s\S]*?<img[^>]*?) sizes="[^"]*"/,
    '$1'
  );
  return out;
}

function injectBlogThumbs(html, base) {
  let out = html.replace(
    'qodef-item-layout--minimal',
    'qodef-item-layout--standard'
  );

  const baseEsc = escapeRegExp(base === '/' ? '' : base.replace(/\/$/, ''));

  out = out.replace(
    /<div class="qodef-e-media"><div class="qodef-e-media-image"><a href="[^"]*\/(functional-beauty|cozy-minimalism|space-harmony|earthy-elegance)\/"><img[^>]*><\/a><\/div><\/div>\s*/g,
    ''
  );

  const prefix = base === '/' ? '' : base.replace(/\/$/, '');

  out = out.replace(
    /<article class="qodef-e qodef-blog-item[\s\S]*?<\/article>/g,
    (article) => {
      if (article.includes('qodef-e-media')) return article;
      for (const { slug, img } of BLOG_THUMBS) {
        const hrefRe = new RegExp(`href="(?:${baseEsc})?/?${slug}(?:/index\\.html|/)"`);
        if (!hrefRe.test(article)) continue;
        const src = `${prefix}/${img}`;
        const hrefMatch = article.match(new RegExp(`href="((?:${baseEsc})?/?${slug}(?:/index\\.html|/))"`));
        const href = hrefMatch ? hrefMatch[1] : `${prefix}/${slug}/`;
        const insert = `<div class="qodef-e-media"><div class="qodef-e-media-image"><a href="${href}"><img src="${src}" alt="${slug}" loading="eager" width="1300" height="650"></a></div></div>\n\t\t`;
        return article.replace(
          /(<div class="qodef-e-inner">\s*)<div class="qodef-e-content">/,
          `$1${insert}<div class="qodef-e-content">`
        );
      }
      return article;
    }
  );

  out = out.replace(
    'qodef-qi-interactive-link-showcase qodef-layout--background qodef-hover--underline"',
    'qodef-qi-interactive-link-showcase qodef-layout--background qodef-hover--underline qodef--init"'
  );
  out = out.replace(
    /class="qodef-m-item qodef-e" href="[^"]*\/services\/" target="_self">\s*<span class="qodef-e-title"><span class="qodef-e-inner-title">Styling/,
    `class="qodef-m-item qodef-e qodef--active" href="${prefix}/services/" target="_self">\n\t<span class="qodef-e-title"><span class="qodef-e-inner-title">Styling`
  );
  out = out.replace(
    /class="qodef-e-image qodef-background" style="background-image: url\(([^)]+Modern-Sculptural-Chair\.jpeg)\)"/,
    'class="qodef-e-image qodef-background qodef--active" style="background-image: url($1)"'
  );
  out = out.replace(/qodef-qi--has-appear/g, 'qodef-qi--has-appear qodef-qi--appeared');
  return out;
}

function fixGoogleFonts(html) {
  return html.replace(
    /<link[^>]*id="interique-fonts-css"[^>]*>/,
    `<link rel="stylesheet" id="interique-fonts-css" href="${GOOGLE_FONTS}" type="text/css" media="all">`
  );
}

function rewriteDemoUrls(html, prefix = '') {
  const root = prefix === '/' ? '' : prefix.replace(/\/$/, '');
  return html
    .replace(/https:\\\/\\\/themes\.pixelwars\.org\\\/interique\\\/demo-01\\\//g, `${root}/`)
    .replace(/https:\/\/themes\.pixelwars\.org\/interique\/demo-01\//g, `${root}/`);
}

function injectSlideshowBackgrounds(html, prefix = '') {
  const root = prefix === '/' ? '' : prefix.replace(/\/$/, '');
  return html.replace(
    /(<div[^>]*data-settings="[^"]*background_slideshow_gallery[^"]*"[^>]*)(>)/g,
    (match, open, close) => {
      if (/style="[^"]*background-image/i.test(open)) return match;
      const urlMatch = match.match(/wp-content\\+?\/uploads\\+?\/[^"&\\]+/);
      if (!urlMatch) return match;
      const url = `${root}/${urlMatch[0].replace(/\\/g, '')}`;
      return `${open} style="background-image:url('${url}');background-size:cover;background-position:center;"${close}`;
    }
  );
}

function isHome02Html(html) {
  return /elementor-page-16254|elementor-16254|"Spaces"/.test(html);
}

function processHtml(html, { basePath = '/', isHomePage = false, exportDir = null } = {}) {
  const base = basePath === '/' ? '/' : basePath.replace(/\/?$/, '/');
  const prefix = base === '/' ? '' : base.replace(/\/$/, '');
  let out = html;

  out = fixGoogleFonts(out);
  out = rewriteDemoUrls(out, prefix);
  out = injectSlideshowBackgrounds(out, prefix);
  out = promoteLazyImages(out);
  out = fixSrcsetPaths(out, base === '/' ? '/' : prefix);
  if (isHomePage) {
    out = fixHeroChairImages(out);
    out = injectBlogThumbs(out, base === '/' ? '/' : base.replace(/\/$/, ''));
  }

  out = out.replace(
    /<style>\s*\.e-con[\s\S]*?background-image: none !important;[\s\S]*?<\/style>\s*/m,
    ''
  );
  out = out.replace(
    /<script>\s*const lazyloadRunObserver[\s\S]*?<\/script>\s*/m,
    ''
  );

  out = out.replace(/\sclass="([^"]*\belementor-invisible\b[^"]*)"/g, (_, cls) => {
    const cleaned = cls.replace(/\belementor-invisible\b/g, '').replace(/\s+/g, ' ').trim();
    return cleaned ? ` class="${cleaned}"` : '';
  });

  out = out.replace(/class="bdt-img swiper-lazy"/g, 'class="bdt-img swiper-lazy swiper-lazy-loaded"');

  if (isHomePage && exportDir) {
    const prefix = base === '/' ? '' : base.replace(/\/$/, '');
    const videoRel = 'wp-content/uploads/sites/2/2025/05/freepik__smooth-dolly-shot-a-modern-living-room-bathed-in-w__17639.mp4';
    const videoSrc = `${prefix}/${videoRel}`;
    const poster = `${prefix}/wp-content/uploads/sites/2/2025/04/Modern-Sculptural-Chair.jpeg`;
    out = out.replace(
      /<video class="elementor-background-video-hosted"([^>]*)><\/video>/,
      `<video class="elementor-background-video-hosted" autoplay muted playsinline loop src="${videoSrc}" poster="${poster}"></video>`
    );
    const slideshowFallback = poster;
    if (!out.includes('data-id="6e6b328"') || !out.includes('background-image:url')) {
      out = out.replace(
        /data-id="6e6b328" data-element_type="container"/,
        `data-id="6e6b328" data-element_type="container" style="background-image:url('${slideshowFallback}');background-size:cover;background-position:center;"`
      );
    }
  }

  out = out.replace(/<style id="static-export-visibility-fix">[\s\S]*?<\/style>\s*/m, '');
  out = out.replace('</head>', `${VISIBILITY_CSS}\n</head>`);
  out = out.replace(/<script id="static-export-boot">[\s\S]*?<\/script>\s*/m, '');
  out = out.replace('</body>', `${BOOT_SCRIPT}\n</body>`);

  return out;
}

async function ensureHeroVideo(exportDir) {
  const videoRel = 'wp-content/uploads/sites/2/2025/05/freepik__smooth-dolly-shot-a-modern-living-room-bathed-in-w__17639.mp4';
  const videoLocal = path.join(exportDir, videoRel);
  if (await fs.pathExists(videoLocal)) return;
  try {
    await download(`${DEMO}${videoRel}`, videoLocal);
    console.log('  downloaded hero video');
  } catch (err) {
    console.warn('  hero video download failed:', err.message);
  }
}

async function walkHtml(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walkHtml(p));
    else if (/\.html?$/i.test(entry.name)) out.push(p);
  }
  return out;
}

async function promoteHome02(exportDir) {
  const candidates = [
    path.join(exportDir, '__q_P3A9MTYyNTQ/index.html'),
    path.join(exportDir, 'home-02/index.html'),
  ];
  const indexPath = path.join(exportDir, 'index.html');
  for (const candidate of candidates) {
    if (!(await fs.pathExists(candidate))) continue;
    const html = await fs.readFile(candidate, 'utf8');
    if (!isHome02Html(html)) continue;
    await fs.copy(candidate, indexPath);
    console.log(`  promoted Home 02 from ${path.relative(exportDir, candidate)}`);
    return true;
  }
  return false;
}

async function processExport(exportDir, basePath = '/') {
  const indexPath = path.join(exportDir, 'index.html');
  await promoteHome02(exportDir);
  if (await fs.pathExists(indexPath)) {
    await ensureHeroVideo(exportDir);
  }

  const files = await walkHtml(exportDir);
  let changed = 0;
  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');
    const isHomePage = path.resolve(file) === path.resolve(indexPath) && isHome02Html(original);
    const updated = processHtml(original, { basePath, isHomePage, exportDir });
    if (updated !== original) {
      await fs.writeFile(file, updated, 'utf8');
      changed++;
      console.log(`  fixed ${path.relative(exportDir, file)}`);
    }
  }
  return changed;
}

module.exports = { processHtml, processExport, promoteHome02, download, ensureHeroVideo, isHome02Html };
