#!/usr/bin/env node
/**
 * Inject gray content block (heading + excerpt + expandable text + Read more) under the blog section.
 */

const fs = require('fs-extra');
const path = require('path');
const { LOCATION_PAGES } = require('./location-pages.config');

const root = process.cwd();

const MODEL_COPY = {
  heading: 'Interior Designers in {{city}} for Homes & Offices',
  visible: [
    'Looking for thoughtfully designed interiors in {{city}}? From modern apartments to independent homes and commercial spaces, a well-planned interior improves comfort, functionality, and long-term value for every property.',
    'Aurevo Interiors brings award-winning design expertise to {{city}} — with tailored layouts, premium materials, and end-to-end project delivery so your space feels complete, refined, and ready to live in.',
    'Whether you are renovating a 2BHK, designing a luxury villa, or planning an office fit-out, our team handles space planning, 3D visualisation, material selection, carpentry, and site execution under one roof in {{city}}.',
  ],
  hidden: [
    'Our residential services in {{city}} include living room design, modular kitchens, bedroom wardrobes, bathroom upgrades, and full home makeovers for apartments and villas.',
    'For commercial clients in {{city}}, we design productive office spaces, retail interiors, clinics, and co-working environments with smart layouts and durable finishes.',
    'Aurevo uses premium boards, laminates, veneers, hardware, and lighting selected for {{city}}\'s climate and daily use — balancing aesthetics with long-term performance.',
    'With 6+ years of experience and 100+ completed projects, our {{city}} team delivers consistent quality through structured project management and on-site supervision.',
    'Ready to start? Book a free consultation with Aurevo Interiors in {{city}} — we visit your site, understand your needs, and share a tailored 3D design plan.',
  ],
  readMore: 'Read more',
  readLess: 'Read less',
};

function fillCity(text, city) {
  return text.replace(/\{\{city\}\}/g, city);
}

function buildModelStyles() {
  return `			/* location-model-styles-start */
			.elementor-14997 .elementor-element-locmodel01 {
				--display: flex;
				--flex-direction: row;
				--flex-wrap: wrap;
				--padding-top: 4%;
				--padding-bottom: 1.5%;
				--padding-left: 5%;
				--padding-right: 5%;
				padding-top: 4%;
				padding-bottom: 1.5%;
				padding-left: 5%;
				padding-right: 5%;
				background-color: #ffffff;
			}
			.elementor-14997 .elementor-element-locmodel01 > .e-con-inner {
				display: flex;
				flex-direction: row;
				flex-wrap: wrap;
				width: 100%;
				align-items: flex-start;
			}
			.elementor-14997 .elementor-element-locmodel02 {
				width: 100%;
				flex: 0 0 100%;
				max-width: 100%;
			}
			.elementor-14997 .elementor-element-locmodel03 .elementor-heading-title {
				font-family: "Bricolage Grotesque", sans-serif;
				font-size: clamp(28px, 3.4vw, 40px);
				font-weight: 500;
				line-height: 1.2;
				letter-spacing: -0.02em;
				color: #000000;
				margin: 0 0 14px;
				padding: 0;
				text-align: left;
			}
			.elementor-14997 .elementor-element-locmodel04 .elementor-widget-container,
			.elementor-14997 .elementor-element-locmodel05 .elementor-widget-container {
				margin: 0;
				padding: 0;
			}
			.elementor-14997 .elementor-element-locmodel04,
			.elementor-14997 .loc-model-more {
				font-family: "Jost", sans-serif;
				font-size: 16px;
				font-weight: 400;
				line-height: 1.65;
				color: rgba(0, 0, 0, 0.73);
				text-align: left;
			}
			.elementor-14997 .elementor-element-locmodel04 p,
			.elementor-14997 .loc-model-more p {
				margin: 0 0 14px;
			}
			.elementor-14997 .loc-model-more p:last-child {
				margin-bottom: 0;
			}
			.elementor-14997 .loc-model-more {
				max-height: 0;
				overflow: hidden;
				opacity: 0;
				transition: max-height 0.45s ease, opacity 0.35s ease, margin 0.35s ease;
				margin-top: 0;
			}
			.elementor-14997 .loc-model-more.is-open {
				max-height: 1200px;
				opacity: 1;
				margin-top: 2px;
			}
			.elementor-14997 .elementor-element-locmodel06 > .elementor-widget-container {
				margin: 10px 0 0;
				padding: 0;
				text-align: left;
			}
			.elementor-14997 .loc-model-readmore {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				padding: 13px 26px;
				border: 0;
				border-radius: 2px;
				font-family: "Jost", sans-serif;
				font-size: 15px;
				font-weight: 500;
				line-height: 1;
				color: #ffffff;
				background-color: #607c63;
				cursor: pointer;
				transition: background-color 0.2s ease;
			}
			.elementor-14997 .loc-model-readmore:hover,
			.elementor-14997 .loc-model-readmore:focus {
				background-color: #4d664f;
				color: #ffffff;
				outline: none;
			}
			@media (max-width: 1024px) {
				.elementor-14997 .elementor-element-locmodel03 .elementor-heading-title {
					font-size: 28px;
				}
				.elementor-14997 .elementor-element-locmodel04,
				.elementor-14997 .loc-model-more {
					font-size: 15px;
				}
			}
			@media (max-width: 767px) {
				.elementor-14997 .elementor-element-locmodel01 {
					padding-top: 8%;
					padding-bottom: 4%;
					padding-left: 6%;
					padding-right: 6%;
				}
				.elementor-14997 .elementor-element-locmodel03 .elementor-heading-title {
					font-size: 24px;
					margin-bottom: 12px;
				}
			}
			/* location-model-styles-end */`;
}

