"""Cover / thumbnail: a strong frame + big sticker title + subscribe pill -> <name>-cover.jpg (1080x1920, < 2 MB).

  <faceless-shorts>/scripts/py make_cover.py <frame.jpg> "<TITLE WITH *HIGHLIGHT WORD>" <out-cover.jpg> [--handle @easswad] [--font Inter-Black.otf]

Grab the frame with: node tools/capture.mjs frames review/cover "12.5"   (pick the most readable moment)
Words starting with * get the yellow marker box (same look as the captions).
"""
import argparse
from PIL import Image, ImageDraw, ImageFont, ImageOps

ap = argparse.ArgumentParser(); ap.add_argument('frame'); ap.add_argument('title'); ap.add_argument('out')
ap.add_argument('--handle', default='@easswad'); ap.add_argument('--font', default='/usr/share/fonts/opentype/inter/Inter-Black.otf')
a = ap.parse_args()
W, H, INK, YEL = 1080, 1920, (26, 26, 30), (255, 212, 59)
img = ImageOps.fit(Image.open(a.frame).convert('RGB'), (W, H)); d = ImageDraw.Draw(img)
words = a.title.split(); size = 120
while True:                                           # wrap to <= 3 lines at the largest size that fits
    f = ImageFont.truetype(a.font, size); lines, cur = [], []
    for w in words:
        test = cur + [w]
        if d.textlength(' '.join(x.lstrip('*') for x in test), font=f) + 80 > W - 120 and cur: lines.append(cur); cur = [w]
        else: cur = test
    lines.append(cur)
    if len(lines) <= 3 or size < 70: break
    size -= 8
y = 230
for ln in lines:
    tw = d.textlength(' '.join(x.lstrip('*') for x in ln), font=f) + 40 * sum(x.startswith('*') for x in ln); x = (W - tw) / 2
    for w in ln:
        t = w.lstrip('*'); wl = d.textlength(t, font=f)
        if w.startswith('*'):
            d.rectangle([x + 9, y - 6 + 11, x + wl + 40 + 9, y + size * 1.12 + 11], fill=INK)
            d.rectangle([x, y - 6, x + wl + 40, y + size * 1.12], fill=YEL, outline=INK, width=8)
            d.text((x + 20, y), t, font=f, fill=INK); x += wl + 40 + d.textlength(' ', font=f)
        else:
            d.text((x, y), t, font=f, fill='white', stroke_width=12, stroke_fill=INK); x += wl + d.textlength(' ', font=f)
    y += int(size * 1.3)
bf = ImageFont.truetype(a.font, 56); label = f'▶ SUBSCRIBE {a.handle}'
try: bw = d.textlength(label, font=bf)
except Exception: label = f'SUBSCRIBE {a.handle}'; bw = d.textlength(label, font=bf)
bx, by = (W - bw) / 2 - 40, H - 330
d.rounded_rectangle([bx, by, bx + bw + 80, by + 110], 55, fill=(230, 33, 23), outline=INK, width=6)
d.text((bx + 40, by + 22), label, font=bf, fill='white')
q = 92
while True:
    img.save(a.out, 'JPEG', quality=q, optimize=True)
    import os
    if os.path.getsize(a.out) < 2_000_000 or q < 60: break
    q -= 6
print(a.out)
