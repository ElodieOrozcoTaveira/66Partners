"""Copie le logo et l'emblème d'un territoire du site vers l'app mobile.

Source : frontend/public/<code>partners/logo.webp et emblem.webp (les mêmes
images que le site). Sortie, allégée pour le téléphone :
  assets/images/territories/logo<code>.webp   (600 px de large)
  assets/images/territories/emblem<code>.webp (1200 x 800)

Ensuite, déclarer le territoire dans src/constants/brands.ts (couleurs,
logo, emblème, cadrage de carte).

Usage (depuis mobile/, Pillow requis) :
    python3 scripts/import-territory-assets.py 31
"""
import os
import sys

from PIL import Image

if len(sys.argv) != 2:
    sys.exit("Usage : python3 scripts/import-territory-assets.py <code>")

code = sys.argv[1]
src_dir = f"../frontend/public/{code}partners"
out_dir = "assets/images/territories"

for name in ("logo.webp", "emblem.webp"):
    if not os.path.exists(f"{src_dir}/{name}"):
        sys.exit(f"Image manquante : {src_dir}/{name}")

logo = Image.open(f"{src_dir}/logo.webp").convert("RGBA")
logo = logo.resize((600, round(logo.height * 600 / logo.width)), Image.LANCZOS)
logo.save(f"{out_dir}/logo{code}.webp", "WEBP", quality=90, method=6)

emblem = Image.open(f"{src_dir}/emblem.webp").convert("RGB")
# Même cadrage que les autres emblèmes (3:2), recadré au centre si besoin.
target = 1200 / 800
if emblem.width / emblem.height > target:
    w = round(emblem.height * target)
    emblem = emblem.crop(((emblem.width - w) // 2, 0, (emblem.width + w) // 2, emblem.height))
else:
    h = round(emblem.width / target)
    emblem = emblem.crop((0, (emblem.height - h) // 2, emblem.width, (emblem.height + h) // 2))
emblem = emblem.resize((1200, 800), Image.LANCZOS)
emblem.save(f"{out_dir}/emblem{code}.webp", "WEBP", quality=80, method=6)

for name in (f"logo{code}.webp", f"emblem{code}.webp"):
    print(f"{out_dir}/{name} : {os.path.getsize(f'{out_dir}/{name}') // 1024} Ko")
