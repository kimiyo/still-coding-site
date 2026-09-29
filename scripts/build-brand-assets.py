"""Builds favicon, home-screen icons and the Open Graph card from assets/brand/still-coding-app-icon.png.

Run: python scripts/build-brand-assets.py   (needs Pillow, numpy, scipy)
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/brand/still-coding-app-icon.png"
PUBLIC = ROOT / "public"
BRAND = PUBLIC / "images/brand"
CREAM = (251, 246, 235)
INK = (26, 26, 26)
LIME = (184, 214, 26)


def load_body() -> Image.Image:
    """Crop to the rounded-square body, drop stray ink specks, fill the corners with cream (full bleed)."""
    im = Image.open(SRC).convert("RGBA")
    alpha = np.array(im.split()[3]) > 128
    labels, n = ndimage.label(alpha)
    sizes = ndimage.sum(alpha, labels, range(1, n + 1))
    body = labels == (int(np.argmax(sizes)) + 1)
    ys, xs = np.where(body)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    mask = Image.fromarray((ndimage.binary_fill_holes(body) * 255).astype("uint8")).crop(box)
    art = im.crop(box)
    flat = Image.new("RGB", art.size, CREAM)
    flat.paste(art, mask=art.split()[3])
    side = max(flat.size)
    sq = Image.new("RGB", (side, side), CREAM)
    sq.paste(flat, ((side - flat.width) // 2, (side - flat.height) // 2))
    rmask = Image.new("L", (side, side), 0)
    rmask.paste(mask, ((side - mask.width) // 2, (side - mask.height) // 2))
    return sq, rmask


def rounded(im: Image.Image, radius_ratio: float) -> Image.Image:
    size = im.width
    scale = 4
    m = Image.new("L", (size * scale, size * scale), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size * scale - 1, size * scale - 1), radius=int(size * scale * radius_ratio), fill=255)
    out = im.convert("RGBA")
    out.putalpha(m.resize((size, size), Image.LANCZOS))
    return out


def favicon_master(full: Image.Image) -> Image.Image:
    """Small sizes lose the tiny figure, so redraw it larger and enlarge the goal dot."""
    s = full.width
    im = full.copy()
    d = ImageDraw.Draw(im)
    k = s / 1120  # original body was ~1120px wide
    ox, oy = (70 - (1120 - 1120) / 2), 80  # body origin in the source image (left, top)
    def P(x, y):
        return ((x - ox) * k + (s - 1120 * k) / 2 * 0, (y - oy) * k)
    # erase the original figure (head + body) and dot
    hx, hy = P(212, 935)
    d.rectangle((P(178, 900)[0], P(178, 900)[1], P(252, 1042)[0], P(252, 1042)[1]), fill=CREAM)
    dx, dy = P(1039, 205)
    d.ellipse((dx - 60 * k, dy - 60 * k, dx + 60 * k, dy + 60 * k), fill=CREAM)
    # new dot
    r = 62 * k
    d.ellipse((dx - r, dy - r, dx + r, dy + r), fill=LIME)
    # new figure, ~2.4x larger, standing where the old one stood
    fx, fy = P(214, 1040)
    head_r, body_w, body_h = 40 * k, 62 * k, 150 * k
    d.rounded_rectangle((fx - body_w / 2, fy - body_h, fx + body_w / 2, fy), radius=body_w / 2, fill=INK)
    d.ellipse((fx - head_r, fy - body_h - head_r * 2.1, fx + head_r, fy - body_h - head_r * 0.1), fill=INK)
    return im


def maskable(full: Image.Image, size: int = 512) -> Image.Image:
    """Android crops to a circle of radius 40%; keep the art inside it."""
    art = full.resize((int(size * 0.72),) * 2, Image.LANCZOS)
    out = Image.new("RGB", (size, size), CREAM)
    out.paste(art, ((size - art.width) // 2,) * 2)
    return out


def og_card(icon: Image.Image) -> Image.Image:
    w, h = 1200, 630
    card = Image.new("RGB", (w, h), CREAM)
    isz = 440
    ic = rounded(icon.resize((isz, isz), Image.LANCZOS), 0.2237)
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((90, 110 + 10, 90 + isz, 110 + isz + 10), radius=int(isz * 0.2237), fill=(60, 50, 30, 60))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    card.paste(shadow, (0, 0), shadow)
    card.paste(ic, (90, 95), ic)
    d = ImageDraw.Draw(card)
    fonts = "C:/Windows/Fonts/"
    title = ImageFont.truetype(fonts + "georgiab.ttf", 104)
    sub = ImageFont.truetype(fonts + "georgiai.ttf", 44)
    small = ImageFont.truetype(fonts + "segoeuisl.ttf", 30)
    x = 600
    d.text((x, 205), "Still", font=title, fill=INK)
    d.text((x, 315), "Coding", font=title, fill=INK)
    d.rounded_rectangle((x + 3, 452, x + 75, 458), radius=3, fill=LIME)
    d.text((x, 478), "Ideas, made real.", font=sub, fill=(70, 66, 58))
    d.text((x, 540), "still-coding.cc", font=small, fill=(120, 114, 100))
    return card


def main() -> None:
    full, _ = load_body()
    # Home screen icons: full-bleed, the OS applies its own mask.
    full.resize((180, 180), Image.LANCZOS).save(PUBLIC / "apple-touch-icon.png", optimize=True)
    full.resize((192, 192), Image.LANCZOS).save(PUBLIC / "icon-192.png", optimize=True)
    full.resize((512, 512), Image.LANCZOS).save(PUBLIC / "icon-512.png", optimize=True)
    maskable(full).save(PUBLIC / "icon-maskable-512.png", optimize=True)
    # Browser tab icons use the simplified master with rounded corners.
    fav = rounded(favicon_master(full.resize((1024, 1024), Image.LANCZOS)), 0.2237)
    fav.resize((32, 32), Image.LANCZOS).save(PUBLIC / "favicon-32.png", optimize=True)
    fav.save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    og = og_card(full)
    og.save(BRAND / "og-still-coding.png", optimize=True)
    print("done")


if __name__ == "__main__":
    main()
