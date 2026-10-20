#!/usr/bin/env node
/**
 * Download every referenced image/font/media missing from a mirrored export.
 */

const fs = require('fs-extra');
const path = require('path');
const https = require('https');

const exportDir = path.resolve(process.cwd(), process.argv[2] || 'calicut-export');
const basePath = (process.argv[3] || `/${path.basename(exportDir)}/`).replace(/\/?$/, '/');
const base = basePath.replace(/\/$/, '');
const DEMO = 'https://themes.pixelwars.org/interique/demo-01/';
const ASSET_RE = /\.(jpe?g|png|gif|webp|svg|avif|mp4|woff2?|ttf|eot)(\?|$)/i;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(html?|css|js|json)$/i.test(p)) out.push(p);
  }
  return out;
}

function collectUrls(text) {
  const urls = new Set();
  const add = (u) => {
    if (!u || u.startsWith('data:') || u.startsWith('#')) return;
    urls.add(u);
  };

  for (const m of text.matchAll(/(?:src|srcset|data-src|data-lazy-src|href)=["']([^"']+)["']/gi)) {
    m[1].split(',').forEach((part) => add(part.trim().split(/\s+/)[0]));
  }
  for (const m of text.matchAll(/url\((['"]?)([^'")]+)\1\)/gi)) add(m[2]);
  for (const m of text.matchAll(/https:\/\/themes\.pixelwars\.org\/interique\/demo-01\/([^"'\\)\s]+)/gi)) {
    add(`${base}/${m[1]}`);
  }
  for (const m of text.matchAll(/https:\\\/\\\/themes\.pixelwars\.org\\\/interique\\\/demo-01\\\/([^"'\\)]+)/gi)) {
    add(`${base}/${m[1].replace(/\\\//g, '/')}`);
  }
  return urls;
}

function toRel(u) {
  if (u.startsWith(base + '/')) return u.slice(base.length + 1);
  if (u.startsWith('/wp-content/') || u.startsWith('/wp-includes/')) return u.slice(1);
  if (u.includes('/interique/demo-01/')) {
    const idx = u.indexOf('/wp-content/');
    if (idx >= 0) return u.slice(idx + 1);
  }
  return null;
}

function toDemoUrl(rel) {
  return `${DEMO}${rel.split('?')[0]}`;
}

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

function fixBrokenPaths(text) {
  let out = text;
  out = out.replace(/\/interique\/demo-01\/calicut-export\//g, `${base}/`);
  out = out.replace(/https:\/\/themes\.pixelwars\.org\/interique\/demo-01\//g, `${base}/`);
  out = out.replace(/https:\\\/\\\/themes\.pixelwars\.org\\\/interique\\\/demo-01\\\//g, `${base}/`);
  return out;
}

(async () => {
  const files = walk(exportDir);
  const refs = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const u of collectUrls(text)) refs.add(u);
  }

  const rels = [...refs]
    .map(toRel)
    .filter(Boolean)
    .filter((r) => ASSET_RE.test(r));

  const unique = [...new Set(rels)];
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const rel of unique) {
    const local = path.join(exportDir, rel.split('?')[0]);
    if (await fs.pathExists(local)) {
      skipped++;
      continue;
    }
    try {
      await download(toDemoUrl(rel), local);
      downloaded++;
      console.log(`  + ${rel}`);
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      failed++;
      console.warn(`  ! ${rel} (${err.message})`);
    }
  }

  let rewritten = 0;
  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const updated = fixBrokenPaths(original);
    if (updated !== original) {
      await fs.writeFile(file, updated, 'utf8');
      rewritten++;
    }
  }

  console.log('\nDone');
  console.log(`  referenced: ${unique.length}`);
  console.log(`  downloaded: ${downloaded}`);
  console.log(`  existing:   ${skipped}`);
  console.log(`  failed:     ${failed}`);
  console.log(`  rewritten:  ${rewritten} files`);
})();
