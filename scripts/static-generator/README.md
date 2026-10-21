# Static Site Generator

Node.js static site generator that mirrors [Interiqué Home 02](https://themes.pixelwars.org/interique/demo-01/home-02/) (or any site) into a portable folder for **Cloudflare Pages**, **Netlify**, or any static host.

## Stack

| Package | Role |
|---------|------|
| **axios** | HTTP downloads with automatic retry on 429/502/503 |
| **cheerio** | HTML parsing, link discovery, DOM rewriting |
| **fs-extra** | Directory creation, file writes, clean output |

## Features

### 1. Recursive crawling
Starts at the homepage and follows every internal link within `--scope`. Each HTML page is saved locally. Use `--single` to mirror only one page plus its assets.

### 2. Asset mirroring
Downloads and preserves directory structure for:
- Images (`src`, `data-src`, `data-lazy-src`, **`srcset`**)
- CSS and nested `url()` references (fonts, backgrounds)
- JavaScript bundles
- Videos, audio, posters, embeds
- Inline `style` and `<style>` blocks
- Elementor `data-settings` JSON URLs

### 3. Clean URLs
Pages use directory-based paths for SEO-friendly URLs:

| Live URL | Saved as |
|----------|----------|
| `/contact/` | `contact/index.html` |
| `/about-us/` | `about-us/index.html` |
| `/home-02/` (with `--entry home-02`) | `index.html` |

### 4. Path rewriting
After crawling, a post-processing pass replaces all absolute source URLs with **root-relative paths** (`/wp-content/...`) so the export works on any host without hard-coded domains.

Use `--root-relative` (or `--base-path /`) for Cloudflare Pages / Netlify.  
Use `--base-path /your-folder/` when hosting in a subdirectory.

### 5. Robustness
- Configurable `--delay` between requests (default **600 ms**)
- Automatic retry with exponential backoff on **429**, **502**, **503**
- Full **`srcset`** parsing — every responsive image variant is downloaded
- CSS `url()` recursion — fonts referenced in stylesheets are fetched

## Quick start

```bash
npm install

# Full recursive mirror → ./static-site/ (root-relative, ready for Netlify)
npm run static:generate
```

## Commands

```bash
# Portable static site (recursive crawl, root-relative paths)
npm run static:generate

# Individual steps
npm run mirror:full             # Full demo site crawl
npm run fix:export-images       # Fix lazy-load / visibility for static hosting
npm run fix:export-paths        # Prefix asset paths for subdirectory hosting
npm run download:export-assets  # Download any missing mirrored assets
```

## Manual usage

### Full site (Cloudflare Pages / Netlify)

```bash
node scripts/static-generator/mirror.js \
  --url https://themes.pixelwars.org/interique/demo-01/home-02/ \
  --output static-site \
  --entry home-02 \
  --scope https://themes.pixelwars.org/interique/demo-01/ \
  --delay 600 \
  --max-pages 80 \
  --root-relative
```

### Single page + assets (subdirectory)

```bash
node scripts/static-generator/mirror.js \
  --url https://themes.pixelwars.org/interique/demo-01/home-02/ \
  --output site-export \
  --entry home-02 \
  --single \
  --delay 400 \
  --base-path /site-export/
```

## CLI options

| Flag | Default | Description |
|------|---------|-------------|
| `--url` | Home 02 URL | Starting page |
| `--output` | `static-site` | Output directory |
| `--entry` | `home-02` | Slug promoted to `index.html` at output root |
| `--scope` | Demo folder | Only crawl links under this prefix |
| `--single` | off | One HTML page + assets, no link crawl |
| `--max-pages` | unlimited | Stop after N pages |
| `--delay` | `600` | Milliseconds between HTTP requests |
| `--base-path` | `/` | Prefix for rewritten asset URLs |
| `--root-relative` | — | Alias for `--base-path /` |
| `--no-entry` | — | Keep original folder structure (no promoted index) |
| `--help` | — | Show help |

## Output structure

```
static-site/
├── index.html              ← home-02 (when --entry home-02)
├── about-us/
│   └── index.html
├── contact/
│   └── index.html
├── wp-content/
│   ├── themes/
│   ├── plugins/
│   └── uploads/
├── wp-includes/
└── _external/              ← third-party assets (if any)
```

## Deploy

**Netlify / Cloudflare Pages** — set publish directory to `static-site` (or your `--output` folder).

**Subdirectory** (e.g. `example.com/landing/`):

```bash
node scripts/static-generator/mirror.js ... --base-path /landing/
```

## How it works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Crawl HTML │ ──► │ Queue assets │ ──► │ Download assets │
│  (cheerio)  │     │ links, srcset│     │ (axios + delay) │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                                         │
       ▼                                         ▼
┌─────────────┐                          ┌─────────────────┐
│ Save pages  │                          │ CSS url() scan  │
│ dir/index │                          │ (more assets)   │
└─────────────┘                          └─────────────────┘
       │                                         │
       └─────────────────┬───────────────────────┘
                         ▼
              ┌─────────────────────┐
              │ Post-process rewrite  │
              │ absolute → /relative  │
              └─────────────────────┘
```
