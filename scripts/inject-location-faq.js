#!/usr/bin/env node
/**
 * Inject bottom FAQ section (10 Q&As) on location pages.
 * Placed after the CTA box and before the footer, inside the Elementor wrapper.
 */

const fs = require('fs-extra');
const path = require('path');
const { LOCATION_PAGES } = require('./location-pages.config');

const root = process.cwd();

const FAQ_ITEMS = [
  {
    q: 'Why choose Aurevo Interiors in {{city}}?',
    a:
      'Award-winning design for {{city}}, tailored to local taste, climate, and how you actually live.',
  },
  {
    q: 'What interior design services do you offer in {{city}}?',
    a:
      'Kitchens, living rooms, bedrooms, offices, 3D design, custom furniture, and full turnkey delivery.',
  },
  {
    q: 'How much does interior design cost in {{city}}?',
    a:
      'Pricing depends on scope and materials. We share a clear estimate after a free consultation.',
  },
  {
    q: 'How long does a typical interior project take in {{city}}?',
    a:
      'One room: 4–8 weeks. Full home: 2–4 months. We confirm timelines before work starts.',
  },
  {
    q: 'Do you handle turnkey interior projects in {{city}}?',
    a:
      'Yes — design, materials, execution, and handover in one place, with no contractor juggling.',
  },
  {
    q: 'Can you design apartments and villas in {{city}}?',
    a:
      'Yes. From compact 2BHKs to luxury villas across {{city}} and nearby areas.',
  },
  {
    q: 'Do you provide 3D design visualizations in {{city}}?',
    a:
      'Yes. 3D renders and walkthroughs are included so you can approve the look before build.',
  },
  {
    q: 'What materials and finishes do you use for interiors in {{city}}?',
    a:
      'Climate-suited boards, laminates, veneers, stone tops, and hardware chosen for durability.',
  },
  {
    q: 'Do you offer modular kitchen designs in {{city}}?',
    a:
      'Yes. Smart layouts, premium finishes, and storage planned around your kitchen and routine.',
  },
  {
    q: 'How do I get started with Aurevo Interiors in {{city}}?',
    a:
      'Book a free consult online or by phone. We visit your site in {{city}} and share a 3D proposal.',
  },
];

function fillCity(text, city) {
  return text.replace(/\{\{city\}\}/g, city);
}

function shieldHeadingQ(text) {
  return text.replace(/Q/g, '<span class="loc-faq__qcap">Q</span>');
}

function buildAccordionItem(question, answer) {
  return `<article class="loc-faq__item">
	<h3 class="loc-faq__q">
		<button type="button" class="loc-faq__btn" aria-expanded="false">
			<span class="loc-faq__label">${question}</span>
			<span class="loc-faq__icon" aria-hidden="true"></span>
		</button>
	</h3>
	<div class="loc-faq__a" hidden>
		<p>${answer}</p>
	</div>
</article>`;
}

