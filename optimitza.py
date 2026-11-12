#!/usr/bin/env python3
"""
Prepara la carpeta projectes/ perquè la web vagi ràpida.

Estructura final de cada projecte:
    projectes/2505_CriptaGuell/
        index.html     (la genera build.py)
        portada.jpg    portada lleugera (1200 px) per a la graella i WhatsApp
        fotos/         les fotos de la web: les exportes tu, l'script NO les toca
        thumbs/        miniatures per al visor (les genera aquest script)

Ús (des de la carpeta de la web):
    pip3 install pillow      (una sola vegada)
    python3 optimitza.py

- Primera vegada: si un projecte té les fotos soltes dins la carpeta, les mou a fotos/
  i actualitza les rutes de projects.js i contacte.html. Pots desfer-ho des de
  GitHub Desktop (Discard changes) si no t'agrada.
- Sempre: crea les miniatures que falten i la portada si no n'hi ha.
  Si vols regenerar una portada, esborra'n el portada.jpg i torna a executar-lo.
"""
import re
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta Pillow. Executa primer:  pip3 install pillow")

ROOT = Path(__file__).resolve().parent
PROJ = ROOT / "projectes"
EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
THUMB_H = 120        # alçada de les miniatures (es veuen a 40 px: 3x per a pantalles retina)
THUMB_MAX_W = 480    # per a panoràmiques molt llargues
PORTADA_LONG = 1200  # costat llarg de la portada
BG = (249, 249, 249)

# 'cover: ' opcional, cometa, projectes/<carpeta>/<fitxer>, cometa
PATH_RE = re.compile(r"""(cover\s*:\s*)?(['"])projectes/([^/'"]+)/([^'"]+)\2""")


def to_rgb(im):
    im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, BG)
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def make_thumb(src, dst):
    with Image.open(src) as im:
        im = to_rgb(im)
        w, h = im.size
        nh, nw = THUMB_H, max(1, round(w * THUMB_H / h))
        if nw > THUMB_MAX_W:
            nw, nh = THUMB_MAX_W, max(1, round(h * THUMB_MAX_W / w))
        im.resize((nw, nh), Image.LANCZOS).save(dst, "JPEG", quality=80, optimize=True, progressive=True)


def make_portada(src, dst):
    with Image.open(src) as im:
        im = to_rgb(im)
        im.thumbnail((PORTADA_LONG, PORTADA_LONG), Image.LANCZOS)
        im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)


def rewrite(text, todo, cover_src):
    """Canvia projectes/<carpeta>/x.jpg -> projectes/<carpeta>/fotos/x.jpg (només carpetes per migrar)."""
    def sub(m):
        cover, q, folder, name = m.groups()
        if folder not in todo:
            return m.group(0)
        if cover:
            cover_src[folder] = name
            return f"{cover}{q}projectes/{folder}/portada.jpg{q}"
        if name.startswith("fotos/"):
            return m.group(0)
        return f"{q}projectes/{folder}/fotos/{name}{q}"
    return PATH_RE.sub(sub, text)


def main():
    if not PROJ.is_dir():
        sys.exit("No trobo la carpeta projectes/. Executa l'script des de la carpeta de la web.")

    folders = sorted(d for d in PROJ.iterdir() if d.is_dir())

    # 1) Quines carpetes encara tenen les fotos soltes (sense fotos/)?
    todo = {d.name for d in folders
            if not (d / "fotos").is_dir() and any(f.suffix.lower() in EXT for f in d.iterdir() if f.is_file())}
    cover_src = {}

    if todo:
        for name in ("projects.js", "contacte.html"):
            f = ROOT / name
            if f.exists():
                old = f.read_text(encoding="utf-8")
                new = rewrite(old, todo, cover_src)
                if new != old:
                    f.write_text(new, encoding="utf-8")
                    print(f"  ✎ {name}: rutes actualitzades")
            else:
                print(f"  ! No trobo {name}: les rutes d'aquest fitxer no s'han actualitzat")
        for d in folders:
            if d.name not in todo:
                continue
            (d / "fotos").mkdir()
            for f in sorted(d.iterdir()):
                if f.is_file() and f.suffix.lower() in EXT:
                    shutil.move(str(f), str(d / "fotos" / f.name))
            print(f"  → {d.name}: fotos mogudes a fotos/")

    # 2) Miniatures i portada
    n_thumbs = n_portades = 0
    for d in folders:
        fotos = d / "fotos"
        if not fotos.is_dir():
            continue
        files = sorted(f for f in fotos.iterdir() if f.is_file() and f.suffix.lower() in EXT)
        (d / "thumbs").mkdir(exist_ok=True)
        for f in files:
            dst = d / "thumbs" / (f.stem + ".jpg")
            if not dst.exists() or dst.stat().st_mtime < f.stat().st_mtime:
                make_thumb(f, dst)
                n_thumbs += 1
        portada = d / "portada.jpg"
        if not portada.exists() and files:
            src = fotos / cover_src.get(d.name, "")
            if not src.is_file():
                src = files[0]
            make_portada(src, portada)
            n_portades += 1
            print(f"  ✓ {d.name}/portada.jpg (de {src.name})")

    print(f"\nFet: {n_thumbs} miniatures noves, {n_portades} portades noves.")
    print("Ara executa:  python3 build.py")


if __name__ == "__main__":
    main()
