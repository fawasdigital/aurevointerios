#!/usr/bin/env python3
"""Compress images and speed-tweak HTML/CSS for faster PageSpeed loads."""

from __future__ import annotations

import io
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "node_modules", ".cursor", "static-site"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_DIM = 1920
JPEG_QUALITY = 74
MIN_BYTES = 24_000
MIN_SAVINGS = 0.08

DEFER_CSS_MARKERS = (
    "click-to-chat-for-whatsapp",
    "fontello.css",
    "shortcodes.css",
    "hostinger-reach",
    "fluidbox.css",
    "magnific-popup.css",
    "owl.carousel.css",
    "swiper.min.css",
    "zoomIn.min.css",
    "fadeInLeft.min.css",
    "fadeIn.min.css",
    "fadeInUp.min.css",
    "ps-blog.css",
    "mediaelementplayer-legacy.min.css",
    "wp-mediaelement.min.css",
    "bdt-uikit.css",
    "prime-slider-site.css",
    "elementor-gf-roboto",
    "elementor-gf-robotoslab",
    "elementor-gf-bebasneue",
    "elementor-gf-leaguescript",
    "helper-parts.min.css",
    "e-swiper.min.css",
)

SUPABASE_SWAPS = {
    "https://thndtzrhrcuyxxuozcqv.supabase.co/storage/v1/object/public/farhans/Scene-6%20(1).png": "/hero/tv-wall.jpg",
    "https://thndtzrhrcuyxxuozcqv.supabase.co/storage/v1/object/public/farhans/2-5-scaled.jpg": "/hero/living-room.jpg",
    "https://thndtzrhrcuyxxuozcqv.supabase.co/storage/v1/object/public/farhans/4-1-scaled.jpg": "/hero/bedroom.jpg",
    "https://thndtzrhrcuyxxuozcqv.supabase.co/storage/v1/object/public/farhans/2-scaled.png": "/hero/kitchen.jpg",
}


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def is_opaque(img: Image.Image) -> bool:
    if img.mode in {"RGB", "L", "CMYK"}:
        return True
    if img.mode == "P":
        return "transparency" not in img.info
    if "A" not in img.getbands():
        return True
    extrema = img.getchannel("A").getextrema()
    return extrema[0] >= 250


def prepare(img: Image.Image) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    if max(img.size) > MAX_DIM:
        img = ImageOps.contain(img, (MAX_DIM, MAX_DIM), Image.Resampling.LANCZOS)
    return img


def save_jpeg(img: Image.Image) -> bytes:
    rgb = img.convert("RGB")
    buf = io.BytesIO()
    rgb.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    return buf.getvalue()


