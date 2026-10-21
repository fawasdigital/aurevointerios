#!/usr/bin/env node
/**
 * Static site generator — recursive crawl, asset mirror, clean URLs, path rewrite.
 *
 * Usage:
 *   node scripts/static-generator/mirror.js [options]
 *
 * Options:
 *   --url <url>         Start URL (default: Interiqué Home 02)
 *   --output <dir>      Output directory (default: static-site)
 *   --entry <slug>      Save this path segment as index.html at output root
 *   --delay <ms>        Delay between requests (default: 600)
 *   --scope <prefix>    Only crawl HTML under this URL prefix
 *   --single            Mirror only the start page (+ assets), no link crawl
 *   --max-pages <n>     Stop after N HTML pages (default: unlimited)
 *   --base-path <p>     Public URL prefix for rewritten links (default: /)
 *   --root-relative     Alias for --base-path / (Cloudflare Pages / Netlify)
 *   --help              Show help and exit
 */

const axios = require('axios');

const EXCLUDE_PATH_RE = /\/(wp-json|feed|xmlrpc\.php|wp-comments-post\.php|oembed)(\/|$)/i;
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');

// ── CLI args ──────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
Static site generator (axios + cheerio + fs-extra)

  node scripts/static-generator/mirror.js [options]

Options:
  --url <url>         Start URL
  --output <dir>      Output folder (default: static-site)
  --entry <slug>      Promote a page slug to output/index.html
  --scope <prefix>    Limit crawl to URLs under this prefix
  --single            One HTML page + all assets (no link crawl)
  --max-pages <n>     Max HTML pages to crawl
  --delay <ms>        Pause between requests (default: 600)
  --base-path <path>  Rewrite prefix (default: / for portable hosting)
  --root-relative     Same as --base-path /
  --no-entry          Do not promote any page to index.html
  --help              Show this help

Examples:
  # Full recursive mirror for Cloudflare Pages / Netlify (root-relative paths)
  node scripts/static-generator/mirror.js \\
    --url https://themes.pixelwars.org/interique/demo-01/home-02/ \\
    --output static-site \\
    --entry home-02 \\
    --scope https://themes.pixelwars.org/interique/demo-01/ \\
    --delay 600 \\
    --root-relative

  # Single landing page + assets into a subdirectory
  node scripts/static-generator/mirror.js \\
    --url https://themes.pixelwars.org/interique/demo-01/home-02/ \\
    --output site-export \\
    --entry home-02 \\
    --single \\
    --base-path /site-export/
