#!/usr/bin/env python3
"""1080x1920 cover/thumbnail in the house sticker style (YouTube limit: JPEG < 2 MB).

usage: make_cover.py frame.png cover.jpg --font Poppins-Black.ttf \
         --top "A 25-FOOT" --key "MOLASSES" --big "WAVE" --badge "BOSTON 1919" [--sub "@easswad"]
- frame.png: a 1080x1920 still of the most dramatic moment, rendered WITHOUT captions (inputProps {"text": false}).
- Poppins Black: https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Black.ttf (OFL).
- Text: top line white/outlined, key line in the yellow slanted box, big line white, badge yellow near the bottom,
  optional red "SUBSCRIBE @handle" pill under the badge.
"""
import argparse, os
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument("frame"); ap.add_argument("out"); ap.add_argument("--font", required=True)
for k in ("top", "key", "big", "badge", "sub"): ap.add_argument("--" + k, default="")
a = ap.parse_args()
im = Image.open(a.frame).convert("RGB").resize((1080, 1920)); W, H = im.size
mask = Image.new("L", (1, H))
for y in range(H): mask.putpixel((0, y), int(170 * max(0, 1 - y / (H * 0.45))))  # darken the top for legibility
im = Image.composite(Image.new("RGB", (W, H), "black"), im, mask.resize((W, H)))
d = ImageDraw.Draw(im)
font = lambda s: ImageFont.truetype(a.font, s)
def fit(t, size, maxw=980):
    while size > 40 and d.textlength(t, font=font(size)) > maxw: size -= 4
    return size
def plain(y, t, size):
    size = fit(t, size); f = font(size); x = (W - d.textlength(t, font=f)) / 2
    d.text((x + 8, y + 10), t, font=f, fill="black", stroke_width=12, stroke_fill="black")
    d.text((x, y), t, font=f, fill="white", stroke_width=12, stroke_fill="black")
def box(y, t, size, fill="#FFD43B", ink="#0d0d0d", rot=-3):
    size = fit(t, size, 900); f = font(size); bb = d.textbbox((0, 0), t, font=f)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]; pad = int(size * 0.23); bw, bh = tw + 2 * pad, th + 2 * pad
    b = Image.new("RGBA", (bw + 40, bh + 40), (0, 0, 0, 0)); g = ImageDraw.Draw(b)
    g.rounded_rectangle((14, 16, 14 + bw, 16 + bh), 18, fill="black")
    g.rounded_rectangle((0, 0, bw, bh), 18, fill=fill, outline="black", width=9)
    g.text((pad - bb[0], pad - bb[1]), t, font=f, fill=ink)
    b = b.rotate(-rot, expand=True, resample=Image.BICUBIC); im.paste(b, ((W - b.width) // 2, y), b)
if a.top: plain(150, a.top, 150)
if a.key: box(330, a.key, 150)
if a.big: plain(560, a.big, 190)
if a.badge: box(1560, a.badge, 96, rot=2)
if a.sub: box(1720, "▶ SUBSCRIBE " + a.sub.upper(), 56, fill="#E62117", ink="white", rot=0)
q = 92
while True:
    im.save(a.out, quality=q)
    if os.path.getsize(a.out) < 1_900_000 or q < 60: break
    q -= 6
print(a.out, os.path.getsize(a.out), "bytes")
