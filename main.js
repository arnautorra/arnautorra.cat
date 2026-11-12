// Les rutes de projects.js són relatives: les fem absolutes perquè no es trenquin quan la URL és /projecte/
const abs = s => /^(\/|https?:)/.test(s) ? s : "/" + s;
PROJECTS.forEach(p => {
  p.cover  = abs(p.cover);
  p.photos = p.photos.map(abs);
  p.path   = p.cover.replace(/[^/]*$/, '');   // /projectes/2505_CriptaGuell/
  // miniatures: .../fotos/01.jpg -> .../thumbs/01.jpg
  p.thumbs = p.photos.map(s => s.replace('/fotos/', '/thumbs/').replace(/\.[^./]+$/, '.jpg'));
});

// ── Grid ──
// Les targetes són enllaços reals (<a href>): es poden fer servir amb teclat,
// i Google pot seguir-los fins a la pàgina de cada projecte.
const gridEl = document.getElementById('grid');
PROJECTS.forEach((p, i) => {
  const c = document.createElement('a');
  c.className = 'project-cell';
  c.href = p.path;
  c.style.animationDelay = `${i * 0.06}s`;
  c.innerHTML = `
    <div class="project-cell-img-wrap">
      <img src="${p.cover}" alt="${p.title}" loading="lazy">
      <div class="project-overlay"></div>
      <div class="project-info">
        <span class="project-title">${p.title}</span>
        <span class="project-sub">${p.studio}</span>
      </div>
    </div>`;
  c.addEventListener('click', e => {
    // Ctrl/Cmd/Maj + clic o clic del mig: deixem que el navegador obri l'enllaç
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    openLightbox(i, 0);
  });
  gridEl.appendChild(c);
});

// ── Lightbox refs ──
const lb        = document.getElementById('lightbox');
const lbHome    = document.getElementById('lb-home');
const lbClose   = document.getElementById('lb-close');
const lbLeft    = document.getElementById('lb-left-zone');
const lbRight   = document.getElementById('lb-right-zone');
const lbCounter = document.getElementById('lb-counter');
const lbTitle   = document.getElementById('lb-info-title');
const lbSub     = document.getElementById('lb-info-sub');
const lbSep     = document.getElementById('lb-info-sep');
const lbStage   = document.getElementById('lb-stage');
const lbCursor  = document.getElementById('lb-cursor');
const lbArrow   = document.getElementById('lb-arrow');
const lbThumbs  = document.getElementById('lb-thumbs');
const cursor    = document.getElementById('cursor');
const imgs      = [document.getElementById('lb-img-a'), document.getElementById('lb-img-b')];

// Etiquetes per a lectors de pantalla (els botons només tenen un símbol)
document.getElementById('lb-back').setAttribute('aria-label', 'Tornar als projectes');
lbClose.setAttribute('aria-label', 'Tancar');
document.getElementById('lb-close-mobile').setAttribute('aria-label', 'Tancar');
document.getElementById('lb-scroll-top').setAttribute('aria-label', 'Tornar a dalt');

let activeSlot = 0, curProj = 0, curPhoto = 0, busy = false;
let overStage = false;
const DURATION = 480;

const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

// ── Meta ──
function setMeta() {
  const p = PROJECTS[curProj];
  lbTitle.textContent   = p.title.toUpperCase();
  lbSub.textContent     = p.studio ? p.studio.toUpperCase() : '';
  lbSep.style.display   = p.studio ? '' : 'none';   // sense estudi, no mostrem el guió
  lbCounter.textContent = `${curPhoto + 1} / ${p.photos.length}`;
  imgs[activeSlot].alt  = `${p.title} — foto ${curPhoto + 1}`;
  updateThumbs();
}

// ── Thumbnails ──
function renderThumbs() {
  lbThumbs.innerHTML = '';
  PROJECTS[curProj].photos.forEach((src, i) => {
    const img = document.createElement('img');
    img.className = 'lb-thumb' + (i === curPhoto ? ' active' : '');
    img.src = PROJECTS[curProj].thumbs[i];
    img.alt = `${PROJECTS[curProj].title} — miniatura ${i + 1}`;
    img.addEventListener('click', () => {
      if (i === curPhoto) return;
      navigateWithZoomReset(i > curPhoto ? 1 : -1, i);
    });
    lbThumbs.appendChild(img);
  });
}