`);
}

function parseArgs(argv) {
  const opts = {
    startUrl: 'https://themes.pixelwars.org/interique/demo-01/home-02/',
    outputDir: path.resolve(process.cwd(), 'static-site'),
    entrySlug: 'home-02',
    delayMs: 600,
    scopePrefix: null,
    maxRetries: 3,
    singlePage: false,
    maxPages: Infinity,
    basePath: '/',
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else if (a === '--url' && argv[i + 1]) opts.startUrl = argv[++i];
    else if (a === '--output' && argv[i + 1]) opts.outputDir = path.resolve(process.cwd(), argv[++i]);
    else if (a === '--entry' && argv[i + 1]) opts.entrySlug = argv[++i];
    else if (a === '--delay' && argv[i + 1]) opts.delayMs = parseInt(argv[++i], 10);
    else if (a === '--scope' && argv[i + 1]) opts.scopePrefix = argv[++i];
    else if (a === '--max-pages' && argv[i + 1]) opts.maxPages = parseInt(argv[++i], 10);
    else if (a === '--base-path' && argv[i + 1]) opts.basePath = argv[++i];
    else if (a === '--root-relative') opts.basePath = '/';
    else if (a === '--single') opts.singlePage = true;
    else if (a === '--no-entry') opts.entrySlug = null;
  }
  if (!opts.basePath) opts.basePath = '/';
  if (!opts.basePath.endsWith('/')) opts.basePath += '/';
  if (opts.basePath === '//') opts.basePath = '/';
  if (!opts.scopePrefix) {
    const u = new URL(opts.startUrl);
    opts.scopePrefix = `${u.origin}${dirnamePath(u.pathname)}`;
    if (!opts.scopePrefix.endsWith('/')) opts.scopePrefix += '/';
  }
  return opts;
}

function dirnamePath(p) {
  const d = path.posix.dirname(p);
  return d === '.' ? '' : d;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── URL helpers ───────────────────────────────────────────────────────────
function normalizeUrl(href, base) {
  if (!href || typeof href !== 'string') return null;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') || trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:')) {
    return null;
  }
  try {
    const u = new URL(trimmed, base);
    u.hash = '';
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.href;
  } catch {
    return null;
  }
}

function isHtmlUrl(urlStr) {
  const u = new URL(urlStr);
  const p = u.pathname.toLowerCase();
  if (p.endsWith('.css') || p.endsWith('.js') || p.endsWith('.json') ||
      p.endsWith('.jpg') || p.endsWith('.jpeg') || p.endsWith('.png') ||
      p.endsWith('.gif') || p.endsWith('.webp') || p.endsWith('.svg') ||
      p.endsWith('.woff') || p.endsWith('.woff2') || p.endsWith('.ttf') ||
      p.endsWith('.eot') || p.endsWith('.ico') || p.endsWith('.pdf') ||
      p.endsWith('.mp4') || p.endsWith('.webm') || p.endsWith('.xml')) {
    return false;
  }
  return true;
}

function scopePathPrefix(scopePrefix) {
  return new URL(scopePrefix).pathname.replace(/\/$/, '') || '';
}

function urlPathToRelative(urlStr, scopePrefix, origin) {
  const u = new URL(urlStr);
  let rel = u.pathname;
  const scopePath = scopePathPrefix(scopePrefix);
  if (u.hostname === new URL(origin).hostname && scopePath && rel.startsWith(scopePath)) {
    rel = rel.slice(scopePath.length) || '';
    if (!rel || rel === '/') rel = 'scope-root/';
  }
  if (rel.endsWith('/')) rel += 'index.html';
  else if (!path.posix.extname(rel)) rel += '/index.html';
  if (u.search) {
    const safe = Buffer.from(u.search).toString('base64url').slice(0, 40);
    const ext = path.posix.extname(rel) || '.html';
    const base = ext === '.html' ? rel.replace(/\/index\.html$/, '') : rel.replace(new RegExp(`${ext}$`), '');
    rel = `${base}__q_${safe}${ext === '.html' ? '/index.html' : ext}`;
  }
  if (u.hostname !== new URL(origin).hostname) {
    rel = path.posix.join('_external', u.hostname, rel);
  }
  if (rel.startsWith('/')) rel = rel.slice(1);
  return rel;
}

function urlToLocalPath(urlStr, outputDir, origin, scopePrefix) {
  return path.join(outputDir, urlPathToRelative(urlStr, scopePrefix, origin));
}

function pageOutputPath(urlStr, outputDir, opts) {
  const normalizedStart = new URL(opts.startUrl).href.replace(/#.*$/, '').replace(/\/$/, '');
  const normalizedPage = urlStr.replace(/#.*$/, '').replace(/\/$/, '');

  if (opts.entrySlug !== null && normalizedPage === normalizedStart) {
    return path.join(outputDir, 'index.html');
  }

  return path.join(outputDir, urlPathToRelative(urlStr, opts.scopePrefix, opts.startUrl));
}

function shouldSkipPage(urlStr) {
  const p = new URL(urlStr).pathname;
  return EXCLUDE_PATH_RE.test(p);
}

function toPublicPath(localPath, outputDir, basePath = '/') {
  const rel = path.relative(outputDir, localPath).split(path.sep).join('/');
  if (!basePath || basePath === '/') return '/' + rel;
  const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${base}/${rel}`;
}

