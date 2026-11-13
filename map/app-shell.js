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
  const nav = document.querySelector('header nav');
  if (nav && !nav.querySelector('.main-site-home')) {
    const home = document.createElement('a');
    home.className = 'main-site-home';
    home.href = 'https://thechildlens.com/';
    home.textContent = 'Home';
    home.setAttribute('aria-label', 'Return to The Child Lens homepage');
    nav.prepend(home);
  }
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