function buildFaqStyles() {
  return `			/* location-faq-styles-start */
			.loc-faq {
				padding: 1.5% 5% 4%;
			}
			.loc-faq__title {
				font-family: "Bricolage Grotesque", sans-serif;
				font-size: clamp(30px, 4vw, 44px);
				font-weight: 500;
				line-height: 1.12;
				letter-spacing: -0.02em;
				color: #000000;
				text-align: center;
				margin: 0 0 28px;
				padding: 0;
			}
			.loc-faq__qcap {
				font-family: "Jost", sans-serif;
				font-weight: 500;
			}
			.loc-faq__grid {
				display: grid;
				grid-template-columns: 1fr 1fr;
				grid-template-rows: repeat(var(--loc-faq-rows), auto);
				grid-auto-flow: column;
				gap: 12px 20px;
				align-items: start;
			}
			.loc-faq__item {
				background: #ffffff;
				border: 1px solid rgba(0, 0, 0, 0.06);
				border-radius: 6px;
				box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
			}
			.loc-faq__item.is-open {
				border-color: rgba(96, 124, 99, 0.35);
			}
			.loc-faq__q {
				margin: 0;
				padding: 0;
				font-size: inherit;
				font-weight: inherit;
				line-height: inherit;
				letter-spacing: 0;
				text-transform: none;
			}
			.loc-faq__btn {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 12px;
				width: 100%;
				margin: 0;
				padding: 16px 18px;
				border: 0;
				border-radius: 6px;
				background: transparent;
				box-shadow: none;
				color: #000000;
				font-family: "Jost", sans-serif;
				font-size: 17px;
				font-weight: 500;
				line-height: 1.4;
				letter-spacing: 0;
				text-transform: none;
				text-align: left;
				cursor: pointer;
			}
			.loc-faq__label {
				flex: 1 1 auto;
			}
			.loc-faq__icon {
				position: relative;
				width: 14px;
				height: 14px;
				flex: 0 0 14px;
			}
			.loc-faq__icon::before,
			.loc-faq__icon::after {
				content: "";
				position: absolute;
				left: 0;
				top: 6px;
				width: 14px;
				height: 1.5px;
				background: #000000;
			}
			.loc-faq__icon::after {
				transform: rotate(90deg);
			}
			.loc-faq__item.is-open .loc-faq__icon::after {
				content: none;
			}
			.loc-faq__a {
				padding: 0 18px 16px;
				color: rgba(0, 0, 0, 0.73);
			}
			.loc-faq__a p {
				margin: 0;
				font-family: "Jost", sans-serif;
				font-size: 15px;
				font-weight: 400;
				line-height: 1.6;
				letter-spacing: 0;
				text-transform: none;
				color: rgba(0, 0, 0, 0.73);
			}
			@media (max-width: 1024px) {
				.loc-faq {
					padding-top: 3%;
					padding-bottom: 5%;
				}
				.loc-faq__title {
					font-size: 28px;
					margin-bottom: 18px;
				}
				.loc-faq__btn {
					font-size: 16px;
					padding: 14px 16px;
				}
			}
			@media (max-width: 767px) {
				.loc-faq {
					padding-top: 5%;
					padding-bottom: 6%;
				}
				.loc-faq__grid {
					grid-template-columns: 1fr;
					grid-template-rows: none;
					grid-auto-flow: row;
				}
			}
			/* location-faq-styles-end */`;
}

function ensureFaqStyles(html) {
  html = html.replace(/[\t ]*\/\* location-faq-styles-start \*\/[\s\S]*?\/\* location-faq-styles-end \*\/\n?/g, '');
  const elementorMarker = 'class="elementor elementor-14997">';
  const elementorIdx = html.indexOf(elementorMarker);
  if (elementorIdx === -1) {
    throw new Error('elementor-14997 wrapper not found');
  }
  const styleMarker = '\t\t<style>';
  const insertAt = html.indexOf(styleMarker, elementorIdx);
  if (insertAt === -1) {
    throw new Error('Elementor style block not found');
  }
  return `${html.slice(0, insertAt + styleMarker.length)}\n${buildFaqStyles()}\n${html.slice(insertAt + styleMarker.length)}`;
}

function ensureFaqInitScript(html) {
  const marker = '/* location-faq-init */';
  html = html.replace(
    /<script type="text\/javascript">\s*\/\* location-faq-init \*\/[\s\S]*?<\/script>\n?/g,
    ''
  );
  const snippet = `<script type="text/javascript">
/* location-faq-init */
(function () {
  function closeItem(item) {
    item.classList.remove('is-open');
    var btn = item.querySelector('.loc-faq__btn');
    var panel = item.querySelector('.loc-faq__a');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (panel) panel.hidden = true;
  }
  function openItem(item) {
    item.classList.add('is-open');
    var btn = item.querySelector('.loc-faq__btn');
    var panel = item.querySelector('.loc-faq__a');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (panel) panel.hidden = false;
  }
  document.addEventListener('click', function (event) {
    var btn = event.target.closest && event.target.closest('.loc-faq__btn');
    if (!btn) return;
    var item = btn.closest('.loc-faq__item');
    var root = btn.closest('.loc-faq');
    if (!item || !root) return;
    var wasOpen = item.classList.contains('is-open');
    root.querySelectorAll('.loc-faq__item.is-open').forEach(closeItem);
    if (!wasOpen) openItem(item);
  });
})();
</script>
`;
  const anchor = 'id="qi-addons-for-elementor-script-js"';
  if (!html.includes(anchor)) {
    throw new Error('qi-addons script not found');
  }
  return html.replace(
    /<script type="text\/javascript" src="\/wp-content\/plugins\/qi-addons-for-elementor\/assets\/js\/main\.min\.js[^"]*" id="qi-addons-for-elementor-script-js"><\/script>/,
    `$&\n${snippet}`
  );
}