def save_png(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    if img.mode not in {"RGBA", "RGB", "P", "L"}:
        img = img.convert("RGBA")
    img.save(buf, format="PNG", optimize=True, compress_level=9)
    return buf.getvalue()


def compress_image(path: Path) -> tuple[str, int, int] | None:
    original = path.stat().st_size
    if original < MIN_BYTES:
        return None
    try:
        with Image.open(path) as src:
            img = prepare(src)
            opaque = is_opaque(img)
            suffix = path.suffix.lower()
            if suffix in {".jpg", ".jpeg"} or (suffix == ".png" and opaque):
                data = save_jpeg(img)
                dest_suffix = ".jpg" if suffix == ".png" else suffix
            elif suffix == ".webp":
                buf = io.BytesIO()
                img.convert("RGB" if opaque else "RGBA").save(
                    buf, format="WEBP", quality=JPEG_QUALITY, method=6
                )
                data = buf.getvalue()
                dest_suffix = ".webp"
            else:
                data = save_png(img)
                dest_suffix = ".png"
    except Exception as exc:  # noqa: BLE001
        print(f"skip {path}: {exc}")
        return None

    if len(data) >= original * (1 - MIN_SAVINGS) and dest_suffix == suffix:
        return None

    dest = path.with_suffix(dest_suffix)
    dest.write_bytes(data)
    if dest != path:
        path.unlink()
    return (str(path.relative_to(ROOT)), original, dest.stat().st_size)


def iter_images() -> list[Path]:
    files = []
    for folder in (ROOT / "wp-content" / "uploads", ROOT / "hero"):
        if not folder.exists():
            continue
        for path in folder.rglob("*"):
            if path.is_file() and path.suffix.lower() in IMAGE_EXTS:
                files.append(path)
    return files


def replace_in_text_files(renames: dict[str, str]) -> int:
    if not renames:
        return 0
    changed = 0
    text_exts = {".html", ".css", ".js", ".xml", ".txt", ".json"}
    for path in ROOT.rglob("*"):
        if should_skip(path) or not path.is_file() or path.suffix.lower() not in text_exts:
            continue
        text = path.read_text(encoding="utf-8", errors="surrogateescape")
        new = text
        for old, new_name in renames.items():
            new = new.replace(old, new_name)
        if new != text:
            path.write_text(new, encoding="utf-8", errors="surrogateescape")
            changed += 1
    return changed


def add_font_display(css_path: Path) -> None:
    text = css_path.read_text(encoding="utf-8")
    if "font-display" in text:
        return
    css_path.write_text(
        text.replace("font-style:", "font-display: swap;\n    font-style:"),
        encoding="utf-8",
    )


def slim_google_fonts(html: str) -> str:
    html = re.sub(
        r"family=Jost%3A[^&\"']+%7CBricolage\+Grotesque%3A[^&\"']+",
        "family=Jost:400,500,600,700|Bricolage+Grotesque:400,500,600,700&display=swap",
        html,
    )
    html = html.replace(
        "family=Jost:400,500,600,700|Bricolage+Grotesque:400,500,600,700&#038;ver=6.8.3",
        "family=Jost:400,500,600,700|Bricolage+Grotesque:400,500,600,700&display=swap",
    )
    html = re.sub(
        r"(family=Roboto(?! \+ Slab)[^\"']+)",
        "family=Roboto:400,500,700&display=swap",
        html,
        count=1,
    )
    html = re.sub(
        r"family=Roboto\+Slab:[^\"']+",
        "family=Roboto+Slab:400,700&display=swap",
        html,
    )
    html = re.sub(
        r"family=Bebas\+Neue:[^\"']+",
        "family=Bebas+Neue:400&display=swap",
        html,
    )
    html = re.sub(
        r"family=League\+Script:[^\"']+",
        "family=League+Script:400&display=swap",
        html,
    )
    return html


def defer_css(html: str) -> str:
    def repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        if "onload=" in tag:
            return tag
        href = match.group("href")
        if not any(marker in href for marker in DEFER_CSS_MARKERS):
            return tag
        tag = tag.replace(" media='all'", "").replace(' media="all"', "")
        tag = re.sub(r"\s*/?>$", "", tag)
        return f"{tag} media='print' onload=\"this.media='all'\">"

    return re.sub(
        r"<link(?=[^>]*rel=['\"]stylesheet['\"])(?=[^>]*href=['\"](?P<href>[^'\"]+)['\"])[^>]*>",
        repl,
        html,
        flags=re.I,
    )


def eager_logo(html: str) -> str:
    html = html.replace(
        'data-src="/wp-content/uploads/2025/10/Logo2-Edited.png" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==" class="lazyload"',
        'src="/wp-content/uploads/2025/10/Logo2-Edited.png" fetchpriority="high" decoding="async" class="header-logo"',
    )
    html = html.replace(
        'class="logo-negative lazyload" alt="Aurevo Interiors logo" data-src="/wp-content/uploads/2025/10/Logo2-Edited.png" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=="',
        'class="logo-negative" alt="Aurevo Interiors logo" src="/wp-content/uploads/2025/10/Logo2-Edited.png" decoding="async"',
    )
    return html


def inject_head_hints(html: str, is_home: bool) -> str:
    if "rel=\"preconnect\" href=\"https://fonts.gstatic.com\"" in html:
        return html
    hints = [
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    ]
    if is_home:
        hints.append(
            '<link rel="preload" as="image" href="/hero/living-room.jpg" fetchpriority="high">'
        )
        hints.append(
            '<link rel="preload" as="image" href="/wp-content/uploads/2025/10/Group-23-1024x512.jpg" fetchpriority="high">'
        )
    block = "\n".join(hints) + "\n"
    if "<link rel='dns-prefetch' href='//fonts.googleapis.com' />" in html:
        return html.replace(
            "<link rel='dns-prefetch' href='//fonts.googleapis.com' />",
            "<link rel='dns-prefetch' href='//fonts.googleapis.com' />\n" + block,
            1,
        )
    return html.replace("</title>", "</title>\n" + block, 1)


def trim_lcp_srcset(html: str) -> str:
    html = re.sub(
        r'(src="/wp-content/uploads/2025/10/Group-23-1024x512\.(?:png|jpg)\?v=5"[^>]*srcset=")([^"]+)(")',
        lambda m: m.group(1)
        + ", ".join(
            part
            for part in m.group(2).split(", ")
            if not any(x in part for x in ("1920x960", "1536x768", "2048x1024", "1300x650", "1100x550"))
        )
        + m.group(3),
        html,
        count=1,
    )
    return html


def lazy_bottom_images(html: str) -> str:
    html = html.replace(
        'class="attachment-full size-full wp-post-image" alt="Best Flooring Options for Modern Homes and Offices" decoding="async"',
        'class="attachment-full size-full wp-post-image" alt="Best Flooring Options for Modern Homes and Offices" decoding="async" loading="lazy"',
    )
    html = html.replace(
        'class="attachment-full size-full wp-post-image" alt="Office Interior Design Tips to Boost Productivity" decoding="async"',
        'class="attachment-full size-full wp-post-image" alt="Office Interior Design Tips to Boost Productivity" decoding="async" loading="lazy"',
    )
    html = html.replace(
        'class="attachment-full size-full wp-post-image" alt="How to Choose the Perfect Color Palette for Home Interiors" decoding="async"',
        'class="attachment-full size-full wp-post-image" alt="How to Choose the Perfect Color Palette for Home Interiors" decoding="async" loading="lazy"',
    )
    return html


def patch_html(path: Path) -> None:
    html = path.read_text(encoding="utf-8", errors="surrogateescape")
    original = html
    is_home = path.resolve() == (ROOT / "index.html").resolve()
    for old, new in SUPABASE_SWAPS.items():
        html = html.replace(old, new)
    html = slim_google_fonts(html)
    html = defer_css(html)
    html = eager_logo(html)
    html = inject_head_hints(html, is_home)
    html = lazy_bottom_images(html)
    if is_home:
        html = trim_lcp_srcset(html)
        html = html.replace(
            'src="/wp-content/uploads/2025/10/Group-23-1024x512.png?v=5"',
            'src="/wp-content/uploads/2025/10/Group-23-1024x512.jpg?v=5"',
        )
        html = html.replace(
            'src="/wp-content/uploads/2025/10/Group-23-1024x512.jpg?v=5"',
            'src="/wp-content/uploads/2025/10/Group-23-1024x512.jpg?v=5" loading="eager"',
        )
    if html != original:
        path.write_text(html, encoding="utf-8", errors="surrogateescape")


def main() -> None:
    images = iter_images()
    print(f"compressing {len(images)} images...")
    saved = 0
    before = 0
    after = 0
    renames: dict[str, str] = {}
    for path in images:
        result = compress_image(path)
        if not result:
            continue
        rel, old, new = result
        saved += 1
        before += old
        after += new
        old_name = Path(rel).name
        new_name = Path(rel).with_suffix(Path(rel).suffix if old_name == Path(rel).name else "").name
        # If PNG became JPG, record the basename swap.
        if Path(rel).suffix.lower() == ".png" and path.with_suffix(".jpg").exists() and not path.exists():
            renames[old_name] = path.with_suffix(".jpg").name
        print(f"  {old/1024:.0f}KB -> {new/1024:.0f}KB  {rel}")
    print(f"compressed {saved} files, {before/1e6:.1f}MB -> {after/1e6:.1f}MB")

    # Rebuild rename map from remaining jpg siblings of deleted pngs
    extra = {}
    for old_name, new_name in list(renames.items()):
        extra[old_name] = new_name
    if extra:
        n = replace_in_text_files(extra)
        print(f"updated {n} text files for png->jpg names")

    for css in (
        ROOT / "wp-content/themes/interique/css/fonts/now/stylesheet.css",
        ROOT / "wp-content/themes/interique/css/fonts/texgyreadventor/stylesheet.css",
    ):
        add_font_display(css)

    html_files = [
        p
        for p in ROOT.rglob("index.html")
        if not should_skip(p)
    ]
    for html in html_files:
        patch_html(html)
    print(f"patched {len(html_files)} html pages")


if __name__ == "__main__":
    main()
