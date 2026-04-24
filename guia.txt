# Portfolio Arnau Torra — Guia de manteniment

---

## Estructura de fitxers

```
arnautorra/
├── index.html      → estructura de la pàgina (no tocar)
├── style.css       → colors, tipografia, mides (no tocar habitualment)
├── projects.js     → llista de projectes (editar aquí sempre)
├── main.js         → codi de funcionament (no tocar)
└── projectes/
    ├── casa-collserola/
    │   ├── cover.jpg
    │   ├── 1.jpg
    │   ├── 2.jpg
    │   └── 3.jpg
    └── nom-projecte/
        └── ...
```

---

## Afegir un projecte nou

**1. Crea la carpeta del projecte**
Dins de `projectes/` crea una carpeta amb el nom del projecte en minúscules, sense accents ni espais:
- ✅ `habitatge-gracia`
- ❌ `Habitatge Gràcia`

**2. Posa les fotos dins**
- `cover.jpg` → la imatge que apareix al grid
- `1.jpg`, `2.jpg`, `3.jpg`... → les fotos de la vista interior

**3. Edita `projects.js`**
Afegeix un bloc al final de la llista (abans del `];`):

```javascript
{
  title: 'Nom del Projecte',
  studio: 'Nom del Despatx',
  cover: 'projectes/nom-projecte/cover.jpg',
  photos: [
    'projectes/nom-projecte/1.jpg',
    'projectes/nom-projecte/2.jpg',
    'projectes/nom-projecte/3.jpg',
  ]
},
```

**4. Puja els canvis a Netlify**
Arrossega la carpeta sencera `arnautorra/` a netlify.com. Substituirà l'anterior automàticament.

---

## Eliminar un projecte

Esborra el bloc corresponent de `projects.js` i, si vols, la carpeta de fotos.

---

## Canviar títol o despatx d'un projecte

Edita els camps `title` i `studio` del bloc corresponent a `projects.js`.

---

## Canviar el correu de contacte

Obre `index.html` i busca `info.arnautorra@gmail.com`. Apareix dues vegades (una al header principal i una al header del lightbox). Canvia les dues.

---

## Recomanacions per les fotos

- Format: JPG
- Cover (grid): 1200px d'ample, qualitat 80%
- Fotos interiors: 2000px d'ample, qualitat 85–90%
- Noms sense accents ni espais: `1.jpg`, `2.jpg`...

---

## Fitxers que NO has de tocar mai

- `index.html` — excepte si canvies el correu
- `main.js` — codi de funcionament
- `style.css` — excepte si vols canviar el disseny
