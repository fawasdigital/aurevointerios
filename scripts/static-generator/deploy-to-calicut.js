#!/usr/bin/env node
/**
 * Deploy the fixed Home 02 export to /calicut/ with correct asset paths.
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const source = path.join(root, 'calicut-export');
const target = path.join(root, 'calicut');
const fromBase = '/calicut-export/';
const toBase = '/calicut/';

async function walkFiles(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walkFiles(p));
    else out.push(p);
  }
  return out;
}

function rewriteBase(text) {
  return text
    .split(fromBase).join(toBase)
    .split('/calicut-export/').join('/calicut/');
}

(async () => {
  if (!(await fs.pathExists(source))) {
    console.error('Missing calicut-export/. Run: npm run mirror:calicut');
    process.exit(1);
  }

  console.log('Copying calicut-export → calicut …');
  await fs.emptyDir(target);
  await fs.copy(source, target);

  const files = await walkFiles(target);
  let changed = 0;
  for (const file of files) {
    if (!/\.(html?|css|js|json|svg)$/i.test(file)) continue;
    const original = await fs.readFile(file, 'utf8');
    const updated = rewriteBase(original);
    if (updated !== original) {
      await fs.writeFile(file, updated, 'utf8');
      changed++;
    }
  }

  console.log(`  rewrote ${changed} files to use ${toBase}`);

  execSync(`node scripts/static-generator/fix-export-images.js calicut ${toBase}`, {
    cwd: root,
    stdio: 'inherit',
  });

  // Light Aurevo rebrand on main page
  const indexPath = path.join(target, 'index.html');
  let html = await fs.readFile(indexPath, 'utf8');
  html = html.replace(
    /<title>[^<]*<\/title>/,
    '<title>Interior Designers in Calicut | Aurevo Interiors</title>'
  );
  html = html.replace(
    /content="Elementor 3\.29\.0[^"]*"/,
    'content="Aurevo Interiors — Calicut landing page"'
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    '<link rel="canonical" href="https://aurevointeriors.com/calicut/">'
  );
  await fs.writeFile(indexPath, html, 'utf8');

  execSync('node scripts/static-generator/apply-home-header.js calicut/index.html', {
    cwd: root,
    stdio: 'inherit',
  });

  execSync('node scripts/static-generator/inject-calicut-hmv-ba.js calicut/index.html', {
    cwd: root,
    stdio: 'inherit',
  });

  console.log('\nDone. Preview: http://localhost:5500/calicut/');
})();