// ── HTTP ──────────────────────────────────────────────────────────────────
async function fetchBuffer(url, opts, retries = opts.maxRetries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 45000,
        headers: {
          'User-Agent': 'AurevoStaticMirror/1.0 (+https://aurevointerios.vercel.app)',
          Accept: '*/*',
        },
        maxRedirects: 5,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      return { data: Buffer.from(res.data), contentType: res.headers['content-type'] || '' };
    } catch (err) {
      const status = err.response?.status;
      if (attempt < retries && (status === 429 || status === 502 || status === 503 || status >= 500)) {
        const wait = opts.delayMs * attempt * 2;
        console.warn(`  retry ${attempt}/${retries} for ${url} (${status || err.code}) — wait ${wait}ms`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
}

// ── srcset parser ─────────────────────────────────────────────────────────
function parseSrcset(srcset) {
  if (!srcset) return [];
  return srcset.split(',').map((part) => {
    const bits = part.trim().split(/\s+/);
    return bits[0] || null;
  }).filter(Boolean);
}

// ── Extract URLs from CSS ─────────────────────────────────────────────────
function extractCssUrls(cssText) {
  const urls = [];
  const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  let m;
  while ((m = re.exec(cssText)) !== null) {
    urls.push(m[2]);
  }
  return urls;
}

// ── Crawler state ─────────────────────────────────────────────────────────
class Mirror {
  constructor(opts) {
    this.opts = opts;
    this.origin = new URL(opts.startUrl).origin;
    this.pageQueue = [];
    this.assetQueue = [];
    this.visitedPages = new Set();
    this.visitedAssets = new Set();
    this.urlToLocal = new Map();
    this.pageUrlToLocal = new Map();
    this.allOriginUrls = new Set();
  }

  inScope(urlStr) {
    return urlStr.startsWith(this.opts.scopePrefix) || urlStr.startsWith(this.origin);
  }

  inCrawlScope(urlStr) {
    return urlStr.startsWith(this.opts.scopePrefix);
  }

  enqueuePage(url) {
    if (!url || this.visitedPages.has(url)) return;
    if (!isHtmlUrl(url)) return;
    if (shouldSkipPage(url)) return;
    if (!this.inCrawlScope(url)) return;
    if (this.opts.singlePage && url.replace(/\/$/, '') !== this.opts.startUrl.replace(/\/$/, '')) return;
    if (this.pageUrlToLocal.size >= this.opts.maxPages) return;
    this.visitedPages.add(url);
    this.pageQueue.push(url);
  }

  enqueueAsset(url) {
    if (!url || this.visitedAssets.has(url)) return;
    this.visitedAssets.add(url);
    this.assetQueue.push(url);
    this.allOriginUrls.add(url);
  }

  collectFromHtml(html, pageUrl, $) {
    const base = pageUrl;

    if (!this.opts.singlePage) {
      $('a[href]').each((_, el) => {
        const u = normalizeUrl($(el).attr('href'), base);
        if (u) this.enqueuePage(u);
      });
    }

    const attrSelectors = [
      ['link[href]', 'href'],
      ['link[rel="preload"][as="image"]', 'href'],
      ['script[src]', 'src'],
      ['img[src]', 'src'],
      ['img[data-src]', 'data-src'],
      ['img[data-lazy-src]', 'data-lazy-src'],
      ['img[data-original]', 'data-original'],
      ['img[data-bg]', 'data-bg'],
      ['source[src]', 'src'],
      ['video[src]', 'src'],
      ['video[data-src]', 'data-src'],
      ['video[poster]', 'poster'],
      ['audio[src]', 'src'],
      ['embed[src]', 'src'],
      ['iframe[src]', 'src'],
      ['object[data]', 'data'],
      ['form[action]', 'action'],
    ];

    $('meta[content]').each((_, el) => {
      const content = $(el).attr('content') || '';
      if (/^https?:\/\//i.test(content)) {
        const u = normalizeUrl(content, base);
        if (!u) return;
        if (isHtmlUrl(u) && this.inCrawlScope(u)) this.enqueuePage(u);
        else this.enqueueAsset(u);
      }
    });

    for (const [sel, attr] of attrSelectors) {
      $(sel).each((_, el) => {
        const u = normalizeUrl($(el).attr(attr), base);
        if (!u) return;
        if (isHtmlUrl(u) && this.inCrawlScope(u)) {
          this.enqueuePage(u);
        } else {
          this.enqueueAsset(u);
        }
      });
    }

    $('img[srcset], source[srcset]').each((_, el) => {
      for (const src of parseSrcset($(el).attr('srcset'))) {
        const u = normalizeUrl(src, base);
        if (u) this.enqueueAsset(u);
      }
    });

    $('style').each((_, el) => {
      const text = $(el).html() || '';
      for (const raw of extractCssUrls(text)) {
        const u = normalizeUrl(raw, base);
        if (u) this.enqueueAsset(u);
      }
    });

    $('[style]').each((_, el) => {
      for (const raw of extractCssUrls($(el).attr('style') || '')) {
        const u = normalizeUrl(raw, base);
        if (u) this.enqueueAsset(u);
      }
    });

    $('[data-settings]').each((_, el) => {
      const raw = ($(el).attr('data-settings') || '')
        .replace(/&quot;/g, '"')
        .replace(/&#0*38;/g, '&')
        .replace(/&amp;/g, '&');
      for (const m of raw.matchAll(/https?:\/\/[^"'\\]+/g)) {
        const u = normalizeUrl(m[0], base);
        if (!u) continue;
        if (isHtmlUrl(u) && this.inCrawlScope(u)) this.enqueuePage(u);
        else this.enqueueAsset(u);
      }
    });

    for (const m of html.matchAll(/https?:\/\/themes\.pixelwars\.org\/interique\/demo-01\/[^"'\\)\s]+/g)) {
      const u = normalizeUrl(m[0], base);
      if (!u) continue;
      if (isHtmlUrl(u) && this.inCrawlScope(u)) this.enqueuePage(u);
      else this.enqueueAsset(u);
    }
  }

  async downloadAsset(url) {
    const localPath = urlToLocalPath(url, this.opts.outputDir, this.origin, this.opts.scopePrefix);
    this.urlToLocal.set(url, localPath);
    await fs.ensureDir(path.dirname(localPath));
    if (await fs.pathExists(localPath)) {
      return localPath;
    }
    try {
      const { data, contentType } = await fetchBuffer(url, this.opts);
      await fs.writeFile(localPath, data);
      if (contentType.includes('text/css') || localPath.endsWith('.css')) {
        const css = data.toString('utf8');
        for (const raw of extractCssUrls(css)) {
          const u = normalizeUrl(raw, url);
          if (u) this.enqueueAsset(u);
        }
      }
      console.log(`  asset: ${path.relative(this.opts.outputDir, localPath)}`);
      return localPath;
    } catch (err) {
      console.warn(`  skip asset: ${url} (${err.message})`);
      return null;
    }
  }

  async downloadPage(url) {
    const localPath = pageOutputPath(url, this.opts.outputDir, this.opts);
    this.pageUrlToLocal.set(url, localPath);
    await fs.ensureDir(path.dirname(localPath));

    const { data } = await fetchBuffer(url, this.opts);
    const html = data.toString('utf8');
    const $ = cheerio.load(html, { decodeEntities: false });
    this.collectFromHtml(html, url, $);
    await fs.writeFile(localPath, html, 'utf8');
    console.log(`  page:  ${path.relative(this.opts.outputDir, localPath)}`);
    return localPath;
  }

  rewriteHtml(content, filePath) {
    const $ = cheerio.load(content, { decodeEntities: false });
    const rewriteBase = this.opts.scopePrefix;

    const rewriteAttr = (el, attr) => {
      const val = $(el).attr(attr);
      if (!val) return;
      if (attr === 'content' && !/^https?:\/\//i.test(val) && !val.startsWith('/')) return;
      const abs = normalizeUrl(val, rewriteBase);
      if (!abs) return;
      const local = this.urlToLocal.get(abs) || this.pageUrlToLocal.get(abs);
      if (local) {
        $(el).attr(attr, toPublicPath(local, this.opts.outputDir, this.opts.basePath));
      }
    };

    const rewriteTargets = [
      ['a', 'href'], ['link', 'href'], ['script', 'src'], ['img', 'src'],
      ['img', 'data-src'], ['img', 'data-lazy-src'], ['img', 'data-original'], ['img', 'data-bg'],
      ['source', 'src'], ['video', 'src'], ['video', 'data-src'], ['video', 'poster'],
      ['audio', 'src'], ['embed', 'src'], ['iframe', 'src'], ['object', 'data'],
      ['form', 'action'], ['meta', 'content'],
    ];
    for (const [tag, attr] of rewriteTargets) {
      $(`${tag}[${attr}]`).each((_, el) => rewriteAttr(el, attr));
    }

    $('img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || '';
      const isPlaceholder = !src || src.startsWith('data:') || /placeholder|blank|1x1/i.test(src);
      for (const lazyAttr of ['data-src', 'data-lazy-src', 'data-original']) {
        const lazy = $img.attr(lazyAttr);
        if (!lazy) continue;
        const abs = normalizeUrl(lazy, rewriteBase);
        const local = abs && (this.urlToLocal.get(abs) || this.pageUrlToLocal.get(abs));
        if (local && isPlaceholder) {
          $img.attr('src', toPublicPath(local, this.opts.outputDir, this.opts.basePath));
        }
        rewriteAttr(el, lazyAttr);
      }
      $img.attr('loading', 'eager');
    });

    $('[style]').each((_, el) => {
      const style = $(el).attr('style') || '';
      let updated = style;
      for (const raw of extractCssUrls(style)) {
        const abs = normalizeUrl(raw, rewriteBase);
        if (!abs) continue;
        const local = this.urlToLocal.get(abs) || this.pageUrlToLocal.get(abs);
        if (!local) continue;
        const pub = toPublicPath(local, this.opts.outputDir, this.opts.basePath);
        updated = updated.split(raw).join(pub);
      }
      if (updated !== style) $(el).attr('style', updated);
    });

    $('img[srcset], source[srcset], picture source[srcset]').each((_, el) => {
      const srcset = $(el).attr('srcset');
      if (!srcset) return;
      const parts = srcset.split(',').map((part) => {
        const bits = part.trim().split(/\s+/);
        const u = normalizeUrl(bits[0], rewriteBase);
        if (!u) return part.trim();
        const local = this.urlToLocal.get(u) || this.pageUrlToLocal.get(u);
        if (!local) return part.trim();
        bits[0] = toPublicPath(local, this.opts.outputDir, this.opts.basePath);
        return bits.join(' ');
      });
      $(el).attr('srcset', parts.join(', '));
    });

    let out = $.html();
    out = this.rewriteAbsoluteStrings(out);
    return out;
  }

  rewriteCss(content) {
    let out = content;
    for (const raw of extractCssUrls(content)) {
      const abs = normalizeUrl(raw, this.opts.scopePrefix);
      if (!abs) continue;
      const local = this.urlToLocal.get(abs);
      if (!local) continue;
      const rootRel = toPublicPath(local, this.opts.outputDir, this.opts.basePath);
      out = out.split(raw).join(rootRel);
    }
    out = this.rewriteAbsoluteStrings(out);
    return out;
  }

  rewriteAbsoluteStrings(text) {
    const origin = this.origin;
    const scope = this.opts.scopePrefix;
    const scopeOrigin = new URL(scope).origin;

    const scopePath = scopePathPrefix(scope);
    const patterns = [
      new RegExp(scope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      new RegExp(origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + scopePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      new RegExp(origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      /https:\/\/themes\.pixelwars\.org\/interique\/demo-01\//g,
    ];

    const replacement = this.opts.basePath === '/' ? '/' : this.opts.basePath;
    let out = text;
    for (const re of patterns) {
      out = out.replace(re, replacement);
    }

    for (const [url, local] of this.urlToLocal.entries()) {
      const rootRel = toPublicPath(local, this.opts.outputDir, this.opts.basePath);
      out = out.split(url).join(rootRel);
    }
    for (const [url, local] of this.pageUrlToLocal.entries()) {
      const rootRel = toPublicPath(local, this.opts.outputDir, this.opts.basePath);
      out = out.split(url).join(rootRel);
    }

    return out;
  }

  async processAssets() {
    while (this.assetQueue.length) {
      const batch = this.assetQueue.splice(0, 20);
      for (const url of batch) {
        await this.downloadAsset(url);
        await sleep(this.opts.delayMs);
      }
    }
  }

  async crawl() {
    await fs.emptyDir(this.opts.outputDir);
    this.enqueuePage(this.opts.startUrl);

    while (this.pageQueue.length) {
      const url = this.pageQueue.shift();
      try {
        await this.downloadPage(url);
      } catch (err) {
        console.error(`  failed page: ${url} — ${err.message}`);
      }
      await sleep(this.opts.delayMs);
    }

    console.log('\nDownloading assets…');
    let prevAssetCount = 0;
    while (this.assetQueue.length || this.visitedAssets.size > prevAssetCount) {
      prevAssetCount = this.visitedAssets.size;
      await this.processAssets();
      if (!this.assetQueue.length) break;
    }
  }

  async postProcess() {
    console.log('\nRewriting paths to root-relative URLs…');
    const files = await walkFiles(this.opts.outputDir);
    let rewritten = 0;
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!['.html', '.htm', '.css', '.js', '.json', '.svg'].includes(ext)) continue;
      const original = await fs.readFile(file, 'utf8');
      let content = original;
      if (ext === '.html' || ext === '.htm') {
        content = this.rewriteHtml(content, file);
      } else if (ext === '.css') {
        content = this.rewriteCss(content);
      } else {
        content = this.rewriteAbsoluteStrings(content);
      }
      if (content !== original) {
        await fs.writeFile(file, content, 'utf8');
        rewritten++;
      }
    }
    console.log(`  processed ${files.length} files, updated ${rewritten}`);
  }

  async fixImages() {
    console.log('\nFixing image visibility for static hosting…');
    const { processExport } = require('./image-post-process');
    const changed = await processExport(this.opts.outputDir, this.opts.basePath);
    console.log(`  updated ${changed} HTML file(s)`);
  }

  async run() {
    console.log('Static mirror');
    console.log(`  start:  ${this.opts.startUrl}`);
    console.log(`  output: ${this.opts.outputDir}`);
    console.log(`  scope:  ${this.opts.scopePrefix}`);
    console.log(`  entry:  ${this.opts.entrySlug || '(none)'}`);
    console.log(`  base:   ${this.opts.basePath}`);
    console.log(`  mode:   ${this.opts.singlePage ? 'single page' : 'recursive'}\n`);

    await this.crawl();
    await this.postProcess();
    await this.fixImages();

    console.log('\nDone.');
    console.log(`  pages:  ${this.pageUrlToLocal.size}`);
    console.log(`  assets: ${this.urlToLocal.size}`);
  }
}

async function walkFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walkFiles(p));
    else out.push(p);
  }
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────
(async () => {
  const opts = parseArgs(process.argv);
  const mirror = new Mirror(opts);
  try {
    await mirror.run();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
