#!/usr/bin/env node
/**
 * Inject History / Mission / Vision tabs + Before/After comparison above the stats block.
 */

const fs = require('fs-extra');
const path = require('path');

const targetPath = path.resolve(process.argv[2] || path.join(process.cwd(), 'calicut/index.html'));

const MARKER = '<!-- CALICUT_HMV_BA_START -->';
const MARKER_END = '<!-- CALICUT_HMV_BA_END -->';

const block = `${MARKER}
<section class="calicut-hmv" aria-label="About Aurevo Interiors">
  <div class="calicut-hmv__inner">
    <div class="qodef-shortcode qodef-m qodef-qi-tabs-horizontal qodef-qi-clear qodef-layout--simple qodef-title-hover--underline-draw qodef-title-underline-from-left calicut-hmv__tabs" id="calicut-hmv-tabs">
      <ul class="qodef-tabs-horizontal-navigation">
        <li><h3 class="qodef-tab-title" role="tab"><a href="#calicut-tab-history"><span class="q-text">History</span></a></h3></li>
        <li><h3 class="qodef-tab-title" role="tab"><a href="#calicut-tab-mission"><span class="q-text">Mission</span></a></h3></li>
        <li><h3 class="qodef-tab-title" role="tab"><a href="#calicut-tab-vision"><span class="q-text">Vision</span></a></h3></li>
      </ul>
      <div class="qodef-tabs-horizontal-content" id="calicut-tab-history">
        <p>At Aurevo Interiors, we believe your space should tell your story. Our team of creative designers in Calicut is committed to transforming your vision into reality — creating environments that reflect your personality, style, and functional needs.</p>
        <p>With 6+ years of experience and 100+ projects across Kerala, we specialize in residential and commercial interiors. We work closely with each client to understand their goals, ensuring every project is a true reflection of who they are.</p>
      </div>
      <div class="qodef-tabs-horizontal-content" id="calicut-tab-mission" style="display:none">
        <p>Our mission is to craft inspiring, functional, and personalized spaces that elevate the way our clients live, work, and experience their surroundings. We deliver exceptional design solutions that blend creativity with practicality.</p>
        <p>We build lasting relationships with every client in Calicut and beyond, executing each project with attention to detail, innovation, and impeccable craftsmanship — spaces that inspire and enrich everyday life.</p>
      </div>
      <div class="qodef-tabs-horizontal-content" id="calicut-tab-vision" style="display:none">
        <p>Our vision is to become a trusted leader in transforming spaces through innovative and thoughtful design across Kerala. We create environments that meet aesthetic and functional needs while fostering well-being and creativity.</p>
        <p>We envision every home and workspace reflecting the individuality of those who occupy it — combining timeless design with modern elegance to leave a lasting, positive impact on the communities we serve.</p>
      </div>
    </div>
  </div>
</section>

<section class="calicut-before-after" aria-labelledby="calicut-before-after-title">
  <div class="calicut-before-after__inner">
    <h2 class="calicut-before-after__title" id="calicut-before-after-title">
      Before and After <span>Aurevo Interior Design</span>
    </h2>
    <p class="calicut-before-after__subtitle">
      Watch and compare the amazing transformation of space into beautiful and functional interiors.
    </p>
    <div class="calicut-compare-slider" id="calicut-compare-slider" role="img" aria-label="Before and after interior design comparison">
      <img class="calicut-compare-slider__after" src="/wp-content/uploads/custom/calicut-ba-after.jpg" alt="After — finished interior by Aurevo Interiors" draggable="false">
      <div class="calicut-compare-slider__before-wrap" id="calicut-compare-before-wrap">
        <img class="calicut-compare-slider__before" id="calicut-compare-before-img" src="/wp-content/uploads/custom/calicut-ba-before.jpg" alt="Before — room under renovation" draggable="false">
      </div>
      <div class="calicut-compare-slider__handle" id="calicut-compare-handle">
        <button type="button" class="calicut-compare-slider__knob" id="calicut-compare-knob" aria-label="Drag to compare before and after">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <span class="calicut-compare-slider__label calicut-compare-slider__label--before">Before</span>
      <span class="calicut-compare-slider__label calicut-compare-slider__label--after">After</span>
    </div>
  </div>
</section>
${MARKER_END}`;

