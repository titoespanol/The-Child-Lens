'use strict';
// A non-modal card: the map remains available while organisation details are open.
(() => {
  const root = document.getElementById('mapRegion');
  if (!root) return;
  const mobile = matchMedia('(max-width: 840px)');
  const states = ['peek', 'detail', 'expanded'];
  let state = 'detail', callbacks = {}, active = false, drag = null;
  const node = (tag, className, text) => {
    const n = document.createElement(tag); n.className = className;
    if (text) n.textContent = text;
    return n;
  };
  const sheet = node('section', 'organisation-sheet');
  sheet.id = 'organisationSheet'; sheet.hidden = true;
  sheet.setAttribute('role', 'region'); sheet.setAttribute('aria-labelledby', 'sheetTitle');
  const handle = node('button', 'sheet-handle'); handle.type = 'button';
  handle.setAttribute('aria-label', 'Resize organisation card. Use up and down arrows to expand or collapse.');
  const grip = node('span', 'sheet-grip'); grip.setAttribute('aria-hidden', 'true'); handle.append(grip);
  const header = node('div', 'sheet-header');
  const heading = node('h2', 'sheet-title'); heading.id = 'sheetTitle'; heading.tabIndex = -1;
  const actions = node('div', 'sheet-actions');
  function button(text, label, action) {
    const b = node('button', '', text); b.type = 'button'; b.setAttribute('aria-label', label);
    b.addEventListener('click', action); actions.append(b); return b;
  }
  button('×', 'Close organisation card', () => close(true));
  header.style.touchAction = 'none';
  header.append(heading, actions);
  const meta = node('p', 'sheet-meta');
  const body = node('div', 'sheet-body'); body.id = 'organisationSheetContent';
  handle.setAttribute('aria-controls', body.id);
  sheet.append(handle, header, meta, body); root.append(sheet);
  function notify() { requestAnimationFrame(() => { if (active) callbacks.resize?.(sheet.getBoundingClientRect().height); }); }
  function setState(next) {
    if (!states.includes(next)) return;
    state = next; sheet.dataset.state = state;
    sheet.style.removeProperty('height'); sheet.classList.remove('is-dragging');
    body.hidden = state === 'peek';
    handle.setAttribute('aria-expanded', String(state !== 'peek'));
    notify();
  }
  function close(restoreFocus = false) {
    if (!active) return;
    active = false; drag = null; sheet.hidden = true; root.classList.remove('has-organisation-sheet');
    sheet.style.removeProperty('height'); sheet.classList.remove('is-dragging');
    callbacks.close?.(restoreFocus); callbacks = {};
  }
  handle.addEventListener('click', () => {
    if (handle.dataset.dragged === 'true') { delete handle.dataset.dragged; return; }
    setState(states[(states.indexOf(state) + 1) % states.length]);
  });
  handle.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') delete handle.dataset.dragged;
    const index = states.indexOf(state);
    const next = { ArrowUp: states[Math.min(2, index + 1)], ArrowDown: states[Math.max(0, index - 1)], Home: 'peek', End: 'expanded' }[event.key];
    if (next) { event.preventDefault(); setState(next); }
  });
  function startDrag(event) {
    if (event.target?.closest?.('.sheet-actions')) return;
    if (event.button !== 0) return;
    delete handle.dataset.dragged;
    drag = { y: event.clientY, height: sheet.getBoundingClientRect().height, moved: false, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  handle.addEventListener('pointerdown', startDrag);
  header.addEventListener('pointerdown', startDrag);
  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const delta = drag.y - event.clientY;
    if (Math.abs(delta) < 8 && !drag.moved) return;
    drag.moved = true; sheet.classList.add('is-dragging');
    body.hidden = false;
    const limit = Math.max(100, window.innerHeight - 150);
    sheet.style.height = `${Math.max(112, Math.min(limit, drag.height + delta))}px`;
  }
  handle.addEventListener('pointermove', moveDrag);
  header.addEventListener('pointermove', moveDrag);
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const delta = drag.y - event.clientY;
    if (drag.moved) {
      handle.dataset.dragged = 'true';
      const index = states.indexOf(state);
      setState(states[Math.max(0, Math.min(2, index + (delta > 36 ? 1 : delta < -36 ? -1 : 0)))]);
    }
    drag = null;
  }
  handle.addEventListener('pointerup', endDrag);
  header.addEventListener('pointerup', endDrag);
  header.addEventListener('pointercancel', () => { drag = null; setState(state); });
  handle.addEventListener('pointercancel', () => { drag = null; setState(state); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active && !document.querySelector('dialog[open], .nav-more[open]')) {
      event.preventDefault(); close(true);
    }
  });
  sheet.addEventListener('transitionend', event => { if (event.propertyName === 'max-height') notify(); });
  window.addEventListener('resize', notify);
  mobile.addEventListener('change', () => { if (!mobile.matches) close(false); });
  window.MCHMapSheet = {
    open(org, content, options = {}) {
      if (!mobile.matches) return false;
      const wasOpen = active;
      callbacks = options; active = true;
      heading.textContent = org.name;
      header.querySelector?.('.organisation-logo')?.remove();
      if(window.MCHOrganisationLogos)header.prepend(window.MCHOrganisationLogos.badge(org));
      meta.textContent = [org.type, org.city, org.country, org.stage].filter(Boolean).join(' · ');
      content.querySelector('.popup-card-header')?.remove();
      content.querySelector('.popup-meta')?.remove();
      const primary = node('div', 'sheet-primary-links');
      const links = content.querySelector('.popup-links');
      if (links) [...links.querySelectorAll('a')].filter(a => /^(Website|Public source)/.test(a.textContent)).forEach(a => primary.append(a));
      const locationNote = node('p', 'sheet-location-note', 'Map location may be approximate.');
      body.replaceChildren(primary, content, locationNote); body.scrollTop = 0;
      sheet.hidden = false; root.classList.add('has-organisation-sheet');
      setState(wasOpen ? state : 'detail');
      if (options.focus) heading.focus({ preventScroll: true });
      return true;
    },
    close,
    get isOpen() { return active; }
  };
})();