function buildModelHtml(city) {
  const heading = fillCity(MODEL_COPY.heading, city);
  const visibleHtml = MODEL_COPY.visible
    .map((p) => `<p>${fillCity(p, city)}</p>`)
    .join('\n\t\t\t\t\t\t');
  const hiddenHtml = MODEL_COPY.hidden
    .map((p) => `<p>${fillCity(p, city)}</p>`)
    .join('\n\t\t\t\t\t');

  return `		<!-- location-model-start -->
		<div class="elementor-element elementor-element-locmodel01 e-flex e-con-boxed e-con e-parent" data-id="locmodel01" data-element_type="container" data-e-type="container">
			<div class="e-con-inner">
				<div class="elementor-element elementor-element-locmodel02 e-con-full e-flex e-con e-child" data-id="locmodel02" data-element_type="container" data-e-type="container">
					<div class="elementor-element elementor-element-locmodel03 elementor-widget elementor-widget-heading" data-id="locmodel03" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
						<div class="elementor-widget-container">
							<h2 class="elementor-heading-title elementor-size-default">${heading}</h2>
						</div>
					</div>
					<div class="elementor-element elementor-element-locmodel04 elementor-widget elementor-widget-text-editor" data-id="locmodel04" data-element_type="widget" data-e-type="widget" data-widget_type="text-editor.default">
						${visibleHtml}
					</div>
					<div class="elementor-element elementor-element-locmodel05 elementor-widget elementor-widget-html" data-id="locmodel05" data-element_type="widget" data-e-type="widget" data-widget_type="html.default">
						<div class="elementor-widget-container">
							<div class="loc-model-more" id="loc-model-more" aria-hidden="true">
								${hiddenHtml}
							</div>
						</div>
					</div>
					<div class="elementor-element elementor-element-locmodel06 elementor-widget elementor-widget-html" data-id="locmodel06" data-element_type="widget" data-e-type="widget" data-widget_type="html.default">
						<div class="elementor-widget-container">
							<button type="button" class="loc-model-readmore" aria-expanded="false" aria-controls="loc-model-more">${MODEL_COPY.readMore}</button>
						</div>
					</div>
				</div>
			</div>
		</div>
<!-- location-model-end -->`;
}

function buildModelInitScript() {
  return `<script type="text/javascript">
/* location-model-init */
(function () {
  function initLocationModelReadMore() {
    document.querySelectorAll('.elementor-element-locmodel01 .loc-model-readmore').forEach(function (btn) {
      if (btn.dataset.locModelInit) return;
      btn.dataset.locModelInit = '1';
      var section = btn.closest('.elementor-element-locmodel02');
      if (!section) return;
      var panel = section.querySelector('.loc-model-more');
      if (!panel) return;
      var readMore = btn.textContent.trim() || 'Read more';
      var readLess = 'Read less';
      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        panel.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
        panel.classList.toggle('is-open', !isOpen);
        btn.textContent = isOpen ? readMore : readLess;
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLocationModelReadMore);
  } else {
    initLocationModelReadMore();
  }
})();
</script>
`;
}

function findBlockEnd(html, dataId) {
  const marker = `elementor-element-${dataId}`;
  const idx = html.indexOf(marker);
  if (idx === -1) return -1;
  const open = html.lastIndexOf('<div ', idx);
  let depth = 0;
  let i = open;
  while (i < html.length) {
    if (html.startsWith('<div', i)) {
      depth += 1;
      i = html.indexOf('>', i) + 1;
    } else if (html.startsWith('</div>', i)) {
      depth -= 1;
      i += 6;
      if (depth === 0) return i;
    } else {
      i += 1;
    }
  }
  return -1;
}

