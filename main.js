// ── Grid ──
const gridEl = document.getElementById('grid');
PROJECTS.forEach((p, i) => {
  const c = document.createElement('div');
  c.className = 'project-cell';
  c.style.animationDelay = `${i * 0.06}s`;
  c.innerHTML = `<img src="${p.cover}" alt="${p.title}" loading="lazy">
    <div class="project-overlay">
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

function setMeta() {
  const p = PROJECTS[curProj];
  lbTitle.textContent   = p.title.toUpperCase();
  lbSub.textContent     = p.studio.toUpperCase();
  lbCounter.textContent = `${curPhoto + 1} / ${p.photos.length}`;
}

function openLightbox(pi, ph) {
  curProj = pi; curPhoto = ph; busy = false;
  imgs.forEach(img => { img.style.transition = 'none'; img.style.transform = 'translateX(0)'; img.style.opacity = '0'; });
  activeSlot = 0;
  imgs[0].src = PROJECTS[curProj].photos[curPhoto];
  imgs[0].style.opacity = '1';
  setMeta();
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
  lbCursor.classList.remove('show');
  cursor.classList.remove('hidden');
  busy = false;
}

function navigate(dir) {
  if (busy) return;
  busy = true;

  const photos   = PROJECTS[curProj].photos;
  const nextPhoto = (curPhoto + dir + photos.length) % photos.length;
  const current  = imgs[activeSlot];
  const next     = imgs[1 - activeSlot];
  const incomingX = dir === 1 ? '100vw' : '-100vw';
  const exitX     = dir === 1 ? '-100vw' : '100vw';

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
    curPhoto    = nextPhoto;
    activeSlot  = 1 - activeSlot;
    setMeta();
    busy = false;
  }, DURATION);
}

lbClose.addEventListener('click', closeLightbox);
lbHome.addEventListener('click',  closeLightbox);
lbLeft.addEventListener('click',  () => navigate(-1));
lbRight.addEventListener('click', () => navigate(1));

document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
});

let tx = 0;
lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
lb.addEventListener('touchend',   e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) navigate(dx < 0 ? 1 : -1); });

// ── Arrow cursor ──
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