function updateThumbs() {
  lbThumbs.querySelectorAll('.lb-thumb').forEach((el, i) => {
    el.classList.toggle('active', i === curPhoto);
  });
  const active = lbThumbs.querySelector('.active');
  if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
}

// ── Preload ──
function preload(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

function preloadNext(dir) {
  const photos  = PROJECTS[curProj].photos;
  const nextIdx = (curPhoto + dir + photos.length) % photos.length;
  new Image().src = photos[nextIdx];
}

// ── Lightbox open / close ──
// push = false quan l'obertura/tancament ve del botó enrere del navegador
// o de la càrrega inicial (així no afegim entrades repetides a l'historial).
function openLightbox(pi, ph, push = true) {
  curProj = pi; curPhoto = ph; busy = false;
  resetZoom();

  if (isTouchDevice()) {
    lb.querySelectorAll('.lb-mobile-img').forEach(el => el.remove());
    const stage = document.getElementById('lb-stage');
    PROJECTS[curProj].photos.forEach(src => {
      const img = document.createElement('img');
      img.className = 'lb-slide lb-mobile-img';
      img.src = src;
      img.alt = PROJECTS[curProj].title;
      stage.appendChild(img);
    });
  } else {
    imgs.forEach(img => {
      img.style.transition = 'none';
      img.style.transform  = 'translateX(0)';
      img.style.opacity    = '0';
    });
    activeSlot = 0;
    imgs[0].src           = PROJECTS[curProj].photos[curPhoto];
    imgs[0].style.opacity = '1';
  }

  setMeta();
  renderThumbs();
  lb.classList.add('open');
  if (!isTouchDevice()) document.body.style.overflow = 'hidden';
  if (isTouchDevice()) lb.scrollTop = 0;

  // Ara també en mòbil: la URL canvia i el botó enrere tanca el projecte
  if (push) history.pushState({ path: PROJECTS[curProj].path }, '', PROJECTS[curProj].path);
}

function closeLightbox(push = true) {
  resetZoom();
  lb.classList.remove('open');
  if (!isTouchDevice()) document.body.style.overflow = '';
  lbCursor.classList.remove('show');
  overStage = false;
  cursor.classList.remove('hidden');
  cursor.style.opacity = '1';
  busy = false;
  lb.querySelectorAll('.lb-mobile-img').forEach(el => el.remove());
  if (push) history.pushState({}, '', '/');
}

// ── Navigate ──
function navigate(dir, targetIdx = null) {
  if (busy) return;
  busy = true;

  const photos      = PROJECTS[curProj].photos;
  const nextPhoto   = targetIdx !== null ? targetIdx : (curPhoto + dir + photos.length) % photos.length;
  // Només una miniatura decideix la direcció segons l'índex; amb les fletxes
  // fem servir sempre dir (així l'animació no s'inverteix quan dóna la volta).
  const resolvedDir = targetIdx !== null ? (nextPhoto > curPhoto ? 1 : -1) : dir;
  const current     = imgs[activeSlot];
  const next        = imgs[1 - activeSlot];
  const incomingX   = resolvedDir === 1 ? '100vw' : '-100vw';
  const exitX       = resolvedDir === 1 ? '-100vw' : '100vw';

  preload(photos[nextPhoto]).then(() => {
    next.style.transition = 'none';
    next.style.transform  = `translateX(${incomingX})`;
    next.style.opacity    = '1';
    next.src = photos[nextPhoto];
    next.getBoundingClientRect();

    const easing = `transform ${DURATION}ms cubic-bezier(.65,0,.35,1)`;
    current.style.transition = easing;
    next.style.transition    = easing;
    current.style.transform  = `translateX(${exitX})`;
    next.style.transform     = 'translateX(0)';

    setTimeout(() => {
      current.style.opacity    = '0';
      current.style.transition = 'none';
      current.style.transform  = 'translateX(0)';
      curPhoto   = nextPhoto;
      activeSlot = 1 - activeSlot;
      setMeta();
      busy = false;
      preloadNext(dir);
    }, DURATION);
  });
}

// ── Zoom ──
let scale = 1, panX = 0, panY = 0, isPanning = false, panStart = { x: 0, y: 0 };
const MIN_SCALE = 1, MAX_SCALE = 4;

function getActiveImg() { return imgs[activeSlot]; }

function applyTransform(img) {
  img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  img.style.transformOrigin = 'center center';
  lbStage.classList.toggle('zoomed', scale > 1);
  cursor.style.opacity = scale > 1 ? '0' : (overStage ? '0' : '1');
}

function resetZoom() {
  scale = 1; panX = 0; panY = 0;
  const img = getActiveImg();
  if (img) img.style.transform = '';
  lbStage.classList.remove('zoomed');
  cursor.style.opacity = overStage ? '0' : '1';
}

function navigateWithZoomReset(dir, targetIdx = null) {
  resetZoom();
  navigate(dir, targetIdx);
}

lbStage.addEventListener('wheel', e => {
  if (isTouchDevice()) return;
  e.preventDefault();
  const img  = getActiveImg();
  const rect = img.getBoundingClientRect();
  const cx   = e.clientX - (rect.left + rect.width / 2);
  const cy   = e.clientY - (rect.top + rect.height / 2);
  const delta    = e.deltaY < 0 ? 1.12 : 0.9;
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));
  if (newScale === MIN_SCALE) { resetZoom(); return; }
  panX  = cx - (cx - panX) * (newScale / scale);
  panY  = cy - (cy - panY) * (newScale / scale);
  scale = newScale;
  applyTransform(img);
}, { passive: false });

