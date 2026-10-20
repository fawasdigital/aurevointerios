#!/usr/bin/env node
/**
 * Repair incomplete calicut-export by syncing assets from calicut
 * and rewriting HTML/CSS/JS references to match files on disk.
 */

const fs = require('fs-extra');
const path = require('path');

const root = process.cwd();
const source = path.join(root, 'calicut');
const target = path.join(root, 'calicut-export');
const fromBase = '/calicut/';
const toBase = '/calicut-export/';

const ASSET_DIRS = ['wp-content', 'wp-includes', 'interique', '_external'];

function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

function buildAssetMap(dir) {
  const map = new Map();
  for (const file of walkFiles(dir)) {
    const rel = path.relative(dir, file).replace(/\\/g, '/');
    const plain = rel.replace(/__q_[^./]+(?=\.[^.]+$)/, '');
    if (!map.has(plain)) map.set(plain, rel);
    map.set(rel, rel);
  }
  return map;
}

function resolveAssetPath(assetPath, map) {
  const clean = assetPath.split('?')[0].replace(/^\//, '');
  if (map.has(clean)) return map.get(clean);
  const plain = clean.replace(/__q_[^./]+(?=\.[^.]+$)/, '');
  if (map.has(plain)) return map.get(plain);
  return null;
}

function rewriteAssetRefs(text, base, map) {
  const baseNoSlash = base.replace(/\/$/, '');
  return text
    .replace(/((?:href|src)=["'])([^"']+)(["'])/gi, (full, pre, url, post) => {
      if (!url.startsWith(baseNoSlash + '/')) return full;
      const rel = url.slice(baseNoSlash.length + 1);
      const resolved = resolveAssetPath(rel, map);
      if (!resolved) return full;
      const query = url.includes('?') ? url.slice(url.indexOf('?')) : '';
      return `${pre}${baseNoSlash}/${resolved}${query}${post}`;
    })
    .replace(/url\((['"]?)([^'")]+)\1\)/gi, (full, quote, url) => {
      if (!url.startsWith(baseNoSlash + '/')) return full;
      const rel = url.slice(baseNoSlash.length + 1);
      const resolved = resolveAssetPath(rel, map);
      if (!resolved) return full;
      const query = url.includes('?') ? url.slice(url.indexOf('?')) : '';
      return `url(${quote || ''}${baseNoSlash}/${resolved}${query}${quote || ''})`;
    })
    .replace(/srcset="([^"]+)"/gi, (full, srcset) => {
      const parts = srcset.split(',').map((part) => {
        const trimmed = part.trim();
        const [u, descriptor] = trimmed.split(/\s+/);
        if (!u || !u.startsWith(baseNoSlash + '/')) return part;
        const rel = u.slice(baseNoSlash.length + 1);
        const resolved = resolveAssetPath(rel, map);
        if (!resolved) return part;
        const query = u.includes('?') ? u.slice(u.indexOf('?')) : '';
        return descriptor ? `${baseNoSlash}/${resolved}${query} ${descriptor}` : `${baseNoSlash}/${resolved}${query}`;
      });
      return `srcset="${parts.join(', ')}"`;
    });
}

(async () => {
  if (!(await fs.pathExists(source))) {
    console.error('Missing calicut/. Run deploy first or mirror to calicut.');
    process.exit(1);
  }

  console.log('Syncing assets from calicut → calicut-export …');
  for (const dir of ASSET_DIRS) {
    const src = path.join(source, dir);
    const dst = path.join(target, dir);
    if (!(await fs.pathExists(src))) continue;
    await fs.copy(src, dst, { overwrite: true });
    console.log(`  synced ${dir}/`);
  }

  const map = buildAssetMap(target);
  const files = walkFiles(target).filter((f) => /\.(html?|css|js|json)$/i.test(f));
  let changed = 0;
  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');
    const updated = rewriteAssetRefs(original, toBase, map);
    if (updated !== original) {
      await fs.writeFile(file, updated, 'utf8');
      changed++;
    }
  }
  console.log(`  rewrote asset refs in ${changed} files`);

  const indexPath = path.join(target, 'index.html');
  if (await fs.pathExists(indexPath)) {
    let html = await fs.readFile(indexPath, 'utf8');
    html = html
      .replace(/alt="Red accent chair"/g, 'alt=""')
      .replace(/alt="Green accent chair"/g, 'alt=""');
    await fs.writeFile(indexPath, html, 'utf8');
  }

  console.log('Done. Run: npm run fix:calicut-images');
})();
