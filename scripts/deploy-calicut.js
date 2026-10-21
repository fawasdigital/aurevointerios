#!/usr/bin/env node
/** @deprecated Use deploy-location-pages.js */
const { deployLocationPages } = require('./deploy-location-pages');

deployLocationPages(['interior-designers-in-calicut']).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
