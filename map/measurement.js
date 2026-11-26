'use strict';
(() => {
  const gaId = 'G-QLRVCZBDF1';
  const clarityId = '';
  const key = 'mch-optional-measurement-v1-' + [gaId, clarityId].filter(Boolean).join('-');
  const profile = /^\/map\/organisations\/[a-z0-9_-]+\/$/.test(location.pathname);
  const settings = location.pathname === '/map/cookies.html';
  const discovery = ['/map/', '/map/index.html', '/directory', '/directory/', '/map/directory.html'].includes(location.pathname);
  if (!['thechildlens.com', 'www.thechildlens.com'].includes(location.hostname)) return;
  if ((!profile && !settings && !discovery) || (!gaId && !clarityId)) return;
  const publicParams = new Set(['organisation','q','country','focus','technology','stage','type']);
  if (location.hash || [...new URLSearchParams(location.search).keys()].some(k => !publicParams.has(k))) return;
  const clarityPage = profile && !location.search;
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  function readChoice() {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  let allowed = readChoice() === 'yes';
  let started = false;
  function script(url) {
    const tag = document.createElement('script');
    tag.async = true;
    tag.referrerPolicy = 'no-referrer';
    tag.src = url;
    document.head.append(tag);
  }
  function start() {
    if (!allowed || started || settings) return;
    started = true;
    if (gaId) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied'});
      window.gtag('js', new Date());
      window.gtag('config', gaId, {page_location: canonical, page_referrer: '', send_page_view: false,
        allow_google_signals: false, allow_ad_personalization_signals: false});
      window.gtag('event', 'page_view', {page_location: canonical, page_referrer: ''});
      script('https://www.googletagmanager.com/gtag/js?id=' + gaId);
    }
    if (clarityId && clarityPage) {
      window.clarity = function () { (window.clarity.q ||= []).push(arguments); };
      window.clarity('consentv2', {ad_Storage: 'denied', analytics_Storage: 'granted'});
      script('https://www.clarity.ms/tag/' + clarityId);
    }
  }
  const events = new Set(['map_pin_open','map_search','map_filter','profile_open','source_open',
    'website_open','profile_to_map','listing_link_copy','fit_map']);
  window.MCHMeasure = name => {
    if (!allowed || !events.has(name)) return;
    window.gtag?.('event', name, {page_location: canonical, page_referrer: ''});
    window.clarity?.('event', name);
  };
  document.addEventListener('click', e => {
    const target = e.target.closest('[data-usage], #fitMap, .legend-item[data-type]');
    if (target) window.MCHMeasure(target.dataset.usage || (target.id === 'fitMap' ? 'fit_map' : 'map_filter'));
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'search' && e.target.value.trim()) window.MCHMeasure('map_search');
    if (['country','type','stage','technology','focus'].includes(e.target.id)) window.MCHMeasure('map_filter');
  });
  function revoke() {
    if (gaId) window['ga-disable-' + gaId] = true;
    window.gtag?.('consent', 'update', {analytics_storage:'denied'});
    window.clarity?.('consentv2', {ad_Storage:'denied', analytics_Storage:'denied'});
    for (const pair of document.cookie.split(';')) {
      const name = pair.split('=')[0].trim();
      if (!/^(_ga($|_)|_clck$|_clsk$)/.test(name)) continue;
      for (const domain of ['', ';domain=thechildlens.com', ';domain=' + location.hostname]) {
        document.cookie = name + '=;max-age=0;path=/' + domain;
      }
    }
  }
  const panel = document.createElement('section');
  panel.className = 'measurement-choice';
  panel.setAttribute('aria-label', 'Optional analytics');
  const message = document.createElement('p');
  const purposes = [];
  if (gaId) purposes.push('Google Analytics to count map interactions');
  if (clarityId) purposes.push('Microsoft Clarity to produce heatmaps and session recordings on public organisation profiles');
  message.textContent = 'Allow ' + purposes.join(' and ') + '?';
  const notice = document.createElement('a');
  notice.href = '/map/cookies.html';
  notice.textContent = 'Cookie settings';
  panel.append(message);
  for (const [label, choice] of [['Allow analytics','yes'], ['Decline analytics','no']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      try { localStorage.setItem(key, choice); } catch {}
      allowed = choice === 'yes';
      if (allowed) start();
      else revoke();
      render(choice);
    });
    panel.append(button);
  }
  panel.append(notice);
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  function render(choice) {
    panel.hidden = !settings && ['yes','no'].includes(choice);
    status.textContent = choice === 'yes' ? 'Optional analytics are allowed.' : 'Optional analytics are off.';
  }
  if (settings) {
    document.getElementById('measurement-settings').append(status, panel);
    notice.remove();
  } else document.body.append(panel);
  render(readChoice());
  start();
  window.addEventListener('pageshow', e => {
    if (e.persisted && allowed !== (readChoice() === 'yes')) location.reload();
  });
  window.addEventListener('storage', e => {
    if (e.key !== key && e.key !== null) return;
    const wasStarted = started;
    allowed = readChoice() === 'yes';
    if (!allowed && wasStarted) {
      revoke();
      location.reload();
      return;
    }
    render(readChoice());
    start();
  });
})();