function ensureAccordionScript(html) {
  if (html.includes('jquery-ui-accordion-js')) {
    return html;
  }
  const anchor = 'id="jquery-ui-core-js"';
  if (!html.includes(anchor)) {
    throw new Error('jquery-ui-core script not found');
  }
  return html.replace(
    /<script type="text\/javascript" src="\/wp-includes\/js\/jquery\/ui\/core\.min\.js[^"]*" id="jquery-ui-core-js"><\/script>/,
    `$&\n<script type="text/javascript" src="/wp-includes/js/jquery/ui/accordion.min.js?ver=1.13.3" id="jquery-ui-accordion-js"></script>`
  );
}

function buildFaqSection(title, items) {
  const rows = Math.ceil(items.length / 2);
  const cards = items.map(({ q, a }) => buildAccordionItem(q, a)).join('\n');
  return `		<!-- location-faq-start -->
		<section class="loc-faq" aria-label="${title.replace(/<[^>]+>/g, '')}">
			<h2 class="loc-faq__title">${shieldHeadingQ(title)}</h2>
			<div class="loc-faq__grid" style="--loc-faq-rows: ${rows}">
${cards}
			</div>
		</section>
<!-- location-faq-end -->`;
}

function buildFaqHtml(city) {
  const items = FAQ_ITEMS.map(({ q, a }) => ({
    q: fillCity(q, city),
    a: fillCity(a, city),
  }));
  return buildFaqSection('Frequently Asked Questions', items);
}

function parseExistingFaq(html) {
  const blockMatch = html.match(/<!-- location-faq-start -->([\s\S]*?)<!-- location-faq-end -->/);
  if (!blockMatch) return null;
  const block = blockMatch[1];
  const titleMatch = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  const title = titleMatch
    ? titleMatch[1].replace(/<span class="loc-faq__qcap">Q<\/span>/g, 'Q').trim()
    : 'Frequently Asked Questions';
  const itemRe =
    /<(?:span class="qodef-e-title"|span class="loc-faq__label")>([\s\S]*?)<\/span>[\s\S]*?<(?:div class="qodef-e-content-inner"|div class="loc-faq__a")>(?:\s*<(?:p|h6)>)?([\s\S]*?)(?:<\/(?:p|h6)>)?\s*<\/div>/g;
  const items = [];
  let match;
  while ((match = itemRe.exec(block))) {
    items.push({ q: match[1].trim(), a: match[2].trim() });
  }
  if (!items.length) return null;
  return { title, items };
}

