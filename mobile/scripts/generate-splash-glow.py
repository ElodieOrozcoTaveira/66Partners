"""Génère les morceaux du halo de l'écran de démarrage.

Le halo (lumière autour des contours du logo de splashScreenNew.png) est
découpé en secteurs angulaires autour du centre du logo, en partant du haut à
gauche et dans le sens des aiguilles d'une montre. L'animation les allume l'un
après l'autre : la lumière fait le tour du logo.

Sorties : assets/images/splash-glow/sector-XX.png (recadrés au plus juste)
et src/components/splashGlowSectors.ts (positions dans l'image d'origine).

À relancer si splashScreenNew.png change :
    python3 scripts/generate-splash-glow.py   (depuis mobile/, Pillow requis)
"""
import math
import os

from PIL import Image, ImageChops, ImageFilter

SRC = "assets/images/splashScreenNew.png"
OUT_DIR = "assets/images/splash-glow"
OUT_TS = "src/components/splashGlowSectors.ts"
# Zone du logo dans l'image (px) : on ignore le reste du dégradé.
LOGO_BOX = (90, 670, 760, 1060)
SECTORS = 12
# Demi-largeur angulaire d'un secteur (fondu triangulaire) : recouvrement
# avec les voisins pour une lumière continue.
HALF_WIDTH = 2 * math.pi / SECTORS * 1.5
START_ANGLE = math.atan2(-1, -1)  # haut à gauche (y vers le bas)
GLOW_RGB = (255, 244, 200)

src = Image.open(SRC).convert("RGB")
w, h = src.size
r, g, b = src.split()
th = lambda c, f: c.point(lambda v: 255 if f(v) else 0)
white = ImageChops.multiply(ImageChops.multiply(th(r, lambda v: v > 200), th(g, lambda v: v > 200)), th(b, lambda v: v > 200))
yellow = ImageChops.multiply(ImageChops.multiply(th(r, lambda v: v > 220), th(g, lambda v: v > 180)), th(b, lambda v: v < 110))
mask = ImageChops.lighter(white, yellow)
box = Image.new("L", (w, h), 0)
box.paste(255, LOGO_BOX)
mask = ImageChops.multiply(mask, box)

# Halo : large flou + flou serré, jamais par-dessus le logo (il reste net).
wide = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(14)).point(lambda v: min(255, int(v * 2.2)))
near = mask.filter(ImageFilter.GaussianBlur(4)).point(lambda v: min(255, int(v * 1.6)))
halo = ImageChops.multiply(ImageChops.add(wide, near), ImageChops.invert(mask))

x0, y0, x1, y1 = LOGO_BOX
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
# Angles normalisés par la taille du logo (il est large) : la lumière avance
# à vitesse régulière le long du contour plutôt que par angle brut.
hw, hh = (x1 - x0) / 2, (y1 - y0) / 2

os.makedirs(OUT_DIR, exist_ok=True)
rects = []
for i in range(SECTORS):
    center = START_ANGLE + 2 * math.pi * i / SECTORS

    def weight(px, py, center=center):
        a = math.atan2((py - cy) / hh, (px - cx) / hw)
        d = abs((a - center + math.pi) % (2 * math.pi) - math.pi)
        return max(0.0, 1 - d / HALF_WIDTH)

    # Poids calculé sur une grille réduite puis agrandi (rapide, doux).
    step = 4
    small = Image.new("L", (w // step + 1, h // step + 1), 0)
    px = small.load()
    for yy in range(y0 // step - 10, y1 // step + 10):
        for xx in range(x0 // step - 10, x1 // step + 10):
            px[xx, yy] = int(255 * weight(xx * step, yy * step))
    wmap = small.resize((small.width * step, small.height * step), Image.BILINEAR).crop((0, 0, w, h))
    alpha = ImageChops.multiply(halo, wmap)
    bbox = alpha.point(lambda v: 255 if v > 3 else 0).getbbox()
    sector = Image.new("RGBA", (w, h), GLOW_RGB + (0,))
    sector.putalpha(alpha)
    sector = sector.crop(bbox)
    sector.save(f"{OUT_DIR}/sector-{i:02d}.png", optimize=True)
    rects.append((i, bbox))

lines = [
    "// Fichier généré par scripts/generate-splash-glow.py : ne pas modifier à la main.",
    "// Morceaux du halo du logo, dans l'ordre du tour (départ en haut à gauche,",
    "// sens des aiguilles d'une montre). x, y, width, height : position dans",
    f"// l'image splashScreenNew.png ({w} x {h}).",
    "",
    "export interface GlowSector {",
    "  source: number;",
    "  x: number;",
    "  y: number;",
    "  width: number;",
    "  height: number;",
    "}",
    "",
    "export const GLOW_SECTORS: GlowSector[] = [",
]
for i, (bx0, by0, bx1, by1) in rects:
    lines.append(
        f'  {{ source: require("../../assets/images/splash-glow/sector-{i:02d}.png"), '
        f"x: {bx0}, y: {by0}, width: {bx1 - bx0}, height: {by1 - by0} }},"
    )
lines.append("];")
with open(OUT_TS, "w") as f:
    f.write("\n".join(lines) + "\n")
print("ok", rects)
