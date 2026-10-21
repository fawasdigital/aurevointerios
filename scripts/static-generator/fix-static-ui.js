#!/usr/bin/env node
/**
 * Repair UI/UX issues in a mirrored static export.
 */

const path = require('path');
const { processExport } = require('./image-post-process');

const exportDir = path.resolve(process.cwd(), process.argv[2] || 'static-site');
const basePath = process.argv[3] || '/';

(async () => {
  console.log(`Fixing UI/UX in ${exportDir}…`);
  const changed = await processExport(exportDir, basePath);
  console.log(changed ? `Updated ${changed} HTML files.` : 'No HTML changes needed.');
})();
