#!/usr/bin/env node
/**
 * Remove the Test nav link from all page headers.
 * The /test/ page stays available; it is just hidden from the menu.
 */

const fs = require('fs-extra');
const path = require('path');

const root = process.cwd();
const patterns = [
  /\n<li[^>]*id="menu-item-test"[^>]*>[\s\S]*?<\/li>/g,
  /\n<li[^>]*>\s*<a[^>]*href="\/test\/"[^>]*>Test<\/a>\s*<\/li>/g,
];

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'calicut-export' || entry.name === '.git') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(p));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

(async () => {
  let changed = 0;
  for (const file of await walk(root)) {
    const original = await fs.readFile(file, 'utf8');
    let updated = original;
    for (const re of patterns) {
      updated = updated.replace(re, '');
    }
    if (updated !== original) {
      await fs.writeFile(file, updated, 'utf8');
      changed++;
      console.log('  fixed', path.relative(root, file));
    }
  }
  console.log(changed ? `Removed Test nav from ${changed} files.` : 'No Test nav links found (already clean).');
})();
