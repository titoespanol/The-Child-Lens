'use strict';

// Let links use the current tab, including attribution links inserted by map software.
(() => {
  const sameTab = root => {
    if (!(root instanceof Element || root instanceof Document)) return;
    if (root instanceof Element && root.matches('a[target="_blank"]')) root.removeAttribute('target');
    root.querySelectorAll('a[target="_blank"]').forEach(link => link.removeAttribute('target'));
  };
  sameTab(document);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') sameTab(record.target);
      else record.addedNodes.forEach(sameTab);
    }
  }).observe(document.documentElement, {childList:true,subtree:true,attributes:true,attributeFilter:['target']});
})();

// Keep the main navigation focused; secondary actions stay available in More.
(() => {
  const ecosystemHeader = document.querySelector('body > header');
  if (ecosystemHeader) ecosystemHeader.classList.add('ecosystem-header');
  const nav = ecosystemHeader?.querySelector('nav');
  const onMainSite = location.hostname === 'thechildlens.com' || location.hostname === 'www.thechildlens.com';
  const directoryUrl = onMainSite ? '/directory/' : 'directory.html';
  if (onMainSite) {
    document.querySelectorAll('a[href^="directory.html"]').forEach(link => {
      link.href = directoryUrl + link.getAttribute('href').slice('directory.html'.length);
    });
    const filteredDirectory = document.getElementById('filteredDirectory');
    if (filteredDirectory) filteredDirectory.href = directoryUrl;
  }
  {
    const header = document.createElement('header');
    header.className = 'tcl-global-header';
    header.innerHTML = `<nav class="tcl-site-links" aria-label="Site navigation"><a href="https://thechildlens.com/">Home</a><a href="https://thechildlens.com/about/">About Us</a><a href="https://thechildlens.com/map/" aria-current="page">Explore the Ecosystem</a></nav><a class="tcl-site-logo" href="https://thechildlens.com/" aria-label="The Child Lens homepage"><img src="https://thechildlens.com/assets/logo-black.png" alt="The Child Lens" width="160" height="48"></a><button class="tcl-lens-switch" type="button" role="switch" aria-checked="false" aria-label="Child Lens playful view"><span class="tcl-switch-track" aria-hidden="true"><span class="tcl-switch-thumb"></span></span><span class="tcl-switch-text">Adult Lens</span></button>`;
    if (ecosystemHeader) ecosystemHeader.before(header);
    else document.body.prepend(header);
    const lens = header.querySelector('.tcl-lens-switch');
    const key = 'tcl-child-lens-enabled';
    const render = enabled => {
      document.body.classList.toggle('child-lens', enabled);
      lens.setAttribute('aria-checked', String(enabled));
      lens.querySelector('.tcl-switch-text').textContent = enabled ? 'Child Lens' : 'Adult Lens';
      try { localStorage.setItem(key, enabled ? '1' : '0'); } catch {}
      window.dispatchEvent(new CustomEvent('tcl-lens-change', { detail: { enabled } }));
    };
    let enabled = false;
    try { enabled = localStorage.getItem(key) === '1'; } catch {}
    render(enabled);
    lens.addEventListener('click', () => render(lens.getAttribute('aria-checked') !== 'true'));
    window.addEventListener('storage', event => { if (event.key === key) render(event.newValue === '1'); });
  }
  nav?.querySelector('.main-site-home')?.remove();
  const suggest = document.getElementById('openSubmitModal') || nav?.querySelector('a[href*="suggest=organisation"]');
  const credit = nav?.querySelector('a[href="https://thechildlens.com"]');
  if (!nav || !suggest) return;
  const more = document.createElement('details');
  more.className = 'nav-more';
  const summary = document.createElement('summary');
  summary.textContent = 'More';
  more.append(summary);
  const actions = document.createElement('div');
  actions.className = 'nav-more-actions';
  actions.append(suggest);
  if (credit) { credit.textContent = 'Learn more about The Child Lens'; actions.append(credit); }
  more.append(actions);
  if(document.body.classList.contains('map-page')){
    document.querySelectorAll('.site-footer a').forEach(link=>actions.append(link.cloneNode(true)));
  }
  nav.append(more);
  actions.addEventListener('click', () => { more.open = false; });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && more.open) { more.open = false; summary.focus(); }
  });
})();
