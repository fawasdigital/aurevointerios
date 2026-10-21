#!/usr/bin/env node
/**
 * Make all images visible in a static mirrored export (no WordPress JS required).
 */

const path = require('path');
const { processExport } = require('./image-post-process');

const exportDir = path.resolve(process.cwd(), process.argv[2] || 'static-site');
const basePath = process.argv[3] || '/';

(async () => {
  console.log(`Fixing images in ${exportDir}…`);
  const changed = await processExport(exportDir, basePath);
  console.log(changed ? `Updated ${changed} HTML files.` : 'No HTML changes needed.');
})();
