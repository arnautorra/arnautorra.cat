#!/usr/bin/env python3
"""
Genera una pàgina real dins de cada projecte (projectes/2505_CriptaGuell/index.html, etc.),
amb el seu títol, descripció i imatge de previsualització (Open Graph),
més sitemap.xml i robots.txt.

Ús (des de la carpeta de la web):
    python3 build.py

Cada vegada que afegeixis o canviïs un projecte a projects.js, torna a executar-lo.
"""
import html
import re
import sys
from pathlib import Path
from urllib.parse import quote

DOMAIN = "https://arnautorra.cat"
SITE_NAME = "Arnau Torra"
HOME_TITLE = "Arnau Torra — Fotografia d'arquitectura, Barcelona"
HOME_DESC = "Arnau Torra, arquitecte i fotògraf. Fotografia d'arquitectura a Barcelona."
HOME_IMAGE = "projectes/2505_CriptaGuell/portada.jpg"  # imatge de la portada

ROOT = Path(__file__).resolve().parent


def read_projects():
    """Llegeix projects.js i en treu slug, title, studio i cover de cada projecte."""
    src = (ROOT / "projects.js").read_text(encoding="utf-8")
    # cadena entre cometes simples o dobles
    s = r"""(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")"""

    def val(block, key):
        m = re.search(key + r"\s*:\s*" + s, block)
        if not m:
            return ""
        raw = m.group(1) if m.group(1) is not None else m.group(2)
        return raw.replace("\\'", "'").replace('\\"', '"')

    projects = []
    for block in re.split(r"\n\s*\{\s*\n", src)[1:]:
        cover = val(block, "cover")
        if not cover:
            continue
        projects.append({
            "slug": val(block, "slug"),                 # només per detectar carpetes antigues
            "folder": cover.rsplit("/", 1)[0],          # p. ex. projectes/2505_CriptaGuell
            "title": val(block, "title"),
            "studio": val(block, "studio"),
            "cover": cover,
        })
    return projects


def de(name):
    """'de Marc' / "d'Antoni": preposició catalana segons la inicial."""
    return ("d'" if name[:1].lower() in "aeiouàèéíòóúh" else "de ") + name


def abs_url(path):
    return f"{DOMAIN}/{quote(path, safe='/')}"


def head_block(title, desc, url, image):
    e = html.escape
    return "\n".join([
        '<base href="/">',
        f"<title>{e(title)}</title>",
        f'<meta name="description" content="{e(desc, quote=True)}">',
        f'<link rel="canonical" href="{url}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{SITE_NAME}">',
        f'<meta property="og:title" content="{e(title, quote=True)}">',
        f'<meta property="og:description" content="{e(desc, quote=True)}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{image}">',
        '<meta name="twitter:card" content="summary_large_image">',
    ])


# Etiquetes que substituïm (les que ja hi hagi a index.html, per no duplicar-les)
STRIP = [
    r"<base\b[^>]*>",
    r"<title>.*?</title>",
    r'<meta\s+name="description"[^>]*>',
    r'<link\s+rel="canonical"[^>]*>',
    r'<meta\s+property="og:[^"]*"[^>]*>',
    r'<meta\s+name="twitter:[^"]*"[^>]*>',
]


def make_page(template, block):
    page = template
    for pat in STRIP:
        page = re.sub(pat + r"[ \t]*\n?", "", page, flags=re.S | re.I)
    # inserim el bloc just després de <meta charset>
    page, n = re.subn(r"(<meta\s+charset=[^>]*>)", r"\1\n" + block.replace("\\", r"\\"), page, count=1, flags=re.I)
    if n == 0:
        sys.exit("No he trobat <meta charset> a index.html")
    return page


def main():
    projects = read_projects()
    if not projects:
        sys.exit("No he trobat cap projecte a projects.js")

    template = (ROOT / "index.html").read_text(encoding="utf-8")

    for p in projects:
        title = f"{p['title']} — {p['studio']} | {SITE_NAME}" if p["studio"] else f"{p['title']} | {SITE_NAME}"
        desc = f"{p['title']}" + (f", {de(p['studio'])}" if p["studio"] else "") + ". Fotografia d'arquitectura per Arnau Torra."
        url = f"{DOMAIN}/{quote(p['folder'], safe='/')}/"
        block = head_block(title, desc, url, abs_url(p["cover"]))
        out = ROOT / p["folder"]
        out.mkdir(parents=True, exist_ok=True)
        (out / "index.html").write_text(make_page(template, block), encoding="utf-8")
        print(f"  ✓ {p['folder']}/index.html")

    # sitemap.xml
    urls = [f"{DOMAIN}/", f"{DOMAIN}/contacte.html"] + [f"{DOMAIN}/{quote(p['folder'], safe='/')}/" for p in projects]
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sitemap += [f"  <url><loc>{u}</loc></url>" for u in urls]
    sitemap.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")

    # robots.txt
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")

    print(f"\nFet: {len(projects)} pàgines de projecte + sitemap.xml + robots.txt")

    antigues = [p["slug"] for p in projects if p["slug"] and (ROOT / p["slug"] / "index.html").exists()]
    if antigues:
        print("\nAquestes carpetes de l'arrel són d'una versió anterior i ja no serveixen; les pots esborrar:")
        for a in antigues:
            print(f"  {a}/")


if __name__ == "__main__":
    main()