function ensureModelStyles(html) {
  html = html.replace(/[\t ]*\/\* location-model-styles-start \*\/[\s\S]*?\/\* location-model-styles-end \*\/\n?/g, '');
  const elementorMarker = 'class="elementor elementor-14997">';
  const elementorIdx = html.indexOf(elementorMarker);
  if (elementorIdx === -1) throw new Error('elementor-14997 wrapper not found');
  const styleMarker = '\t\t<style>';
  const insertAt = html.indexOf(styleMarker, elementorIdx);
  if (insertAt === -1) throw new Error('Elementor style block not found');
  return `${html.slice(0, insertAt + styleMarker.length)}\n${buildModelStyles()}\n${html.slice(insertAt + styleMarker.length)}`;
}

function ensureModelInitScript(html) {
  html = html.replace(
    /<script type="text\/javascript">\s*\/\* location-model-init \*\/[\s\S]*?<\/script>\n?/g,
    ''
  );
  const snippet = buildModelInitScript();
  const faqInit = '/* location-faq-init */';
  if (html.includes(faqInit)) {
    return html.replace(
      /(<script type="text\/javascript">\s*\/\* location-faq-init \*\/[\s\S]*?<\/script>)/,
      `$1\n${snippet}`
    );
  }
  const anchor = 'id="qi-addons-for-elementor-script-js"';
  if (!html.includes(anchor)) {
    throw new Error('qi-addons script not found');
  }
  return html.replace(
    /<script type="text\/javascript" src="\/wp-content\/plugins\/qi-addons-for-elementor\/assets\/js\/main\.min\.js[^"]*" id="qi-addons-for-elementor-script-js"><\/script>/,
    `$&\n${snippet}`
  );
}

function findModelInsertPoint(html) {
  const ctaEnd = findBlockEnd(html, '8bf459c');
  if (ctaEnd !== -1) {
    return ctaEnd;
  }
  const faqMarker = '<!-- location-faq-start -->';
  const faqAt = html.indexOf(faqMarker);
  if (faqAt !== -1) {
    return faqAt;
  }
  const blogsEnd = findBlockEnd(html, 'f9a4935');
  if (blogsEnd === -1) throw new Error('Blog section not found');
  return blogsEnd;
}

function injectLocationModel(page) {
  const city = page.city || page.slug.charAt(0).toUpperCase() + page.slug.slice(1);
  const filePath = path.join(root, page.slug, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');

  html = html.replace(/[\t ]*<!-- location-model-start -->[\s\S]*?<!-- location-model-end -->\n?/g, '');
  const insertAt = findModelInsertPoint(html);
  const block = `\n${buildModelHtml(city)}\n`;
  html = html.slice(0, insertAt) + block + html.slice(insertAt);
  html = ensureModelStyles(html);
  html = ensureModelInitScript(html);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Injected model section into ${page.slug}/index.html`);
}

function removeLocationModel(page) {
  const filePath = path.join(root, page.slug, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(/[\t ]*<!-- location-model-start -->[\s\S]*?<!-- location-model-end -->\n?/g, '');
  html = html.replace(/[\t ]*\/\* location-model-styles-start \*\/[\s\S]*?\/\* location-model-styles-end \*\/\n?/g, '');
  html = html.replace(
    /<script type="text\/javascript">\s*\/\* location-model-init \*\/[\s\S]*?<\/script>\n?/g,
    ''
  );
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Removed model section from ${page.slug}/index.html`);
}

async function injectAllLocationModel(slugs = null) {
  const pages = slugs
    ? LOCATION_PAGES.filter((p) => slugs.includes(p.slug))
    : LOCATION_PAGES;
  for (const page of pages) {
    injectLocationModel(page);
  }
}

module.exports = {
  injectLocationModel,
  injectAllLocationModel,
  removeLocationModel,
  buildModelHtml,
  buildModelStyles,
};

if (require.main === module) {
  const remove = process.argv.includes('--remove');
  const slugs = process.argv.slice(2).filter((arg) => arg && arg !== '--remove');
  const task = remove
    ? Promise.all(slugs.length ? LOCATION_PAGES.filter((p) => slugs.includes(p.slug)).map(removeLocationModel) : LOCATION_PAGES.map(removeLocationModel))
    : injectAllLocationModel(slugs.length ? slugs : null);
  task.catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
