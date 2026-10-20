#!/usr/bin/env node
/**
 * Make all images visible in a static mirrored export (no WordPress JS required).
 */

const fs = require('fs-extra');
const path = require('path');
const https = require('https');

const exportDir = path.resolve(process.cwd(), process.argv[2] || 'calicut-export');
const basePath = (process.argv[3] || `/${path.basename(exportDir)}/`).replace(/\/?$/, '/');
const base = basePath.replace(/\/$/, '');
const indexPath = path.join(exportDir, 'index.html');
const DEMO = 'https://themes.pixelwars.org/interique/demo-01/';

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

  /* Force all images visible */
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

  /* Animated text — show without scroll JS */
  .qodef-qi-animated-text .qodef-e-word,
  .qodef-qi-animated-text .qodef-e-character {
    opacity: 1 !important;
    transform: none !important;
  }

  /* Interactive link showcase — hidden until JS init */
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

  /* Swiper / sliders — show slides without full init */
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

  /* Image gallery grid */
  .qodef-qi-image-gallery img,
  .qodef-qi-image-slider img {
    display: block !important;
    width: 100% !important;
    height: auto !important;
    object-fit: cover !important;
  }

  /* Blog thumbnails */
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

  /* Elementor slideshow backgrounds */
  .elementor-background-slideshow__slide__image {
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Hero accent chair pills between Spaces / Reimagined */
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

function rewriteDemoUrls(text) {
  return text
    .replace(/https:\\\/\\\/themes\.pixelwars\.org\\\/interique\\\/demo-01\\\//g, `${base}/`)
    .replace(/https:\/\/themes\.pixelwars\.org\/interique\/demo-01\//g, `${base}/`);
}

function fixSrcsetPaths(html) {
  return html.replace(/srcset="([^"]+)"/g, (_, srcset) => {
    if (srcset.includes(`${base}/wp-content/`)) return `srcset="${srcset}"`;
    const fixed = srcset.replace(/(^|[\s,])\/wp-content\//g, `$1${base}/wp-content/`);
    return `srcset="${fixed}"`;
  });
}

function fixHeroChairImages(html) {
  let out = html
    .replace(/alt="Red accent chair"/g, 'alt=""')
    .replace(/alt="Green accent chair"/g, 'alt=""');

  // Oversized sizes/srcset can break pill layout — use the main src only.
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function injectBlogThumbs(html) {
  let out = html.replace(
    'qodef-item-layout--minimal',
    'qodef-item-layout--standard'
  );

  const baseEsc = escapeRegExp(base);

  // Remove any previously misplaced blog thumbnails before re-injecting.
  out = out.replace(
    /<div class="qodef-e-media"><div class="qodef-e-media-image"><a href="[^"]*\/(functional-beauty|cozy-minimalism|space-harmony|earthy-elegance)\/"><img[^>]*><\/a><\/div><\/div>\s*/g,
    ''
  );

  out = out.replace(
    /<article class="qodef-e qodef-blog-item[\s\S]*?<\/article>/g,
    (article) => {
      if (article.includes('qodef-e-media')) return article;
      for (const { slug, img } of BLOG_THUMBS) {
        const hrefRe = new RegExp(`href="(?:${baseEsc})?/?${slug}/"`);
        if (!hrefRe.test(article)) continue;
        const src = `${base}/${img}`;
        const href = `${base}/${slug}/`;
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
    `class="qodef-m-item qodef-e qodef--active" href="${base}/services/" target="_self">\n\t<span class="qodef-e-title"><span class="qodef-e-inner-title">Styling`
  );
  out = out.replace(
    /class="qodef-e-image qodef-background" style="background-image: url\(([^)]+Modern-Sculptural-Chair\.jpeg)\)"/,
    'class="qodef-e-image qodef-background qodef--active" style="background-image: url($1)"'
  );
  out = out.replace(/qodef-qi--has-appear/g, 'qodef-qi--has-appear qodef-qi--appeared');
  return out;
}

(async () => {
  let html = await fs.readFile(indexPath, 'utf8');

  const videoRel = 'wp-content/uploads/sites/2/2025/05/freepik__smooth-dolly-shot-a-modern-living-room-bathed-in-w__17639.mp4';
  const videoLocal = path.join(exportDir, videoRel);
  if (!(await fs.pathExists(videoLocal))) {
    try {
      await download(`${DEMO}${videoRel}`, videoLocal);
      console.log('  downloaded hero video');
    } catch (err) {
      console.warn('  hero video download failed:', err.message);
    }
  }

  html = rewriteDemoUrls(html);
  html = fixSrcsetPaths(html);
  html = fixHeroChairImages(html);

  // Remove broken Elementor lazy-load CSS + inline observer script
  html = html.replace(
    /<style>\s*\.e-con[\s\S]*?background-image: none !important;[\s\S]*?<\/style>\s*/m,
    ''
  );
  html = html.replace(
    /<script>\s*const lazyloadRunObserver[\s\S]*?<\/script>\s*/m,
    ''
  );

  html = html.replace(/\sclass="([^"]*\belementor-invisible\b[^"]*)"/g, (_, cls) => {
    const cleaned = cls.replace(/\belementor-invisible\b/g, '').replace(/\s+/g, ' ').trim();
    return cleaned ? ` class="${cleaned}"` : '';
  });

  html = html.replace(/class="bdt-img swiper-lazy"/g, 'class="bdt-img swiper-lazy swiper-lazy-loaded"');

  const videoSrc = `${base}/${videoRel}`;
  const poster = `${base}/wp-content/uploads/sites/2/2025/04/Modern-Sculptural-Chair.jpeg`;
  html = html.replace(
    /<video class="elementor-background-video-hosted"([^>]*)><\/video>/,
    `<video class="elementor-background-video-hosted" autoplay muted playsinline loop src="${videoSrc}" poster="${poster}"></video>`
  );

  const slideshowFallback = `${base}/wp-content/uploads/sites/2/2025/04/Modern-Sculptural-Chair.jpeg`;
  if (!html.includes('data-id="6e6b328"') || !html.includes('background-image:url')) {
    html = html.replace(
      /data-id="6e6b328" data-element_type="container"/,
      `data-id="6e6b328" data-element_type="container" style="background-image:url('${slideshowFallback}');background-size:cover;background-position:center;"`
    );
  }

  html = injectBlogThumbs(html);

  html = html.replace(/<style id="static-export-visibility-fix">[\s\S]*?<\/style>\s*/m, '');
  html = html.replace('</head>', `${VISIBILITY_CSS}\n</head>`);

  html = html.replace(/<script id="static-export-boot">[\s\S]*?<\/script>\s*/m, '');
  html = html.replace('</body>', `${BOOT_SCRIPT}\n</body>`);

  await fs.writeFile(indexPath, html, 'utf8');
  console.log(`Fixed image visibility in ${indexPath}`);
})();
