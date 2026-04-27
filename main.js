// ── Grid ──
const gridEl = document.getElementById('grid');
PROJECTS.forEach((p, i) => {
  const c = document.createElement('div');
  c.className = 'project-cell';
  c.style.animationDelay = `${i * 0.06}s`;
  c.innerHTML = `
    <img src="${p.cover}" alt="${p.title}" loading="lazy">
    <div class="project-overlay"></div>
    <div class="project-info">
      <span class="project-title">${p.title}</span>
      <span class="project-sub">${p.studio}</span>
    </div>`;
  c.addEventListener('click', () => openLightbox(i, 0));
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
const lbStage   = document.getElementById('lb-stage');
const lbCursor  = document.getElementById('lb-cursor');
const lbArrow   = document.getElementById('lb-arrow');
const lbThumbs  = document.getElementById('lb-thumbs');
const cursor    = document.getElementById('cursor');
const imgs      = [document.getElementById('lb-img-a'), document.getElementById('lb-img-b')];

let activeSlot = 0, curProj = 0, curPhoto = 0, busy = false;
const DURATION = 480;

const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

// ── Meta ──
function setMeta() {
  const p = PROJECTS[curProj];
  lbTitle.textContent   = p.title.toUpperCase();
  lbSub.textContent     = p.studio.toUpperCase();
  lbCounter.textContent = `${curPhoto + 1} / ${p.photos.length}`;
  updateThumbs();
}

// ── Thumbnails ──
function renderThumbs() {
  lbThumbs.innerHTML = '';
  PROJECTS[curProj].photos.forEach((src, i) => {
    const img = document.createElement('img');
    img.className = 'lb-thumb' + (i === curPhoto ? ' active' : '');
    img.src = src;
    img.alt = '';
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
  const img = new Image();
  img.src = photos[nextIdx];
}

// ── Lightbox open / close ──
function openLightbox(pi, ph) {
  curProj = pi; curPhoto = ph; busy = false;

  if (isTouchDevice()) {
    imgs[0].style.opacity = '0';
    imgs[1].style.opacity = '0';
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
    imgs.forEach(img => { img.style.transition = 'none'; img.style.transform = 'translateX(0)'; img.style.opacity = '0'; });
    activeSlot = 0;
    imgs[0].src = PROJECTS[curProj].photos[curPhoto];
    imgs[0].style.opacity = '1';
  }

  setMeta();
  renderThumbs();
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (!isTouchDevice()) {
    history.pushState({ slug: PROJECTS[curProj].slug }, '', `/${PROJECTS[curProj].slug}`);
  }
}

function closeLightbox() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
  lbCursor.classList.remove('show');
  cursor.classList.remove('hidden');
  busy = false;
  lb.querySelectorAll('.lb-mobile-img').forEach(el => el.remove());
  if (!isTouchDevice()) history.pushState({}, '', '/');
}

// ── Navigate ──
function navigate(dir, targetIdx = null) {
  if (busy) return;
  busy = true;

  const photos      = PROJECTS[curProj].photos;
  const nextPhoto   = targetIdx !== null ? targetIdx : (curPhoto + dir + photos.length) % photos.length;
  const resolvedDir = nextPhoto > curPhoto ? 1 : -1;
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
  if (scale > 1) cursor.style.opacity = '0';
  else cursor.style.opacity = '1';
}

function resetZoom() {
  scale = 1; panX = 0; panY = 0;
  const img = getActiveImg();
  if (img) { img.style.transform = ''; }
  lbStage.classList.remove('zoomed');
  cursor.style.opacity = '1';
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
  lbStage.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', e => {
  if (!isPanning) return;
  panX = e.clientX - panStart.x;
  panY = e.clientY - panStart.y;
  applyTransform(getActiveImg());
});
window.addEventListener('mouseup', () => {
  if (!isPanning) return;
  isPanning = false;
  lbStage.style.cursor = '';
});

// ── Listeners ──
lbClose.addEventListener('click', closeLightbox);
document.getElementById('lb-close-mobile').addEventListener('click', closeLightbox);
lbHome.addEventListener('click', closeLightbox);
lbLeft.addEventListener('click',  () => navigateWithZoomReset(-1));
lbRight.addEventListener('click', () => navigateWithZoomReset(1));

document.getElementById('lb-scroll-top').addEventListener('click', () => {
  lb.scrollTo({ top: 0, behavior: 'smooth' });
});

document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape')     { resetZoom(); closeLightbox(); }
  if (e.key === 'ArrowLeft')  navigateWithZoomReset(-1);
  if (e.key === 'ArrowRight') navigateWithZoomReset(1);
});

let tx = 0;
lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
lb.addEventListener('touchend',   e => {
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 40) navigate(dx < 0 ? 1 : -1);
});

// ── Routing ──
window.addEventListener('popstate', () => {
  if (lb.classList.contains('open')) {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    lbCursor.classList.remove('show');
    cursor.classList.remove('hidden');
    busy = false;
  }
});

const initSlug = location.pathname.replace('/', '');
if (initSlug) {
  const idx = PROJECTS.findIndex(p => p.slug === initSlug);
  if (idx !== -1) openLightbox(idx, 0);
}

// ── Arrow cursor ──
lbStage.addEventListener('mousemove', e => {
  lbCursor.style.left = e.clientX + 'px';
  lbCursor.style.top  = e.clientY + 'px';
  lbArrow.innerHTML = e.clientX < window.innerWidth / 2
    ? '<polygon points="22,6 6,16 22,26"/>'
    : '<polygon points="10,6 26,16 10,26"/>';
});
lbStage.addEventListener('mouseenter', () => { lbCursor.classList.add('show'); cursor.style.opacity = '0'; cursor.classList.add('hidden'); });
lbStage.addEventListener('mouseleave', () => { lbCursor.classList.remove('show'); cursor.classList.remove('hidden'); });

// ── Global cursor ──
document.addEventListener('mousemove', e => {
  cursor.style.left    = e.clientX + 'px';
  cursor.style.top     = e.clientY + 'px';
  cursor.style.opacity = '1';
});
document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
document.querySelectorAll('a, button, .project-cell').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// ── Protecció imatges ──
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
document.addEventListener('touchstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); }, { passive: false });