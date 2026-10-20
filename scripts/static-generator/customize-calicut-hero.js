#!/usr/bin/env node
/**
 * Restore the original Home 02 hero (Spaces / sofas / Reimagined).
 */

const fs = require('fs-extra');
const path = require('path');

const targetPath = path.resolve(process.argv[2] || path.join(process.cwd(), 'calicut/index.html'));

function assetPrefix(html, filePath) {
  if (filePath.includes('calicut-export') || html.includes('"/calicut-export/wp-content/')) {
    return '/calicut-export/wp-content/';
  }
  if (html.includes('"/calicut/wp-content/') || filePath.includes(`${path.sep}calicut${path.sep}`)) {
    return '/calicut/wp-content/';
  }
  return '/wp-content/';
}

function sofaBlock(prefix) {
  const p = prefix;
  return `\t\t<div class="elementor-element elementor-element-7882eb5 e-con-full elementor-hidden-mobile e-flex e-con e-child e-lazyloaded" data-id="7882eb5" data-element_type="container">
				<div class="elementor-element elementor-element-ded85bb elementor-widget elementor-widget-image" data-id="ded85bb" data-element_type="widget" data-settings="{&quot;_animation&quot;:&quot;zoomIn&quot;,&quot;_animation_delay&quot;:300}" data-widget_type="image.default">
				<div class="elementor-widget-container">
															<img fetchpriority="high" decoding="async" width="710" height="943" src="${p}uploads/sites/2/2025/04/Coral-Red-Armchair-771x1024.jpeg" class="attachment-large size-large wp-image-15771" alt="" srcset="${p}uploads/sites/2/2025/04/Coral-Red-Armchair-771x1024.jpeg 771w, ${p}uploads/sites/2/2025/04/Coral-Red-Armchair-226x300.jpeg 226w, ${p}uploads/sites/2/2025/04/Coral-Red-Armchair-768x1019.jpeg 768w, ${p}uploads/sites/2/2025/04/Coral-Red-Armchair-414x550.jpeg 414w, ${p}uploads/sites/2/2025/04/Coral-Red-Armchair-1060x1407.jpeg 1060w, ${p}uploads/sites/2/2025/04/Coral-Red-Armchair-1157x1536.jpeg 1157w, ${p}uploads/sites/2/2025/04/Coral-Red-Armchair-1543x2048.jpeg 1543w, ${p}uploads/sites/2/2025/04/Coral-Red-Armchair-550x730.jpeg 550w, ${p}uploads/sites/2/2025/04/Coral-Red-Armchair-377x500.jpeg 377w, ${p}uploads/sites/2/2025/04/Coral-Red-Armchair-814x1080.jpeg 814w, ${p}uploads/sites/2/2025/04/Coral-Red-Armchair.jpeg 1808w" sizes="(max-width: 710px) 100vw, 710px">															</div>
				</div>
				<div class="elementor-element elementor-element-29cccb1 elementor-widget elementor-widget-image" data-id="29cccb1" data-element_type="widget" data-settings="{&quot;_animation&quot;:&quot;zoomIn&quot;,&quot;_animation_delay&quot;:300}" data-widget_type="image.default">
				<div class="elementor-widget-container">
															<img decoding="async" width="710" height="710" src="${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-1024x1024.jpeg" class="attachment-large size-large wp-image-15784" alt="" srcset="${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-1024x1024.jpeg 1024w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-300x300.jpeg 300w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-150x150.jpeg 150w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-768x768.jpeg 768w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-550x550.jpeg 550w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-1060x1060.jpeg 1060w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-1920x1920.jpeg 1920w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-1536x1536.jpeg 1536w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-2048x2048.jpeg 2048w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-500x500.jpeg 500w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-1080x1080.jpeg 1080w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-650x650.jpeg 650w, ${p}uploads/sites/2/2025/04/Modern-Sage-Armchair-1300x1300.jpeg 1300w" sizes="(max-width: 710px) 100vw, 710px">															</div>
				</div>
				</div>
`;
}

function reimaginedBlock() {
  return `\t\t<div class="elementor-element elementor-element-156615c e-con-full e-flex e-con e-child e-lazyloaded" data-id="156615c" data-element_type="container">
				<div class="elementor-element elementor-element-583d36c elementor-widget elementor-widget-qi_addons_for_elementor_animated_text" data-id="583d36c" data-element_type="widget" data-widget_type="qi_addons_for_elementor_animated_text.default">
				<div class="elementor-widget-container">
					<div class="qodef-shortcode qodef-m qodef-qi-animated-text qodef--animated-by-letter qodef--alignment-right qodef-qi--has-appear qodef-qi--appeared qodef-qi--appeared qodef--appear-from-right" data-appear-delay="600">
		<h1 class="qodef-m-title">
		<span class="qodef-e-word-holder">Reimagined</span>	</h1>
</div>
				</div>
				</div>
				</div>
`;
}

function restoreHero(html, filePath) {
  let out = html;
  const prefix = assetPrefix(html, filePath);

  out = out.replace(
    /<h1 class="qodef-m-title calicut-hero-title">[\s\S]*?<\/h1>/,
    `<h1 class="qodef-m-title">
		<span class="qodef-e-word-holder">Spaces</span>	</h1>`
  );

  out = out.replace(
    /<h1 class="qodef-m-title">\s*<span class="qodef-e-word-holder">Interior<\/span>[\s\S]*?<\/h1>/,
    `<h1 class="qodef-m-title">
		<span class="qodef-e-word-holder">Spaces</span>	</h1>`
  );

  if (!out.includes('elementor-element-7882eb5')) {
    out = out.replace(
      /(\t\t<\/div>\n)(\t\t<div class="elementor-element elementor-element-62de865)/,
      `$1${sofaBlock(prefix)}$2`
    );
  }

  if (!out.includes('elementor-element-156615c')) {
    out = out.replace(
      /(\t\t<\/div>\n)(\t\t<div class="elementor-element elementor-element-62de865)/,
      `$1${reimaginedBlock()}$2`
    );
  }

  out = out.replace(
    /\s*\/\* Calicut hero headline \*\/[\s\S]*?\.elementor-element-4a48a4c \.elementor-element-156615c \{[\s\S]*?\}\s*/,
    '\n'
  );

  return out;
}

(async () => {
  if (!(await fs.pathExists(targetPath))) {
    console.error('Missing', targetPath);
    process.exit(1);
  }
  const html = await fs.readFile(targetPath, 'utf8');
  const updated = restoreHero(html, targetPath);
  await fs.writeFile(targetPath, updated, 'utf8');
  console.log('Restored original hero →', path.relative(process.cwd(), targetPath));
})();