const styles = `
  /* Calicut History / Mission / Vision + Before-After */
  .calicut-hmv {
    background: #fffefc;
    padding: 72px 24px 48px;
  }
  .calicut-hmv__inner {
    max-width: 900px;
    margin: 0 auto;
  }
  .calicut-hmv__tabs .qodef-tabs-horizontal-navigation {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 32px;
    list-style: none;
    margin: 0 0 28px;
    padding: 0;
    border-bottom: 1px solid rgba(0,0,0,0.08);
  }
  .calicut-hmv__tabs .qodef-tab-title {
    margin: 0;
    font-family: 'Bricolage Grotesque', 'Jost', sans-serif;
    font-size: 1.25rem;
    font-weight: 500;
  }
  .calicut-hmv__tabs .qodef-tab-title a {
    display: block;
    padding: 0 0 14px;
    color: #020014;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  .calicut-hmv__tabs .qodef-tab-title.is-active a,
  .calicut-hmv__tabs .qodef-tab-title a:hover {
    border-bottom-color: #bbcfbd;
  }
  .calicut-hmv__tabs .qodef-tabs-horizontal-content {
    font-family: 'Jost', sans-serif;
    font-size: 16px;
    line-height: 1.7;
    color: #32455e;
  }
  .calicut-hmv__tabs .qodef-tabs-horizontal-content p { margin: 0 0 1em; }

  .calicut-before-after {
    background: #1a1a1a;
    padding: 56px 24px 80px;
  }
  .calicut-before-after__inner {
    max-width: 1000px;
    margin: 0 auto;
    text-align: center;
  }
  .calicut-before-after__title {
    font-family: 'Bricolage Grotesque', 'Jost', sans-serif;
    font-size: clamp(1.35rem, 3.5vw, 2.1rem);
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #ffffff;
    margin: 0 0 14px;
    line-height: 1.3;
  }
  .calicut-before-after__title span { color: #bbcfbd; }
  .calicut-before-after__subtitle {
    font-family: 'Jost', sans-serif;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.72);
    max-width: 640px;
    margin: 0 auto 36px;
    line-height: 1.6;
  }
  .calicut-compare-slider {
    position: relative;
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    border: 1px solid rgba(255, 255, 255, 0.15);
    overflow: hidden;
    user-select: none;
    touch-action: none;
    cursor: ew-resize;
    aspect-ratio: 16 / 9;
  }
  .calicut-compare-slider__after,
  .calicut-compare-slider__before {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }
  .calicut-compare-slider__after {
    position: relative;
    z-index: 1;
  }
  .calicut-compare-slider__before-wrap {
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 100%;
    overflow: hidden;
    z-index: 2;
  }
  .calicut-compare-slider__before {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    max-width: none;
  }
  .calicut-compare-slider__handle {
    position: absolute;
    top: 0;
    left: 50%;
    width: 3px;
    height: 100%;
    background: #fff;
    transform: translateX(-50%);
    z-index: 3;
  }
  .calicut-compare-slider__knob {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: #d84156;
    color: #fff;
    cursor: ew-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
  }
  .calicut-compare-slider__knob svg { width: 22px; height: 22px; }
  .calicut-compare-slider__label {
    position: absolute;
    bottom: 16px;
    z-index: 4;
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #fff;
    background: rgba(0,0,0,0.55);
    padding: 6px 12px;
  }
  .calicut-compare-slider__label--before { left: 16px; }
  .calicut-compare-slider__label--after { right: 16px; }
  @media (max-width: 767px) {
    .calicut-hmv { padding: 48px 16px 32px; }
    .calicut-before-after { padding: 40px 16px 56px; }
    .calicut-compare-slider__knob { width: 40px; height: 40px; }
  }
`;

