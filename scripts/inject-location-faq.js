#!/usr/bin/env node
/**
 * Inject bottom FAQ section (10 Q&As) on location pages.
 * Placed after the CTA box and before the footer, inside the Elementor wrapper.
 */

const fs = require('fs-extra');
const path = require('path');
const { LOCATION_PAGES } = require('./location-pages.config');

const root = process.cwd();

const PLUS_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" id="Capa_1" height="512" viewBox="0 0 207.2 207.2" width="512"><g><g id="_3"><path d="m103.6 207.2c-4.087 0-7.4-3.313-7.4-7.4v-192.4c0-4.087 3.313-7.4 7.4-7.4s7.4 3.313 7.4 7.4v192.4c0 4.087-3.313 7.4-7.4 7.4z"></path><path d="m199.8 111h-192.4c-4.087 0-7.4-3.313-7.4-7.4s3.313-7.4 7.4-7.4h192.4c4.087 0 7.4 3.313 7.4 7.4s-3.313 7.4-7.4 7.4z"></path></g></g></svg>';
const MINUS_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" id="Capa_1" height="512" viewBox="0 0 512 512" width="512"><g><path d="m480 288h-448c-17.673 0-32-14.327-32-32s14.327-32 32-32h448c17.673 0 32 14.327 32 32s-14.327 32-32 32z"></path></g></svg>';

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

function buildAccordionItem(question, answer) {
  return `<h3 class="qodef-e-title-holder">
	<span class="qodef-e-title">${question}</span>
	<span class="qodef-e-mark">
		<span class="qodef-icon--plus">
				<span class="qodef-e-icon">
		${PLUS_ICON}	</span>
			</span>
		<span class="qodef-icon--minus">
				<span class="qodef-e-icon">
		${MINUS_ICON}	</span>
			</span>
	</span>
</h3>
<div class="qodef-e-content">
	<div class="qodef-e-content-inner">
		<p>${answer}</p>	</div>
</div>`;
}

