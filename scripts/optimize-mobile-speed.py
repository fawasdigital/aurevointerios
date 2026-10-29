#!/usr/bin/env python3
"""Mobile PageSpeed: unhide LCP, defer blocking CSS/JS, serve smaller WebP heroes."""

from __future__ import annotations

import io
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "node_modules", ".cursor", "static-site"}
HERO_DIR = ROOT / "hero"

DEFER_CSS_MARKERS = (
    "qi-addons-for-elementor/assets/css/grid.min.css",
    "qi-addons-for-elementor/assets/css/main.min.css",
    "texgyreadventor/stylesheet.css",
    "fonts/now/stylesheet.css",
    "fonts.googleapis.com",
    "widget-image.min.css",
    "widget-heading.min.css",
    "widget-spacer.min.css",
    "widget-text-editor.min.css",
    "widget-social-icons.min.css",
)

MEDIA_CSS = {
    "768.css": "(min-width: 768px)",
    "992.css": "(min-width: 992px)",
}

CRITICAL_CSS = """<style id="mobile-lcp-css">
@media (max-width: 1024px) {
  .elementor-invisible { visibility: visible !important; }
  .elementor-element.animated,
  .elementor-element.animated-fast {
    animation: none !important;
    animation-delay: 0s !important;
  }
  .qodef-qi-animated-text.qodef--appear-from-right .qodef-e-character,
  .qodef-qi-animated-text.qodef--appear-from-right .qodef-e-word,
  .qodef-qi-animated-text.qodef--appear-from-right .qodef-e-word-holder,
  .qodef-qi-animated-text.qodef--appear-fade .qodef-e-character,
  .qodef-qi-animated-text.qodef--appear-fade .qodef-e-word {
    opacity: 1 !important;
    transform: none !important;
  }
  .elementor-ken-burns,
  .elementor-ken-burns--in,
  .elementor-ken-burns--out {
    animation: none !important;
    transform: none !important;
  }
}
html, body { background: #fffefc; }
</style>
"""

EMOJI_RE = re.compile(
    r"[ \t]*<script type=\"text/javascript\">\s*"
    r"/\* <!\[CDATA\[ \*/\s*"
    r"window\._wpemojiSettings[\s\S]*?"
    r"</script>\s*",
    re.I,
)

STYLESHEET_RE = re.compile(
    r"<link(?=[^>]*rel=['\"]stylesheet['\"])(?=[^>]*href=['\"](?P<href>[^'\"]+)['\"])[^>]*>",
    re.I,
)


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def save_webp(src: Path, dest: Path, max_w: int, quality: int = 70) -> None:
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        if im.size[0] > max_w:
            im = ImageOps.contain(im, (max_w, 10_000), Image.Resampling.LANCZOS)
        rgb = im.convert("RGB")
        buf = io.BytesIO()
        rgb.save(buf, format="WEBP", quality=quality, method=6)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(buf.getvalue())
        print(f"  {dest.relative_to(ROOT)} {dest.stat().st_size/1024:.0f}KB {im.size}")


def make_images() -> None:
    print("creating mobile WebP assets...")
    group = ROOT / "wp-content/uploads/2025/10"
    mapping = {
        "Group-23-550x275.jpg": ("lcp-550.webp", 550),
        "Group-23-768x384.jpg": ("lcp-768.webp", 768),
        "Group-23-1024x512.jpg": ("lcp-1024.webp", 1024),
    }
    for src_name, (dest_name, width) in mapping.items():
        src = group / src_name
        if src.exists():
            save_webp(src, HERO_DIR / dest_name, width, quality=68)
    for name in ("living-room.jpg", "bedroom.jpg", "kitchen.jpg", "tv-wall.jpg"):
        src = HERO_DIR / name
        if src.exists():
            save_webp(src, HERO_DIR / name.replace(".jpg", "-800.webp"), 800, quality=70)


def defer_css_tag(tag: str, href: str) -> str:
    for filename, query in MEDIA_CSS.items():
        if filename in href:
            tag = re.sub(r"\s+media=['\"][^'\"]*['\"]", "", tag)
            tag = tag.replace(" media='all'", "").replace(' media="all"', "")
            if "media=" not in tag:
                tag = re.sub(r"\s*/?>$", "", tag)
                tag = f"{tag} media='{query}'>"
            return tag

    if "onload=" in tag:
        return tag
    if not any(marker in href for marker in DEFER_CSS_MARKERS):
        return tag
    tag = tag.replace(" media='all'", "").replace(' media="all"', "")
    tag = re.sub(r"\s+media=['\"]all['\"]", "", tag)
    tag = re.sub(r"\s*/?>$", "", tag)
    return f"{tag} media='print' onload=\"this.media='all';this.onload=null\">"


def defer_css(html: str) -> str:
    def repl(match: re.Match[str]) -> str:
        return defer_css_tag(match.group(0), match.group("href"))

    return STYLESHEET_RE.sub(repl, html)


def strip_emoji(html: str) -> str:
    return EMOJI_RE.sub("", html, count=2)


