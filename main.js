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

// ── Lightbox ──
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
const cursor    = document.getElementById('cursor');
const imgs      = [document.getElementById('lb-img-a'), document.getElementById('lb-img-b')];

let activeSlot = 0, curProj = 0, curPhoto = 0, busy = false;
const DURATION = 480;

const lbThumbs = document.getElementById('lb-thumbs');

function renderThumbs() {
  lbThumbs.innerHTML = '';
  PROJECTS[curProj].photos.forEach((src, i) => {
    const img = document.createElement('img');
    img.className = 'lb-thumb' + (i === curPhoto ? ' active' : '');
    img.src = src;
    img.alt = '';
    img.addEventListener('click', () => {
      if (i === curPhoto) return;
      navigate(i > curPhoto ? 1 : -1, i);
    });
    lbThumbs.appendChild(img);
  });
}

function updateThumbs() {
  lbThumbs.querySelectorAll('.lb-thumb').forEach((el, i) => {
    el.classList.toggle('active', i === curPhoto);
  });
  // Scroll la miniatura activa al centre
  const active = lbThumbs.querySelector('.active');
  if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
}
  const p = PROJECTS[curProj];
  lbTitle.textContent   = p.title.toUpperCase();
  lbSub.textContent     = p.studio.toUpperCase();
  lbCounter.textContent = `${curPhoto + 1} / ${p.photos.length}`;
  // Mòbil
  const mTitle = lb.querySelector('.lb-m-title');
  const mSub   = lb.querySelector('.lb-m-sub');
  if (mTitle) mTitle.textContent = p.title.toUpperCase();
  if (mSub)   mSub.textContent   = p.studio.toUpperCase();
}

// Preload an image, returns a Promise
function preload(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

function openLightbox(pi, ph) {
  curProj = pi; curPhoto = ph; busy = false;

  if (isTouchDevice()) {
    // Mòbil: mostra totes les fotos en vertical
    const photos = PROJECTS[curProj].photos;
    imgs[0].style.opacity = '0';
    imgs[1].style.opacity = '0';

    // Elimina fotos anteriors si n'hi havia
    const existing = lb.querySelectorAll('.lb-mobile-img');
    existing.forEach(el => el.remove());

    const stage = document.getElementById('lb-stage');
    photos.forEach(src => {
      const img = document.createElement('img');
      img.className = 'lb-slide lb-mobile-img';
      img.src = src;
      img.alt = PROJECTS[curProj].title;
      stage.appendChild(img);
    });
  } else {
    // Ordinador: comportament normal amb sliding
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
    const slug = PROJECTS[curProj].slug;
    history.pushState({ slug }, '', `/${slug}`);
  }
}

function closeLightbox() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
  lbCursor.classList.remove('show');
  cursor.classList.remove('hidden');
  busy = false;
  // Elimina fotos mòbil
  lb.querySelectorAll('.lb-mobile-img').forEach(el => el.remove());
  if (!isTouchDevice()) history.pushState({}, '', '/');
}

// Precarrega la foto següent en segon pla
function preloadNext(dir) {
  const photos  = PROJECTS[curProj].photos;
  const nextIdx = (curPhoto + dir + photos.length) % photos.length;
  const img = new Image();
  img.src = photos[nextIdx];
}

function navigate(dir, targetIdx = null) {
  if (busy) return;
  busy = true;

  const photos    = PROJECTS[curProj].photos;
  const nextPhoto = targetIdx !== null ? targetIdx : (curPhoto + dir + photos.length) % photos.length;
  const resolvedDir = nextPhoto > curPhoto ? 1 : -1;
  const current   = imgs[activeSlot];
  const next      = imgs[1 - activeSlot];
  const incomingX = resolvedDir === 1 ? '100vw' : '-100vw';
  const exitX     = resolvedDir === 1 ? '-100vw' : '100vw';

  // Preload before animating
  preload(photos[nextPhoto]).then(() => {
    next.style.transition = 'none';
    next.style.transform  = `translateX(${incomingX})`;
    next.style.opacity    = '1';
    next.src = photos[nextPhoto];

    next.getBoundingClientRect(); // force reflow

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
    }, DURATION);
  });
}

// Handle browser back button
window.addEventListener('popstate', () => {
  if (lb.classList.contains('open')) {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    lbCursor.classList.remove('show');
    cursor.classList.remove('hidden');
    busy = false;
  }
});

// Open project if URL matches on page load
const initSlug = location.pathname.replace('/', '');
if (initSlug) {
  const idx = PROJECTS.findIndex(p => p.slug === initSlug);
  if (idx !== -1) openLightbox(idx, 0);
}

lbClose.addEventListener('click', closeLightbox);
lbHome.addEventListener('click',  closeLightbox);
lbLeft.addEventListener('click',  () => navigateWithZoomReset(-1));
lbRight.addEventListener('click', () => navigateWithZoomReset(1));

document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape')     { resetZoom(); closeLightbox(); }
  if (e.key === 'ArrowLeft')  navigateWithZoomReset(-1);
  if (e.key === 'ArrowRight') navigateWithZoomReset(1);
});

let tx = 0;
lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
lb.addEventListener('touchend',   e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) navigate(dx < 0 ? 1 : -1); });

// ── Arrow cursor — binary black/white based on pixel brightness ──
lbStage.addEventListener('mousemove', e => {
  lbCursor.style.left = e.clientX + 'px';
  lbCursor.style.top  = e.clientY + 'px';
  lbArrow.innerHTML = e.clientX < window.innerWidth / 2
    ? '<polyline points="30,10 10,24 30,38"/>'
    : '<polyline points="18,10 38,24 18,38"/>';
});
lbStage.addEventListener('mouseenter', () => { lbCursor.classList.add('show'); cursor.classList.add('hidden'); });
lbStage.addEventListener('mouseleave', () => { lbCursor.classList.remove('show'); cursor.classList.remove('hidden'); });

// ── Global cursor ──
document.addEventListener('mousemove', e => { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; });
document.querySelectorAll('a, button, .project-cell').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// ── Protecció imatges ──
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
// Bloqueig tàctil (press llarg en mòbil)
document.addEventListener('touchstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); }, { passive: false });