function buildFaqStyles() {
  return `			/* location-faq-styles-start */
			.elementor-14997 .elementor-element-locfaq01 {
				--display: flex;
				--flex-direction: row;
				--flex-wrap: wrap;
				--padding-top: 1.5%;
				--padding-bottom: 4%;
				--padding-left: 5%;
				--padding-right: 5%;
				margin-top: 0;
				padding-top: 1.5%;
				padding-bottom: 4%;
				padding-left: 5%;
				padding-right: 5%;
			}
			.elementor-14997 .elementor-element-locfaq01 > .e-con-inner {
				display: flex;
				flex-direction: row;
				flex-wrap: wrap;
				width: 100%;
				align-items: flex-start;
				gap: 0;
			}
			.elementor-14997 .elementor-element-locfaq02 {
				width: 100%;
				flex: 0 0 100%;
				max-width: 100%;
				margin: 0 0 18px;
			}
			.elementor-14997 .elementor-element-locfaq03 > .elementor-widget-container {
				margin: 0;
				padding: 0;
			}
			.elementor-14997 .elementor-element-locfaq03 .elementor-heading-title {
				font-family: "Bricolage Grotesque", sans-serif;
				font-size: clamp(30px, 4vw, 44px);
				font-weight: 500;
				line-height: 1.12;
				letter-spacing: -0.02em;
				color: #000000;
				margin: 0;
				padding: 0;
				text-align: center;
			}
			.elementor-14997 .elementor-element-locfaq07 {
				display: flex;
				flex-direction: row;
				flex-wrap: wrap;
				width: 100%;
				flex: 0 0 100%;
				max-width: 100%;
				gap: 20px;
				align-items: flex-start;
			}
			.elementor-14997 .elementor-element-locfaq08,
			.elementor-14997 .elementor-element-locfaq09 {
				width: calc(50% - 10px);
				flex: 0 0 calc(50% - 10px);
				max-width: calc(50% - 10px);
			}
			.elementor-14997 .elementor-element-locfaq08 > .elementor-widget-container,
			.elementor-14997 .elementor-element-locfaq09 > .elementor-widget-container {
				margin: 0;
				padding: 0;
			}
			.elementor-14997 .elementor-element-locfaq08 .qodef-qi-accordion,
			.elementor-14997 .elementor-element-locfaq09 .qodef-qi-accordion {
				visibility: visible !important;
			}
			.elementor-14997 .elementor-element-locfaq08 .qodef-qi-accordion .qodef-e-title-holder,
			.elementor-14997 .elementor-element-locfaq09 .qodef-qi-accordion .qodef-e-title-holder {
				font-family: "Jost", sans-serif;
				font-size: 17px;
				font-weight: 500;
				line-height: 1.4;
				color: #000000;
				background-color: #ffffff;
				border: 1px solid rgba(0, 0, 0, 0.06);
				border-radius: 6px;
				box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
				padding: 16px 18px !important;
				margin: 0 0 12px !important;
				gap: 12px;
				cursor: pointer;
			}
			.elementor-14997 .elementor-element-locfaq08 .qodef-qi-accordion .qodef-e-title-holder.ui-state-active,
			.elementor-14997 .elementor-element-locfaq09 .qodef-qi-accordion .qodef-e-title-holder.ui-state-active {
				border-color: rgba(96, 124, 99, 0.35);
			}
			.elementor-14997 .elementor-element-locfaq08 .qodef-qi-accordion .qodef-e-mark,
			.elementor-14997 .elementor-element-locfaq09 .qodef-qi-accordion .qodef-e-mark {
				flex-shrink: 0;
			}
			.elementor-14997 .elementor-element-locfaq08 .qodef-qi-accordion .qodef-e-mark svg,
			.elementor-14997 .elementor-element-locfaq09 .qodef-qi-accordion .qodef-e-mark svg {
				width: 14px;
				height: 14px;
				fill: #000000;
			}
			.elementor-14997 .elementor-element-locfaq08 .qodef-qi-accordion .qodef-e-content,
			.elementor-14997 .elementor-element-locfaq09 .qodef-qi-accordion .qodef-e-content {
				color: rgba(0, 0, 0, 0.73);
				background-color: #ffffff;
				border: 1px solid rgba(0, 0, 0, 0.06);
				border-top: 0;
				border-radius: 0 0 6px 6px;
				box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
				padding: 0 18px 16px !important;
				margin: -8px 0 12px !important;
			}
			.elementor-14997 .elementor-element-locfaq08 .qodef-qi-accordion .qodef-e-content p,
			.elementor-14997 .elementor-element-locfaq09 .qodef-qi-accordion .qodef-e-content p {
				font-family: "Jost", sans-serif;
				font-size: 15px;
				line-height: 1.6;
				margin: 0;
			}
			@media (max-width: 1024px) {
				.elementor-14997 .elementor-element-locfaq01 {
					padding-top: 3%;
					padding-bottom: 5%;
				}
				.elementor-14997 .elementor-element-locfaq02 {
					margin-bottom: 16px;
				}
				.elementor-14997 .elementor-element-locfaq03 .elementor-heading-title {
					font-size: 28px;
				}
				.elementor-14997 .elementor-element-locfaq08 .qodef-qi-accordion .qodef-e-title-holder,
				.elementor-14997 .elementor-element-locfaq09 .qodef-qi-accordion .qodef-e-title-holder {
					font-size: 16px;
					padding: 14px 16px !important;
				}
			}
			@media (max-width: 767px) {
				.elementor-14997 .elementor-element-locfaq01 {
					padding-top: 5%;
					padding-bottom: 6%;
				}
				.elementor-14997 .elementor-element-locfaq07 {
					gap: 0;
				}
				.elementor-14997 .elementor-element-locfaq08,
				.elementor-14997 .elementor-element-locfaq09 {
					width: 100%;
					flex: 0 0 100%;
					max-width: 100%;
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
(function ($) {
  function initLocationFaqAccordion() {
    $('.elementor-element-locfaq08 .qodef-qi-accordion, .elementor-element-locfaq09 .qodef-qi-accordion').each(function () {
      var $accordion = $(this);
      if ($accordion.hasClass('qodef--init')) return;
      if (
        window.qodefAddonsCore &&
        qodefAddonsCore.shortcodes &&
        qodefAddonsCore.shortcodes.qi_addons_for_elementor_accordion &&
        qodefAddonsCore.shortcodes.qi_addons_for_elementor_accordion.qodefAccordion
      ) {
        qodefAddonsCore.shortcodes.qi_addons_for_elementor_accordion.qodefAccordion.initItem($accordion);
      }
    });
  }
  $(document).ready(initLocationFaqAccordion);
  $(window).on('load', initLocationFaqAccordion);
})(jQuery);
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

function buildFaqHtml(city) {
  const leftItems = FAQ_ITEMS.slice(0, 5)
    .map(({ q, a }) => buildAccordionItem(fillCity(q, city), fillCity(a, city)))
    .join('\n');
  const rightItems = FAQ_ITEMS.slice(5)
    .map(({ q, a }) => buildAccordionItem(fillCity(q, city), fillCity(a, city)))
    .join('\n');

  return `		<!-- location-faq-start -->
		<div class="elementor-element elementor-element-locfaq01 e-flex e-con-boxed e-con e-parent" data-id="locfaq01" data-element_type="container" data-e-type="container">
					<div class="e-con-inner">
		<div class="elementor-element elementor-element-locfaq02 e-con-full e-flex e-con e-child" data-id="locfaq02" data-element_type="container" data-e-type="container">
				<div class="elementor-element elementor-element-locfaq03 elementor-widget elementor-widget-heading" data-id="locfaq03" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
				<div class="elementor-widget-container">
					<h2 class="elementor-heading-title elementor-size-default">Frequently Asked Questions</h2>
				</div>
				</div>
				</div>
		<div class="elementor-element elementor-element-locfaq07 e-con-full e-flex e-con e-child" data-id="locfaq07" data-element_type="container" data-e-type="container">
				<div class="elementor-element elementor-element-locfaq08 elementor-widget elementor-widget-qi_addons_for_elementor_accordion" data-id="locfaq08" data-element_type="widget" data-e-type="widget" data-widget_type="qi_addons_for_elementor_accordion.default">
				<div class="elementor-widget-container">
					<div class="qodef-shortcode qodef-m qodef-qi-accordion qodef-qi-clear qodef-behavior--accordion qodef-layout--simple qodef-style--border-between qodef-height--auto">
${leftItems}
</div>
				</div>
				</div>
				<div class="elementor-element elementor-element-locfaq09 elementor-widget elementor-widget-qi_addons_for_elementor_accordion" data-id="locfaq09" data-element_type="widget" data-e-type="widget" data-widget_type="qi_addons_for_elementor_accordion.default">
				<div class="elementor-widget-container">
					<div class="qodef-shortcode qodef-m qodef-qi-accordion qodef-qi-clear qodef-behavior--accordion qodef-layout--simple qodef-style--border-between qodef-height--auto">
${rightItems}
</div>
				</div>
				</div>
				</div>
					</div>
				</div>
<!-- location-faq-end -->`;
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
  buildFaqHtml,
  buildFaqStyles,
  ensureFaqStyles,
  ensureAccordionScript,
  ensureFaqInitScript,
};

if (require.main === module) {
  const remove = process.argv.includes('--remove');
  const stylesOnly = process.argv.includes('--styles-only');
  const slugs = process.argv.slice(2).filter((arg) => arg && arg !== '--remove' && arg !== '--styles-only');
  const task = remove
    ? removeAllLocationFaq(slugs.length ? slugs : null)
    : stylesOnly
      ? refreshAllLocationFaqStyles(slugs.length ? slugs : null)
      : injectAllLocationFaq(slugs.length ? slugs : null);
  task.catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
