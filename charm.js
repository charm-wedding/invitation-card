(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gate = document.getElementById('invitation-gate');
  const openButton = document.getElementById('open-invitation');
  if (gate && typeof gate.showModal === 'function') {
    gate.showModal();
    document.body.classList.add('invitation-entering');
    openButton.addEventListener('click', async () => {
      openButton.disabled = true;
      const finish = () => {
        gate.close();
        window.scrollTo({ top: 0, behavior: 'instant' });
        requestAnimationFrame(() => {
          document.body.classList.remove('invitation-entering');
          document.querySelector('.site-header .wordmark').focus({ preventScroll: true });
        });
      };
      if (reducedMotion.matches) { finish(); return; }
      const easing = 'cubic-bezier(.65, 0, .35, 1)';
      const play = (element, frames, duration, delay = 0) => element.animate(frames, {
        duration, delay, easing, fill: 'forwards'
      });
      try {
        // Open the envelope first, then fade the opening scene into the live invitation.
        window.scrollTo({ top: 0, behavior: 'instant' });
        gate.classList.add('opening');
        await new Promise(resolve => window.setTimeout(resolve, 760));
        gate.classList.add('gate-fade-out');
        const content = gate.querySelector('.gate-content');
        await play(content, [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(.985)' }
        ], 520).finished;
        finish();
      } catch {
        finish();
      }
    });
  }

  const menu = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('navigation');
  const closeMenu = () => { navigation.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    navigation.classList.toggle('is-open', expanded);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });

  const eventCards = [...document.querySelectorAll('.event-card--flip')];
  const closeEventCard = (card, returnFocus = false) => {
    const toggle = card.querySelector('.event-card-toggle');
    const back = card.querySelector('.event-card-back');
    card.classList.remove('is-flipped');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.tabIndex = 0;
    window.setTimeout(() => { if (!card.classList.contains('is-flipped')) back.hidden = true; }, 650);
    if (returnFocus) toggle.focus();
  };
  eventCards.forEach(card => {
    const toggle = card.querySelector('.event-card-toggle');
    const back = card.querySelector('.event-card-back');
    const returnButton = card.querySelector('.event-card-return');
    toggle.addEventListener('click', () => {
      back.hidden = false;
      requestAnimationFrame(() => card.classList.add('is-flipped'));
      toggle.setAttribute('aria-expanded', 'true');
      toggle.tabIndex = -1;
      returnButton.focus({ preventScroll: true });
    });
    returnButton.addEventListener('click', () => closeEventCard(card, true));
  });
  if ('IntersectionObserver' in window) {
    const cardObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('card-is-visible');
        cardObserver.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    eventCards.forEach(card => cardObserver.observe(card));
  } else {
    eventCards.forEach(card => card.classList.add('card-is-visible'));
  }
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openCard = document.querySelector('.event-card--flip.is-flipped');
    if (openCard) { event.preventDefault(); closeEventCard(openCard, true); }
  });

  const weddingDate = new Date(document.body.dataset.countdown || '2027-01-30T10:00:00+05:30').getTime();
  function updateCountdown() {
    const remaining = Math.max(0, weddingDate - Date.now());
    const values = [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60, Math.floor(remaining / 1000) % 60];
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, index) => { document.getElementById(id).textContent = String(values[index]).padStart(2, '0'); });
    if (!remaining) document.getElementById('countdown-note').textContent = document.body.dataset.completeMessage || 'Our forever has begun. Thank you for celebrating with us!';
    return remaining;
  }
  if (updateCountdown()) { const timer = setInterval(() => { if (!updateCountdown()) clearInterval(timer); }, 1000); }
  const canvas = document.getElementById('scratch-card');
  const revealButton = document.getElementById('reveal-date');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let revealed = false, drawing = false, previous = null, strokes = 0;
  function revealDate() {
    if (revealed) return;
    revealed = true;
    canvas.classList.add('revealed');
    revealButton.textContent = 'A date with forever ✓';
    revealButton.setAttribute('aria-label', document.body.dataset.revealLabel || 'Wedding date revealed: January 30, 2027');
  }
  function paintScratchCard() {
    if (!context || revealed) return;
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio; canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.globalCompositeOperation = 'source-over';
    const gold = context.createLinearGradient(0, 0, width, height);
    gold.addColorStop(0, '#e7a72e'); gold.addColorStop(.5, '#ffe19b'); gold.addColorStop(1, '#d88b24');
    context.fillStyle = gold; context.fillRect(0, 0, width, height);
    context.strokeStyle = '#73572d66'; context.lineWidth = 1; context.strokeRect(10, 10, width - 20, height - 20);
    context.fillStyle = '#624828'; context.textAlign = 'center';
    context.font = `italic ${Math.min(28, width / 12)}px Georgia`; context.fillText('A beautiful day awaits', width / 2, height / 2 - 5);
    context.font = '9px Arial'; context.fillText('S C R A T C H   T O   R E V E A L', width / 2, height / 2 + 27);
    previous = null;
  }
  function checkScratch() {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0, total = 0;
    for (let index = 3; index < pixels.length; index += 256) { total++; if (pixels[index] < 128) transparent++; }
    if (transparent / total > .35) revealDate();
  }
  function scratch(event) {
    if (!drawing || revealed) return;
    const bounds = canvas.getBoundingClientRect();
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = 38; context.lineCap = 'round'; context.lineJoin = 'round';
    context.beginPath(); context.moveTo(previous ? previous.x : point.x, previous ? previous.y : point.y);
    context.lineTo(point.x, point.y); context.stroke();
    context.beginPath(); context.arc(point.x, point.y, 19, 0, Math.PI * 2); context.fill();
    previous = point;
    if (++strokes % 8 === 0) checkScratch();
  }
  if (context) {
    canvas.classList.add('ready'); revealButton.hidden = false; paintScratchCard();
    revealButton.addEventListener('click', revealDate);
    canvas.addEventListener('pointerdown', event => { drawing = true; previous = null; canvas.setPointerCapture(event.pointerId); scratch(event); });
    canvas.addEventListener('pointermove', scratch);
    const stopDrawing = () => { if (drawing && !revealed) checkScratch(); drawing = false; previous = null; };
    canvas.addEventListener('pointerup', stopDrawing); canvas.addEventListener('pointercancel', stopDrawing);
    window.addEventListener('resize', paintScratchCard);
  }
  const gallery = [...document.querySelectorAll('.gallery-photo')];
  const lightbox = document.getElementById('lightbox');
  const photo = document.getElementById('lightbox-image');
  let photoIndex = 0;
  function showPhoto(index) {
    photoIndex = (index + gallery.length) % gallery.length;
    photo.src = gallery[photoIndex].href; photo.alt = gallery[photoIndex].querySelector('img').alt;
    document.getElementById('lightbox-caption').textContent = `${photo.alt} · ${photoIndex + 1} / ${gallery.length}`;
  }
  gallery.forEach((link, index) => link.addEventListener('click', event => {
    if (typeof lightbox.showModal !== 'function') return;
    event.preventDefault(); showPhoto(index); lightbox.showModal();
  }));
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => showPhoto(photoIndex + 1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1)); }
  });
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
})();