lbStage.addEventListener('mousedown', e => {
  if (scale <= 1 || isTouchDevice()) return;
  isPanning = true;
  panStart  = { x: e.clientX - panX, y: e.clientY - panY };
});
window.addEventListener('mousemove', e => {
  if (!isPanning) return;
  panX = e.clientX - panStart.x;
  panY = e.clientY - panStart.y;
  applyTransform(getActiveImg());
});
window.addEventListener('mouseup', () => { isPanning = false; });

// ── Listeners ──
lbClose.addEventListener('click', () => closeLightbox());
document.getElementById('lb-close-mobile').addEventListener('click', () => closeLightbox());

lbHome.addEventListener('click', e => { e.preventDefault(); closeLightbox(); });
document.getElementById('lb-back').addEventListener('click', e => { e.preventDefault(); closeLightbox(); });

lbLeft.addEventListener('click',  () => navigateWithZoomReset(-1));
lbRight.addEventListener('click', () => navigateWithZoomReset(1));

document.getElementById('lb-scroll-top').addEventListener('click', () => {
  lb.scrollTo({ top: 0, behavior: 'smooth' });
});

document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  navigateWithZoomReset(-1);
  if (e.key === 'ArrowRight') navigateWithZoomReset(1);
});

// ── Routing ──
function currentProjectIndex() {
  let path = decodeURIComponent(location.pathname).replace(/index\.html$/, '');
  if (!path.endsWith('/')) path += '/';
  return PROJECTS.findIndex(p => decodeURIComponent(p.path) === path);
}

// Botó enrere/endavant del navegador: obre o tanca segons la URL actual
window.addEventListener('popstate', () => {
  const idx = currentProjectIndex();
  if (idx !== -1) {
    if (!lb.classList.contains('open') || curProj !== idx) openLightbox(idx, 0, false);
  } else if (lb.classList.contains('open')) {
    closeLightbox(false);
  }
});

// ── Arrow cursor ──
lbStage.addEventListener('mousemove', e => {
  lbCursor.style.left = e.clientX + 'px';
  lbCursor.style.top  = e.clientY + 'px';
  lbArrow.innerHTML = e.clientX < window.innerWidth / 2
    ? '<polygon points="24,4 6,18 24,32"/>'
    : '<polygon points="12,4 30,18 12,32"/>';
});
lbStage.addEventListener('mouseenter', () => {
  overStage = true;
  lbCursor.classList.add('show');
  cursor.style.opacity = '0';
  cursor.classList.add('hidden');
});
lbStage.addEventListener('mouseleave', () => {
  overStage = false;
  lbCursor.classList.remove('show');
  cursor.classList.remove('hidden');
  cursor.style.opacity = '1';
});

// ── Global cursor ──
document.addEventListener('mousemove', e => {
  // Amaguem el cursor natiu només quan el personalitzat ja funciona
  if (!isTouchDevice()) document.documentElement.classList.add('has-cursor');
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
  if (!overStage) cursor.style.opacity = '1';
});
document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });

document.querySelectorAll('a, button, .project-cell').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// ── Protecció imatges ──
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });

// ── Càrrega inicial: si la URL és d'un projecte, l'obrim ──
const initIdx = currentProjectIndex();
if (initIdx !== -1) openLightbox(initIdx, 0, false);