def defer_head_scripts(html: str) -> str:
    replacements = (
        (
            'src="/wp-includes/js/jquery/jquery-migrate.min.js?ver=3.4.1" id="jquery-migrate-js">',
            'src="/wp-includes/js/jquery/jquery-migrate.min.js?ver=3.4.1" id="jquery-migrate-js" defer>',
        ),
        (
            'src="/wp-content/plugins/bdthemes-prime-slider-lite/assets/js/bdt-uikit.min.js?ver=3.21.7" id="bdt-uikit-js">',
            'src="/wp-content/plugins/bdthemes-prime-slider-lite/assets/js/bdt-uikit.min.js?ver=3.21.7" id="bdt-uikit-js" defer>',
        ),
    )
    for old, new in replacements:
        if "defer" in old:
            continue
        html = html.replace(old, new)
    return html


def inject_critical_css(html: str) -> str:
    if 'id="mobile-lcp-css"' in html:
        return html
    needle = '<meta name="viewport" content="width=device-width, initial-scale=1">'
    if needle in html:
        return html.replace(needle, needle + "\n" + CRITICAL_CSS, 1)
    return html.replace("</title>", "</title>\n" + CRITICAL_CSS, 1)


def patch_home_lcp(html: str) -> str:
    html = html.replace(
        '<link rel="preload" as="image" href="/hero/living-room.jpg" fetchpriority="high">\n',
        "",
    )
    html = html.replace(
        '<link rel="preload" as="image" href="/wp-content/uploads/2025/10/Group-23-1024x512.jpg" fetchpriority="high">',
        '<link rel="preload" as="image" type="image/webp" href="/hero/lcp-1024.webp" imagesrcset="/hero/lcp-550.webp 550w, /hero/lcp-768.webp 768w, /hero/lcp-1024.webp 1024w" imagesizes="(max-width: 710px) 100vw, 710px" fetchpriority="high">',
    )
    html = html.replace(
        'src="/wp-content/uploads/2025/10/Group-23-1024x512.jpg?v=5" loading="eager" class="attachment-large size-large wp-image-19079" alt="Luxury home office interior design by Aurevo Interiors in Kerala" srcset="/wp-content/uploads/2025/10/Group-23-1024x512.jpg?v=5 1024w, /wp-content/uploads/2025/10/Group-23-300x150.jpg?v=5 300w, /wp-content/uploads/2025/10/Group-23-768x384.jpg?v=5 768w, /wp-content/uploads/2025/10/Group-23-1060x530.jpg?v=5 1060w, /wp-content/uploads/2025/10/Group-23-550x275.jpg?v=5 550w, /wp-content/uploads/2025/10/Group-23-1000x500.jpg?v=5 1000w" sizes="(max-width: 710px) 100vw, 710px"',
        'src="/hero/lcp-768.webp" loading="eager" class="attachment-large size-large wp-image-19079" alt="Luxury home office interior design by Aurevo Interiors in Kerala" srcset="/hero/lcp-550.webp 550w, /hero/lcp-768.webp 768w, /hero/lcp-1024.webp 1024w" sizes="(max-width: 710px) 100vw, 710px"',
    )
    html = html.replace(
        '"background_slideshow_ken_burns":"yes"',
        '"background_slideshow_ken_burns":"no"',
    )
    html = html.replace(
        "&quot;background_slideshow_ken_burns&quot;:&quot;yes&quot;",
        "&quot;background_slideshow_ken_burns&quot;:&quot;no&quot;",
    )
    html = html.replace(
        "style=\"background-image:url('/hero/living-room.jpg');background-size:cover;background-position:center center;\"",
        "style=\"background-image:url('/hero/living-room-800.webp');background-size:cover;background-position:center center;\"",
    )
    html = html.replace(
        'src="/wp-content/uploads/2025/10/Logo2-Edited.png" decoding="async" class="header-logo"',
        'src="/wp-content/uploads/2025/10/Logo2-Edited.png" decoding="async" width="140" height="122" class="header-logo"',
    )
    return html


def https_fonts(html: str) -> str:
    return html.replace("href='//fonts.googleapis.com", "href='https://fonts.googleapis.com")


def patch_html(path: Path) -> bool:
    html = path.read_text(encoding="utf-8", errors="surrogateescape")
    original = html
    is_home = path.resolve() == (ROOT / "index.html").resolve()
    html = strip_emoji(html)
    html = defer_css(html)
    html = defer_head_scripts(html)
    html = inject_critical_css(html)
    html = https_fonts(html)
    if is_home:
        html = patch_home_lcp(html)
    if html != original:
        path.write_text(html, encoding="utf-8", errors="surrogateescape")
        return True
    return False


def main() -> None:
    make_images()
    html_files = [p for p in ROOT.rglob("index.html") if not should_skip(p)]
    changed = 0
    for path in html_files:
        if patch_html(path):
            changed += 1
            print(f"patched {path.relative_to(ROOT)}")
    print(f"patched {changed}/{len(html_files)} html pages")


if __name__ == "__main__":
    main()
