#!/usr/bin/env node
/**
 * Replace the Interiqué demo header with the Aurevo homepage header.
 */

const fs = require('fs-extra');
const path = require('path');

const root = process.cwd();
const homePath = path.join(root, 'index.html');
const targetPath = path.resolve(process.argv[2] || path.join(root, 'calicut/index.html'));

const HEADER_START = '<header id="masthead"';
const HEADER_END = '</header> <!-- #masthead .site-header -->';

function extractHeader(html) {
  const start = html.indexOf(HEADER_START);
  const end = html.indexOf(HEADER_END);
  if (start === -1 || end === -1) {
    throw new Error('Could not find site header in source HTML');
  }
  return html.slice(start, end + HEADER_END.length);
}

function replaceHeader(html, header) {
  const start = html.indexOf(HEADER_START);
  const end = html.indexOf(HEADER_END);
  if (start === -1 || end === -1) {
    throw new Error('Could not find site header in target HTML');
  }
  return html.slice(0, start) + header + html.slice(end + HEADER_END.length);
}

function prepareHeader(header) {
  let out = header;

  // Logo images: use direct src so they work without Smush lazyload on Calicut export
  const logoSrc = '/wp-content/uploads/2025/10/Logo2-Edited.png';
  out = out.replace(/<img\b[^>]*>/gi, (tag) => {
    const dataSrc = tag.match(/\bdata-src="([^"]+)"/i);
    const src = dataSrc ? dataSrc[1] : logoSrc;
    return tag
      .replace(/\bdata-src="[^"]*"/gi, '')
      .replace(/\bsrc="[^"]*"/i, `src="${src}"`)
      .replace(/\blazyloading\b/gi, '')
      .replace(/\blazyload\b/gi, '')
      .replace(/\sclass="\s*"/gi, '')
      .replace(/\s{2,}/g, ' ');
  });

  // Calicut is not the homepage — drop current-page markers from nav
  out = out
    .replace(/\s*current-menu-item\b/g, '')
    .replace(/\s*current_page_item\b/g, '')
    .replace(/\s*aria-current="page"/g, '')
    .replace(/\s*current_page_parent\b/g, '')
    .replace(/\s*current-menu-ancestor\b/g, '')
    .replace(/\s*current-menu-parent\b/g, '')
    .replace(/\s*current_page_ancestor\b/g, '')
    .replace(/\s*menu-item-has-children\b/g, '')
    .replace(/<ul class="sub-menu">[\s\S]*?<\/ul>\s*/g, '');

  return out;
}

function updateHeaderStyles(html) {
  let out = html;

  out = out.replace(
    /@media screen and \(min-width: 992px\) \{ \.site-title img \{ max-height: \d+px; \} \}/,
    '@media screen and (min-width: 992px) { .site-title img { max-height: 82px; } }'
  );
  out = out.replace(
    /@media screen and \(max-width: 991px\) \{ \.site-title img \{ max-height: \d+px; \} \}/,
    '@media screen and (max-width: 991px) { .site-title img { max-height: 56px; } }'
  );

  if (!out.includes('.is-header-smaller .site-header.clone .site-title img')) {
    out = out.replace(
      /@media screen and \(max-width: 991px\) \{ \.site-title img \{ max-height: 56px; \} \}/,
      `@media screen and (max-width: 991px) { .site-title img { max-height: 56px; } }

@media screen and (min-width: 992px) { .is-header-smaller .site-header.clone .site-title img { max-height: 72px; } }`
    );
  }

  if (!out.includes('.site-branding-wrap { padding: 105px 0; }')) {
    out = out.replace(
      /\.top-bar \{ line-height: 36px; \}/,
      `.top-bar { line-height: 36px; }

@media screen and (min-width: 992px) { .site-branding-wrap { padding: 105px 0; } }

@media screen and (max-width: 991px) { .site-branding-wrap { padding: 110px 0; } }`
    );
  }

  // Home 02 uses a transparent floating header; homepage does not
  out = out
    .replace(/\s*is-header-float\b/g, '')
    .replace(/\s*is-header-transparent\b/g, '');

  return out;
}

(async () => {
  if (!(await fs.pathExists(homePath))) {
    console.error('Missing index.html');
    process.exit(1);
  }
  if (!(await fs.pathExists(targetPath))) {
    console.error(`Missing target: ${targetPath}`);
    process.exit(1);
  }

  const homeHtml = await fs.readFile(homePath, 'utf8');
  let targetHtml = await fs.readFile(targetPath, 'utf8');

  const header = prepareHeader(extractHeader(homeHtml));
  targetHtml = replaceHeader(targetHtml, header);
  targetHtml = updateHeaderStyles(targetHtml);

  await fs.writeFile(targetPath, targetHtml, 'utf8');
  console.log(`Applied homepage header → ${path.relative(root, targetPath)}`);
})();