const script = `
<script id="calicut-hmv-ba-script">
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () {
    var tabs = document.getElementById('calicut-hmv-tabs');
    if (tabs) {
      var navLinks = tabs.querySelectorAll('.qodef-tabs-horizontal-navigation a');
      var panels = tabs.querySelectorAll('.qodef-tabs-horizontal-content');
      function activate(id) {
        panels.forEach(function (p) {
          p.style.display = p.id === id ? '' : 'none';
        });
        tabs.querySelectorAll('.qodef-tab-title').forEach(function (t) {
          t.classList.toggle('is-active', t.querySelector('a').getAttribute('href') === '#' + id);
        });
      }
      navLinks.forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          activate(a.getAttribute('href').slice(1));
        });
      });
      if (tabs.querySelector('.qodef-tab-title')) {
        tabs.querySelector('.qodef-tab-title').classList.add('is-active');
      }
    }

    var slider = document.getElementById('calicut-compare-slider');
    var beforeWrap = document.getElementById('calicut-compare-before-wrap');
    var beforeImg = document.getElementById('calicut-compare-before-img');
    var handle = document.getElementById('calicut-compare-handle');
    var knob = document.getElementById('calicut-compare-knob');
    if (!slider || !beforeWrap || !beforeImg || !handle) return;
    var isDragging = false;
    function syncBeforeWidth() { beforeImg.style.width = slider.offsetWidth + 'px'; }
    function setPosition(clientX) {
      var rect = slider.getBoundingClientRect();
      var pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(2, Math.min(98, pct));
      beforeWrap.style.width = pct + '%';
      handle.style.left = pct + '%';
    }
    if (beforeImg.complete) syncBeforeWidth();
    else beforeImg.addEventListener('load', syncBeforeWidth);
    window.addEventListener('resize', syncBeforeWidth);
    slider.addEventListener('mousedown', function (e) {
      if (e.target === knob) return;
      isDragging = true;
      setPosition(e.clientX);
    });
    if (knob) knob.addEventListener('mousedown', function (e) { e.preventDefault(); isDragging = true; });
    document.addEventListener('mouseup', function () { isDragging = false; });
    document.addEventListener('mousemove', function (e) { if (isDragging) setPosition(e.clientX); });
    slider.addEventListener('touchstart', function (e) {
      isDragging = true;
      setPosition(e.touches[0].clientX);
    }, { passive: true });
    document.addEventListener('touchend', function () { isDragging = false; });
    document.addEventListener('touchmove', function (e) {
      if (isDragging) setPosition(e.touches[0].clientX);
    }, { passive: true });
  });
})();
</script>`;

const insertAfterHero =
  /<\/div>\s*<div class="elementor-element elementor-element-c634678/;

(async () => {
  let html = await fs.readFile(targetPath, 'utf8');

  // Remove previous injection if re-running
  html = html.replace(new RegExp(`${MARKER}[\\s\\S]*?${MARKER_END}\\n?`, 'g'), '');

  if (!insertAfterHero.test(html)) {
    console.error('Could not find hero/stats boundary in', targetPath);
    process.exit(1);
  }

  html = html.replace(insertAfterHero, (m) => `</div>\n${block}\n<div class="elementor-element elementor-element-c634678`);

  html = html.replace(/<style id="calicut-hmv-ba-styles">[\s\S]*?<\/style>\s*/m, '');
  html = html.replace('</head>', `<style id="calicut-hmv-ba-styles">${styles}\n</style>\n</head>`);

  if (!html.includes('id="calicut-hmv-ba-script"')) {
    html = html.replace('</body>', `${script}\n</body>`);
  }

  await fs.writeFile(targetPath, html, 'utf8');
  console.log('Injected History/Mission/Vision + Before/After →', path.relative(process.cwd(), targetPath));
})();
