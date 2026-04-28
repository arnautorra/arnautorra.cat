# Arnau Torra — Portfolio web

Aquest projecte és un portfolio de fotografia d’arquitectura amb una galeria de projectes i un lightbox per veure les fotos de cada projecte.

## Arxius principals

- `index.html` — estructura principal i lightbox
- `style.css` — estils globals i adaptació mòbil
- `projects.js` — dades dels projectes (títol, estudi, cover i fotos)
- `main.js` — funcionament de la galeria i del lightbox
- `projectes/` — carpetes amb les imatges de cada projecte

## Com funciona

- La pàgina inicial mostra una graella de projectes.
- Cada project card es genera des de `projects.js`.
- Quan fas clic a un projecte s’obre el lightbox amb el títol, subtítol i les fotos.

## Noms d’elements importants

### Galeria de projectes
- `.project-cell` — cada carta de projecte
- `.project-cell-img-wrap` — contenidor de la imatge
- `.project-title` — títol del projecte
- `.project-sub` — subtítol / estudi

### Lightbox de projecte individual
- `#lightbox` — contenidor principal del lightbox
- `#lb-header` — capçalera del lightbox
- `#lb-info` — àrea de títol i subtítol
- `#lb-info-title` — títol del projecte
- `#lb-info-sub` — subtítol del projecte
- `#lb-stage` — àrea de les imatges
- `.lb-slide` — imatge del lightbox
- `#lb-footer` — peu amb miniatures i controls en escriptori
- `#lb-footer-mobile` — peu mòbil del lightbox

### Header i navegació
- `#header-grid` — header superior fix
- `.h-left` — enllaç esquerre del header
- `.h-mid` — enllaç central del header
- `.h-right` — enllaç dret del header

## Afegir un projecte nou

1. Crea una carpeta a `projectes/` amb el nom del projecte.
2. Posa una imatge de portada `cover.jpg` i les fotos interiors `1.jpg`, `2.jpg`, etc.
3. Afegeix el projecte a `projects.js` amb les rutes corresponents.

## Notes de manteniment

- Modifica `projects.js` quan afegeixis o editis projectes.
- No canviïs `main.js` llevat que ajustis el funcionament del lightbox.
- `style.css` serveix per estil i adaptació mòbil.