function upgradeLocationFaq(page) {
  const filePath = path.join(root, page.slug, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');
  const parsed = parseExistingFaq(html);
  if (!parsed) {
    throw new Error(`No FAQ block to upgrade in ${page.slug}/index.html`);
  }
  html = html.replace(
    /[\t ]*<!-- location-faq-start -->[\s\S]*?<!-- location-faq-end -->\n?/,
    `\n${buildFaqSection(parsed.title, parsed.items)}\n`
  );
  html = ensureFaqStyles(html);
  html = ensureFaqInitScript(html);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Upgraded FAQ layout in ${page.slug}/index.html (${parsed.items.length} items)`);
}

function findFaqInsertPoint(html, slug) {
  const modelEndMarker = '<!-- location-model-end -->';
  const modelEnd = html.indexOf(modelEndMarker);
  if (modelEnd !== -1) {
    return modelEnd + modelEndMarker.length;
  }
  const ctaEnd = findBlockEnd(html, '8bf459c');
  if (ctaEnd !== -1) {
    return ctaEnd;
  }
  throw new Error(`CTA section not found in ${slug}/index.html — run inject-location-cta.js first`);
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

function injectLocationFaq(page) {
  const city = page.city || page.slug.charAt(0).toUpperCase() + page.slug.slice(1);
  const filePath = path.join(root, page.slug, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');

  html = html.replace(/[\t ]*<!-- location-faq-start -->[\s\S]*?<!-- location-faq-end -->\n?/g, '');

  const insertAt = findFaqInsertPoint(html, page.slug);
  const block = `\n${buildFaqHtml(city)}\n`;
  html = html.slice(0, insertAt) + block + html.slice(insertAt);
  html = ensureFaqStyles(html);
  html = ensureAccordionScript(html);
  html = ensureFaqInitScript(html);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Injected bottom FAQ (10 Q&As) into ${page.slug}/index.html`);
}

function removeLocationFaq(page) {
  const filePath = path.join(root, page.slug, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(/[\t ]*<!-- location-faq-start -->[\s\S]*?<!-- location-faq-end -->\n?/g, '');
  html = html.replace(/[\t ]*\/\* location-faq-styles-start \*\/[\s\S]*?\/\* location-faq-styles-end \*\/\n?/g, '');
  html = html.replace(
    /<script type="text\/javascript">\s*\/\* location-faq-init \*\/[\s\S]*?<\/script>\n?/g,
    ''
  );
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Removed FAQ from ${page.slug}/index.html`);
}

function refreshLocationFaqStyles(page) {
  const filePath = path.join(root, page.slug, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');
  html = ensureFaqStyles(html);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Updated FAQ styles in ${page.slug}/index.html`);
}

async function injectAllLocationFaq(slugs = null) {
  const pages = slugs
    ? LOCATION_PAGES.filter((p) => slugs.includes(p.slug))
    : LOCATION_PAGES;
  for (const page of pages) {
    injectLocationFaq(page);
  }
}

async function upgradeAllLocationFaq(slugs = null) {
  const pages = slugs
    ? LOCATION_PAGES.filter((p) => slugs.includes(p.slug))
    : LOCATION_PAGES;
  for (const page of pages) {
    upgradeLocationFaq(page);
  }
}

async function refreshAllLocationFaqStyles(slugs = null) {
  const pages = slugs
    ? LOCATION_PAGES.filter((p) => slugs.includes(p.slug))
    : LOCATION_PAGES;
  for (const page of pages) {
    refreshLocationFaqStyles(page);
  }
}

async function removeAllLocationFaq(slugs = null) {
  const pages = slugs
    ? LOCATION_PAGES.filter((p) => slugs.includes(p.slug))
    : LOCATION_PAGES;
  for (const page of pages) {
    removeLocationFaq(page);
  }
}

module.exports = {
  injectLocationFaq,
  injectAllLocationFaq,
  removeLocationFaq,
  removeAllLocationFaq,
  refreshLocationFaqStyles,
  refreshAllLocationFaqStyles,
  upgradeLocationFaq,
  upgradeAllLocationFaq,
  buildFaqHtml,
  buildFaqStyles,
  ensureFaqStyles,
  ensureAccordionScript,
  ensureFaqInitScript,
};

if (require.main === module) {
  const remove = process.argv.includes('--remove');
  const stylesOnly = process.argv.includes('--styles-only');
  const upgrade = process.argv.includes('--upgrade');
  const slugs = process.argv
    .slice(2)
    .filter((arg) => arg && arg !== '--remove' && arg !== '--styles-only' && arg !== '--upgrade');
  const task = remove
    ? removeAllLocationFaq(slugs.length ? slugs : null)
    : stylesOnly
      ? refreshAllLocationFaqStyles(slugs.length ? slugs : null)
      : upgrade
        ? upgradeAllLocationFaq(slugs.length ? slugs : null)
        : injectAllLocationFaq(slugs.length ? slugs : null);
  task.catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
