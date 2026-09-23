'use strict';

// Navigation works independently of fonts, icons, maps, and other external assets.
const menu = document.getElementById('mobile-menu');
const menuToggle = document.querySelector('.menu-toggle');
const supportsDialogs = typeof menu.showModal === 'function';

if (supportsDialogs) {
  const openers = new WeakMap();
  function openDialog(dialog, opener) {
    openers.set(dialog, opener);
    dialog.showModal();
    document.body.classList.add('modal-open');
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')]
        .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener('close', () => {
      // A close event is queued: don't reset a dialog that was already reopened.
      if (dialog.open) return;
      if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
      if (dialog === menu) menuToggle.setAttribute('aria-expanded', 'false');
      openers.get(dialog)?.focus({ preventScroll: true });
    });
    // A click on the backdrop closes the dialog; padding remains interactive.
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  menuToggle.addEventListener('click', () => {
    openDialog(menu, menuToggle);
    menuToggle.setAttribute('aria-expanded', 'true');
  });
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.close();
      if (link.hash) {
        const target = document.querySelector(link.hash);
        // Give keyboard users a useful focus destination after leaving the menu.
        if (target) {
          target.setAttribute('tabindex', '-1');
          openers.set(menu, target);
        }
      }
    });
  });
  window.matchMedia('(max-width: 760px)').addEventListener('change', event => {
    if (!event.matches && menu.open) {
      openers.set(menu, document.querySelector('.brand'));
      menu.close();
    }
  });
  document.documentElement.classList.add('js-ready');

  // Native modal gallery: image links remain useful if JavaScript is unavailable.
  const gallery = document.getElementById('gallery-dialog');
  const galleryImage = document.getElementById('gallery-image');
  const galleryTitle = document.getElementById('gallery-title');
  const galleryCount = document.getElementById('gallery-count');
  const galleryError = document.getElementById('gallery-error');
  const previous = document.getElementById('gallery-prev');
  const next = document.getElementById('gallery-next');
  const groups = new Map();
  document.querySelectorAll('.gallery-link').forEach(link => {
    const group = groups.get(link.dataset.gallery) || [];
    group.push(link);
    groups.set(link.dataset.gallery, group);
  });
  let photos = [];
  let photoIndex = 0;
  function showPhoto(index) {
    photoIndex = (index + photos.length) % photos.length;
    const photo = photos[photoIndex];
    galleryError.textContent = '';
    galleryTitle.textContent = photo.dataset.title;
    galleryImage.alt = `${photo.dataset.title} — photo ${photoIndex + 1}`;
    galleryImage.src = photo.href;
    galleryCount.textContent = `${photoIndex + 1} of ${photos.length}`;
    previous.disabled = next.disabled = photos.length === 1;
  }
  galleryImage.addEventListener('error', () => {
    galleryError.textContent = 'This photo could not load. Try another photo or check your connection.';
  });
  groups.forEach(group => group.forEach((link, index) => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      photos = group;
      showPhoto(index);
      openDialog(gallery, link);
    });
  }));
  previous.addEventListener('click', () => showPhoto(photoIndex - 1));
  next.addEventListener('click', () => showPhoto(photoIndex + 1));
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let touchStart = null;
  galleryImage.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  galleryImage.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) showPhoto(photoIndex + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  // An inquiry is prepared locally. Opening Messenger never implies a booking.
  const inquiry = document.getElementById('inquiry-dialog');
  const form = document.getElementById('inquiry-form');
  const date = document.getElementById('arrival-date');
  const time = document.getElementById('arrival-time');
  const duration = document.getElementById('inquiry-duration');
  const guests = document.getElementById('inquiry-guests');
  const summary = document.getElementById('inquiry-summary');
  const status = document.getElementById('copy-status');
  let chosenRoom = '';
  function updateInquiry() {
    // Keep a calendar date as entered; parsing YYYY-MM-DD as UTC can change its day.
    const arrival = date.value || 'To be confirmed';
    summary.value = `Hello Dudice Hotel! I'd like to ask about the ${chosenRoom}.\nArrival date: ${arrival}\nArrival time: ${time.value || 'To be confirmed'}\nStay: ${duration.value} hours from check-in\nGuests: ${guests.value}\nPlease confirm availability, the total price including any extra guest charges, and the required deposit. Thank you!`;
    document.getElementById('email-inquiry').href = `mailto:dudiceinn@gmail.com?subject=${encodeURIComponent(`Room inquiry: ${chosenRoom}`)}&body=${encodeURIComponent(summary.value)}`;
    status.textContent = '';
  }
  document.querySelectorAll('.room-link').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const card = link.closest('.room-card');
      chosenRoom = card.dataset.room;
      document.getElementById('inquiry-title').textContent = `Ask about the ${chosenRoom}`;
      // Use the hotel's calendar date, even when the visitor is overseas.
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const part = type => parts.find(p => p.type === type).value;
      date.min = `${part('year')}-${part('month')}-${part('day')}`;
      guests.replaceChildren();
      for (let count = 1; count <= Number(card.dataset.capacity); count++) {
        const option = document.createElement('option');
        option.value = String(count);
        option.textContent = `${count} guest${count === 1 ? '' : 's'}${count > Number(card.dataset.included) ? ' (extra charge)' : ''}`;
        guests.append(option);
      }
      const guestFilter = document.getElementById('guest-filter').value;
      guests.value = guestFilter === 'all' ? card.dataset.included : guestFilter;
      duration.value = document.getElementById('stay-filter').value === '24' ? '24' : '12';
      updateInquiry();
      openDialog(inquiry, link);
    });
  });
  form.addEventListener('input', updateInquiry);
  form.addEventListener('change', updateInquiry);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const message = summary.value;
    try {
      await navigator.clipboard.writeText(message);
      if (summary.value === message) status.textContent = 'Copied. Open Messenger and paste this inquiry into the chat.';
    } catch {
      summary.focus();
      summary.select();
      status.textContent = 'Copy is unavailable here. Your message is selected — copy it manually, then paste it into Messenger.';
    }
  });
}

// Filtering does not claim availability: it compares published room capacities.
const roomCards = [...document.querySelectorAll('.room-card')];
const guestFilter = document.getElementById('guest-filter');
const stayFilter = document.getElementById('stay-filter');
const filterStatus = document.getElementById('filter-status');
function filterRooms() {
  const guestCount = guestFilter.value === 'all' ? 0 : Number(guestFilter.value);
  let count = 0;
  roomCards.forEach(card => {
    card.hidden = Number(card.dataset.capacity) < guestCount;
    if (!card.hidden) count++;
    card.querySelectorAll('.room-rate').forEach(rate => {
      rate.hidden = stayFilter.value !== 'all' && rate.dataset.duration !== stayFilter.value;
    });
  });
  filterStatus.textContent = `${count} room type${count === 1 ? '' : 's'} ${guestCount ? `fit${count === 1 ? 's' : ''} ${guestCount}${guestCount === 9 ? '+' : ''} guests` : 'shown'}. Availability and any extra guest charges are confirmed on inquiry.`;
  document.getElementById('no-rooms').hidden = count > 0;
}
guestFilter.addEventListener('change', filterRooms);
stayFilter.addEventListener('change', filterRooms);
document.querySelector('.room-controls').hidden = false;
filterStatus.hidden = false;
filterRooms();
