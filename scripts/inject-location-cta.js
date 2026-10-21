#!/usr/bin/env node
/**
 * Place the bottom CTA box inside the Elementor wrapper (matches homepage layout).
 */

const fs = require('fs-extra');
const path = require('path');
const { LOCATION_PAGES } = require('./location-pages.config');

const root = process.cwd();

function removeDivBlock(html, openIndex) {
  let depth = 0;
  let i = openIndex;
  while (i < html.length) {
    if (html.startsWith('<div', i)) {
      depth += 1;
      i = html.indexOf('>', i) + 1;
    } else if (html.startsWith('</div>', i)) {
      depth -= 1;
      i += 6;
      if (depth === 0) {
        return html.slice(0, openIndex) + html.slice(i);
      }
    } else {
      i += 1;
    }
  }
  return html;
}

function removeElementorBlock(html, dataId) {
  const marker = `elementor-element-${dataId}`;
  let result = html;
  while (result.includes(marker)) {
    const idx = result.indexOf(marker);
    const open = result.lastIndexOf('<div ', idx);
    if (open === -1) break;
    result = removeDivBlock(result, open);
  }
  return result;
}

function buildBottomCtaHtml() {
  return `		<div class="elementor-element elementor-element-8bf459c e-flex e-con-boxed e-con e-parent" data-id="8bf459c" data-element_type="container" data-e-type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
					<div class="e-con-inner">
		<div class="elementor-element elementor-element-5c84cb6 e-con-full e-flex e-con e-child" data-id="5c84cb6" data-element_type="container" data-e-type="container">
		<div class="elementor-element elementor-element-4b8a2b3 e-con-full e-flex e-con e-child" data-id="4b8a2b3" data-element_type="container" data-e-type="container">
		<div class="elementor-element elementor-element-2822c07 e-con-full e-flex e-con e-child" data-id="2822c07" data-element_type="container" data-e-type="container">
				<div class="elementor-element elementor-element-d6fc9d6 elementor-widget__width-initial elementor-hidden-desktop elementor-hidden-tablet elementor-hidden-mobile elementor-widget elementor-widget-qi_addons_for_elementor_animated_text" data-id="d6fc9d6" data-element_type="widget" data-e-type="widget" data-widget_type="qi_addons_for_elementor_animated_text.default">
				<div class="elementor-widget-container">
					<div class="qodef-shortcode qodef-m qodef-qi-animated-text qodef--animated-by-letter qodef--alignment-center qodef-qi--has-appear qodef--appear-fade" >
		<h3 class="qodef-m-title">
		<span class="qodef-e-word-holder">—</span> <span class="qodef-e-word-holder">Collaboration</span>	</h3>
</div>
				</div>
				</div>
				<div class="elementor-element elementor-element-9842da8 elementor-invisible elementor-widget elementor-widget-qi_addons_for_elementor_animated_text" data-id="9842da8" data-element_type="widget" data-e-type="widget" data-settings="{&quot;_animation&quot;:&quot;fadeIn&quot;}" data-widget_type="qi_addons_for_elementor_animated_text.default">
				<div class="elementor-widget-container">
					<div class="qodef-shortcode qodef-m qodef-qi-animated-text qodef--animated-by-letter qodef--alignment-center qodef-qi--has-appear qodef--appear-fade" >
		<h1 class="qodef-m-title">
		<span class="qodef-e-word-holder">Let’s</span> <span class="qodef-e-word-holder">Build</span> <span class="qodef-e-word-holder">Your</span> <span class="qodef-e-word-holder">Perfect</span> <span class="qodef-e-word-holder">Space</span>	</h1>
</div>
				</div>
				</div>
				<div class="elementor-element elementor-element-1d57685 elementor-widget elementor-widget-spacer" data-id="1d57685" data-element_type="widget" data-e-type="widget" data-widget_type="spacer.default">
							<div class="elementor-spacer">
			<div class="elementor-spacer-inner"></div>
		</div>
						</div>
				<div class="elementor-element elementor-element-d3b4ee5 -text-faded elementor-invisible elementor-widget elementor-widget-heading" data-id="d3b4ee5" data-element_type="widget" data-e-type="widget" data-settings="{&quot;_animation&quot;:&quot;fadeInUp&quot;,&quot;_animation_delay&quot;:400}" data-widget_type="heading.default">
					<h3 class="elementor-heading-title elementor-size-default">Want to transform your space? Contact us today to schedule a <br>consultation and turn your ideas into reality.</h3>				</div>
				<div class="elementor-element elementor-element-148779b elementor-widget elementor-widget-spacer" data-id="148779b" data-element_type="widget" data-e-type="widget" data-widget_type="spacer.default">
							<div class="elementor-spacer">
			<div class="elementor-spacer-inner"></div>
		</div>
						</div>
				<div class="elementor-element elementor-element-ec6aa85 e-transform elementor-invisible elementor-widget elementor-widget-qi_addons_for_elementor_button" data-id="ec6aa85" data-element_type="widget" data-e-type="widget" data-settings="{&quot;_animation&quot;:&quot;fadeInUp&quot;,&quot;_animation_delay&quot;:800,&quot;_transform_scale_effect_hover&quot;:{&quot;unit&quot;:&quot;px&quot;,&quot;size&quot;:1.1,&quot;sizes&quot;:[]},&quot;_transform_scale_effect_hover_tablet&quot;:{&quot;unit&quot;:&quot;px&quot;,&quot;size&quot;:&quot;&quot;,&quot;sizes&quot;:[]},&quot;_transform_scale_effect_hover_mobile&quot;:{&quot;unit&quot;:&quot;px&quot;,&quot;size&quot;:&quot;&quot;,&quot;sizes&quot;:[]}}" data-widget_type="qi_addons_for_elementor_button.default">
				<div class="elementor-widget-container">
					<a class="qodef-shortcode qodef-m qodef-qi-button qodef-html--link qodef-layout--filled qodef-type--standard qodef-icon--right qodef-hover--icon-move-horizontal-short" href="https://wa.me/919562695661" target="_self">
	<span class="qodef-m-text">Get In Touch</span>
		<span class="qodef-m-icon">
		<span class="qodef-m-icon-inner">
			<svg xmlns="http://www.w3.org/2000/svg" height="21" viewBox="0 0 21 21" width="21"><g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" transform="translate(6 6)"><path d="m8.5 7.5v-7h-7"></path><path d="m8.5.5-8 8"></path></g></svg>					</span>
	</span>
</a>
				</div>
				</div>
				</div>
				</div>
				</div>
					</div>
				</div>`;
}

