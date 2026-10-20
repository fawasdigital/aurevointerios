#!/usr/bin/env node
/**
 * Repair mirrored export paths so assets load from a subdirectory (e.g. /calicut-export/).
 *
 * Usage:
 *   node scripts/static-generator/fix-export-paths.js [export-dir] [base-path]
 */

const fs = require('fs-extra');
const path = require('path');

const exportDir = path.resolve(process.cwd(), process.argv[2] || 'calicut-export');
const basePath = (process.argv[3] || `/${path.basename(exportDir)}/`).replace(/\/?$/, '/');
const base = basePath.replace(/\/$/, '');
const GOOGLE_FONTS =
  'https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap';

const PREFIX_TARGETS = ['/wp-content/', '/wp-includes/', '/_external/'];

function prefixAssetPaths(text) {
  const doubled = `${base}${base}`.replace(/\/+/g, '/');
  let out = text.split(doubled).join(base);
  out = out.replace(
    /\/wp-content\/themes\/calicut-export\/interique\//g,
    `${base}/wp-content/themes/interique/`
  );
  for (const target of PREFIX_TARGETS) {
    const prefixed = `${base}${target}`;
    const re = new RegExp(`(?<!${escapeRegExp(base)})${escapeRegExp(target)}`, 'g');
    out = out.replace(re, prefixed);
  }
  // Top-level demo paths only (not /wp-content/themes/interique/…)
  out = out.replace(
    /(?<!\/themes)(?<!${escapeRegExp(base)})\/interique\//g,
    `${base}/interique/`
  );
  out = out.replace(
    /href="\/_external\/fonts\.googleapis\.com\/[^"]+"/g,
    `href="${GOOGLE_FONTS}"`
  );
  return out;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function walkFiles(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walkFiles(p));
    else out.push(p);
  }
  return out;
}

(async () => {
  console.log(`Fixing paths in ${exportDir}`);
  console.log(`  base path: ${basePath}`);

  const files = await walkFiles(exportDir);
  let changed = 0;
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.html', '.htm', '.css', '.js', '.json'].includes(ext)) continue;
    const original = await fs.readFile(file, 'utf8');
    const updated = prefixAssetPaths(original);
    if (updated !== original) {
      await fs.writeFile(file, updated, 'utf8');
      changed++;
    }
  }

  for (const bad of ['%22', '%22https:']) {
    const badPath = path.join(exportDir, bad);
    if (await fs.pathExists(badPath)) {
      await fs.remove(badPath);
      console.log(`  removed malformed folder: ${bad}`);
    }
  }

  console.log(`  updated ${changed} files`);
})();