function injectLocationCta(page) {
  const filePath = path.join(root, page.slug, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');

  html = removeElementorBlock(html, '8bf459c');

  // Remove premature Elementor wrapper close left after FAQ/CTA removal.
  html = html.replace(
    /(\t\t\t\t<\/div>\n\t\t\t<\/div>)\n\t\t\n\t\t\t\t<\/div>\n\t\t\n\t\n\s*/g,
    '$1\n'
  );

  const cta = buildBottomCtaHtml();
  const blogsMarker = '<div class="elementor-element elementor-element-f9a4935';
  const blogsIdx = html.indexOf(blogsMarker);
  if (blogsIdx === -1) {
    throw new Error(`Blogs section not found in ${page.slug}/index.html`);
  }

  const blogsOpen = html.lastIndexOf('<div ', blogsIdx);
  let depth = 0;
  let i = blogsOpen;
  let blogsEnd = -1;
  while (i < html.length) {
    if (html.startsWith('<div', i)) {
      depth += 1;
      i = html.indexOf('>', i) + 1;
    } else if (html.startsWith('</div>', i)) {
      depth -= 1;
      i += 6;
      if (depth === 0) {
        blogsEnd = i;
        break;
      }
    } else {
      i += 1;
    }
  }

  if (blogsEnd === -1) {
    throw new Error(`Could not find blogs section end in ${page.slug}/index.html`);
  }

  html = `${html.slice(0, blogsEnd)}\n${cta}\n\t\t\t\t</div>\n${html.slice(blogsEnd)}`;

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Fixed bottom CTA in ${page.slug}/index.html`);
}

function injectAllLocationCta(slugs = null) {
  const pages = slugs
    ? LOCATION_PAGES.filter((p) => slugs.includes(p.slug))
    : LOCATION_PAGES;
  for (const page of pages) {
    injectLocationCta(page);
  }
}

module.exports = { injectLocationCta, injectAllLocationCta, buildBottomCtaHtml };

if (require.main === module) {
  const slugs = process.argv.slice(2).filter(Boolean);
  injectAllLocationCta(slugs.length ? slugs : null);
}
