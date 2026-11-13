'use strict';

// 1. Supabase Cloud Configuration
const SUPABASE_URL = 'https://zbhvwduyohpiiksyjqba.supabase.co';
// Publishable browser key only. Never put a service-role/secret key in this client.
const SUPABASE_ANON_KEY = 'sb_publishable_P_gC6PJRohYkXn1nMBGC4A_bHKkQmef';

// Match the intentionally limited anon/authenticated SELECT grants on public.organisations.
// Never use select=* here: column-level grants make the wildcard request fail and expose
// future columns to the browser by default if grants are later broadened.
const PUBLIC_ORGANISATION_FIELDS = window.MCHOrganisationModel.publicFields;
const filterState = window.MCHOrganisationModel.fromSearch(location.search);

const $ = id => document.getElementById(id);
let all = [], shown = [], map = null, markers = [], activePopup = null, activeRelation = null;
let registry = { terms: new Map(), assignments: new Map(), links: new Map() };

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

function appendRegistryDetails(parent, org) {
  const rows = registry.assignments.get(org.id) || [];
  const terms = rows.map(row => registry.terms.get(row.term_id)).filter(Boolean);
  const badges = [...new Set(terms.filter(term => ['coverage', 'support'].includes(term.facet)).map(term => term.label))];
  if (badges.length) {
    const group = el('div', 'registry-badges');
    badges.forEach(label => group.append(el('span', 'registry-badge', label)));
    parent.append(group);
  }
  const relations = registry.links.get(org.id) || [];
  if (relations.length) {
    const relation = el('p', 'registry-relation');
    for (const row of relations) {
      const target = row.target_org_id && all.find(item => item.id === row.target_org_id);
      const label = target?.name || row.target_name;
      if (!label) continue;
      if (relation.childNodes.length) relation.append(document.createTextNode(' · '));
      relation.append(el('span', 'registry-relation-kind', row.relationship === 'part_of' ? 'Part of ' : 'Affiliated with '), el('span', '', label));
    }
    if (relation.childNodes.length) parent.append(relation);
  }
}

async function loadPublicRegistry() {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
  const read = async (table, select) => {
    const query = new URLSearchParams({ select, limit: '5000' });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Registry read ${table}: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error(`Registry response ${table} is not a list`);
    return rows;
  };
  try {
    const [terms, assignments, links] = await Promise.all([
      read('taxonomy_terms', 'id,label,facet,parent_id'),
      read('organisation_terms', 'org_id,term_id,facet,kind,context,review_status'),
      read('organisation_links', 'source_org_id,target_org_id,target_name,relationship,review_status')
    ]);
    registry = { terms: new Map(terms.map(term => [term.id, term])), assignments: new Map(), links: new Map() };
    for (const row of assignments) {
      if (!['source_verified', 'curator_reviewed'].includes(row.review_status)) continue;
      const values = registry.assignments.get(row.org_id) || [];
      values.push(row); registry.assignments.set(row.org_id, values);
    }
    for (const row of links) {
      if (!['source_verified', 'curator_reviewed'].includes(row.review_status)) continue;
      const values = registry.links.get(row.source_org_id) || [];
      values.push(row); registry.links.set(row.source_org_id, values);
    }
    return true;
  } catch (error) {
    console.info('Optional public taxonomy is unavailable; showing core directory fields.', error);
    return false;
  }
}

const safeUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

function appendFoundingYear(parent,org){
  const label=window.MCHOrganisationModel.foundingLabel(org);if(!label)return;
  const row=el('p','meta');const link=el('a','',label);
  link.href=org.founding_year_source_url;link.setAttribute('aria-label',`${label}: source for ${org.name}`);
  row.append(link);parent.append(row);
}

const located = org =>
  Number.isFinite(org.lat) && Number.isFinite(org.lng) &&
  Math.abs(org.lat) <= 90 && Math.abs(org.lng) <= 180;

const isVenture = org =>
  ['startup', 'pre-spinout', 'pre-spinout project'].includes((org.type || '').toLowerCase());

const normalise = value =>
  String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function externalLink(label, value) {
  const url = safeUrl(value);
  if (!url) return null;
  const link = el('a', 'text-link', label.replace(' ↗',''));
  link.href = url;
  link.rel = 'noopener noreferrer';
  return link;
}

function viewPortfolioButton(org) {
  if (!org.portfolio || !org.portfolio.length) return null;
  const button = el('button', 'portfolio-btn', 'View ' + org.portfolio.length + ' portfolio companies on map');
  button.type = 'button';
  button.addEventListener('click', e => {
    e.stopPropagation();
    filterByPortfolio(org);
  });
  return button;
}

function filterByPortfolio(investor) {
  activeRelation = investor.name;
  shown = all.filter(item => (investor.portfolio || []).includes(item.id));
  if ($('search')) $('search').value = '';
  for (const key of window.MCHOrganisationModel.multiKeys) {
    const select=$(key);
    if (select) for (const option of select.options) option.selected=false;
    filterState[key]=[];
  }
  render();
  setTimeout(fitResults, 150);
}

function publicAffiliations(org) {
  const section = el('details', 'public-affiliations');
  section.append(el('summary', '', 'People who chose to share an affiliation'));
  const content = el('div'); section.append(content); let loaded = false;
  section.addEventListener('toggle', async () => {
    if (!section.open || loaded) return;
    content.textContent = 'Loading affiliations…';
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_public_affiliations`, {
        method:'POST',headers:{apikey:SUPABASE_ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_org:String(org.id)}),signal:AbortSignal.timeout(5000)
      });
      if (!response.ok) throw new Error(); const rows=await response.json();
      if (!Array.isArray(rows)) throw new Error(); content.replaceChildren();
      if (!rows.length) content.append(el('p','','No public affiliations shared yet.'));
      rows.forEach(row=>content.append(el('p','',[row.name,row.role].filter(Boolean).join(' · '))));loaded=true;
    } catch {content.textContent='Public affiliations could not be loaded. Close and reopen to retry.';}
  });
  return section;
}
function popup(org) {
  const card = el('div', 'map-card-popup');

  const topRow = el('div', 'popup-card-header');
  if(window.MCHOrganisationLogos)topRow.append(window.MCHOrganisationLogos.badge(org));
  topRow.append(el('h3', 'popup-title', org.name));

  if (org.stage) {
    topRow.append(el('span', 'stage-badge', org.stage));
  }
  card.append(topRow);

  const metaText = [org.type, org.city, org.country].filter(Boolean).join(' | ');
  card.append(el('p', 'popup-meta', metaText));
  appendFoundingYear(card,org);
  if (org.address) card.append(el('p', 'popup-meta', [org.address, org.postal_code].filter(Boolean).join(', ')));

  if (org.description) {
    card.append(el('p', 'popup-desc', org.description));
  }

  const tags = [...(org.focus || []), ...(org.technology || [])];
  if (tags.length) {
    const tagList = el('div', 'popup-tags');
    [...new Set(tags)].slice(0, 4).forEach(tag => {
      tagList.append(el('span', 'tag', tag));
    });
    card.append(tagList);
  }

  const pBtn = viewPortfolioButton(org);
  if (pBtn) card.append(pBtn);

  const links = el('div', 'popup-links');
  for (const [label, url] of [['Website ↗', org.website], ['LinkedIn ↗', org.linkedin_url], ['Public source ↗', org.sourceUrl]]) {
    const link = externalLink(label, url);
    if (link) links.append(link);
  }

  const workspace = el('a', 'text-link', 'Associations & sharing');
  workspace.href = 'organisation-management.html?org=' + encodeURIComponent(org.id);
  links.append(workspace);
  if(window.MCHOrganisationLogos)links.append(window.MCHOrganisationLogos.managementLink(org));
  if (links.children.length) card.append(links);

  if(window.MCHOrganisationTeam)card.append(window.MCHOrganisationTeam.card(org));
  card.append(publicAffiliations(org));
  return card;
}

let selectedMapOrganisation = null;
function dismissOrganisationCard(event) {
  const target = event?.target;
  if (target?.closest?.('.map-pin, .maplibregl-popup, .organisation-sheet, dialog, .nav-more, .map-link, #findTcl, #legendTcl')) return;
  window.MCHMapSheet?.close(false);
  if (activePopup) { activePopup.remove(); activePopup = null; }
  selectedMapOrganisation = null; markSelectedOrganisation(null);
}
// Clicks follow a completed tap, so dragging/panning does not dismiss the card.
document.addEventListener('click', dismissOrganisationCard);
function markSelectedOrganisation(id) {
  document.querySelectorAll('.map-pin').forEach(button => {
    const selected = button.dataset.organisationId === String(id);
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
function show(org, scrollCard = true, keyboard = false) {
  if (!map || !located(org)) return;

  if (activePopup) { activePopup.remove(); activePopup = null; }
  selectedMapOrganisation = org;
  markSelectedOrganisation(org.id);
  if (window.MCHMapSheet && matchMedia('(max-width: 840px)').matches) {
    const currentZoom = map.getZoom();
    const nearby = map.getBounds().contains([org.lng, org.lat]);
    const zoom = currentZoom < 4 ? 5 : nearby ? currentZoom : Math.min(currentZoom, 6);
    let firstFrame = true;
    window.MCHMapSheet.open(org, popup(org), {
      focus: keyboard,
      resize: height => {
        // Offset the centre into the visible area, without changing persistent map padding.
        map.easeTo({ center: [org.lng, org.lat], offset: [0, (76 - height) / 2],
          ...(firstFrame ? { zoom } : {}),
          duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350,
          essential: false });
        firstFrame = false;
      },
      close: restoreFocus => {
        selectedMapOrganisation = null; markSelectedOrganisation(null);
        if (restoreFocus) [...document.querySelectorAll('.map-pin')].find(button => button.dataset.organisationId === String(org.id))?.focus({ preventScroll: true });
      }
    });
    return;
  }
  window.MCHMapSheet?.close(false);
  selectedMapOrganisation = org; markSelectedOrganisation(org.id);
  map.easeTo({ center: [org.lng, org.lat], zoom: 10.5,
    duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500, essential: false });
  activePopup = new maplibregl.Popup({ offset: 18, anchor: 'left', maxWidth: '340px', closeButton: true, closeOnClick: false })
    .setLngLat([org.lng, org.lat]).setDOMContent(popup(org)).addTo(map);
  activePopup.on('close', () => { selectedMapOrganisation = null; markSelectedOrganisation(null); });

  // The map page has no mobile view switch. The old setMobileView call
  // raised a ReferenceError on narrow screens when a pin was clicked.
  if (innerWidth > 840 && scrollCard) {
    const cardNode = $('card-' + org.id);
    if (cardNode) {
      if (cardNode.tagName === 'DETAILS') cardNode.open = true;
      cardNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardNode.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      cardNode.style.borderColor = 'var(--accent, #007074)';
      cardNode.style.boxShadow = '0 0 0 3px rgba(0, 112, 116, 0.25)';
      setTimeout(() => {
        cardNode.style.borderColor = '';
        cardNode.style.boxShadow = '';
      }, 2500);
    }
  }
}

function updateMarkers() {
  markers.forEach(marker => marker.remove());
  markers = [];
  const pins = shown.filter(located);
  if ($('fitMap')) $('fitMap').disabled = !map || !pins.length;
  if ($('mapNote')) {
    $('mapNote').textContent =
      shown.length + (shown.length === 1 ? ' organisation matches.' : ' organisations match.');
  }

  if (!map) return;
  pins.forEach(org => {
    const typeClass =
      (org.type || '').toLowerCase().includes('hospital') ? ' type-hospital' :
      (org.type || '').toLowerCase().includes('startup') ? ' type-startup' :
      (org.type || '').toLowerCase().includes('investor') ? ' type-investor' :
      (org.type || '').toLowerCase().includes('hub') || (org.type || '').toLowerCase().includes('accelerator') ? ' type-hub' : '';

    const button = el('button', 'map-pin' + (org.id === 'seed-1' ? ' tcl-pin' : typeClass));
    button.type = 'button';
    button.title = org.name;
    button.dataset.organisationId = String(org.id);
    button.addEventListener('click', event => show(org, true, event.detail === 0));
    const marker = new maplibregl.Marker({ element: button, anchor: 'center' }).setLngLat([org.lng, org.lat]).addTo(map);
    if (org.id === 'seed-1') button.parentElement?.style.setProperty('z-index', '20');
    // MapLibre assigns its own generic label during construction; restore the organisation name afterwards.
    button.setAttribute('aria-label', `Show ${org.name}${org.city ? ' in ' + org.city : ''} on map`);
    markers.push(marker);
  });
  markSelectedOrganisation(selectedMapOrganisation?.id);
}

function fitResults() {
  const pins = shown.filter(located);
  if (!map || !pins.length) return;
  if (activePopup) activePopup.remove();
  window.MCHMapSheet?.close(false);
  const bounds = new maplibregl.LngLatBounds();
  pins.forEach(org => bounds.extend([org.lng, org.lat]));
  map.fitBounds(bounds, {
    padding: { top: 85, bottom: 100, left: 45, right: 45 },
    maxZoom: 11,
    duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600
  });
}

function render() {
  const root = $('results');
  if (!root) {
    updateMarkers();
    return;
  }
  root.replaceChildren();

  const countText = activeRelation
    ? 'Showing ' + shown.length + ' portfolio companies backed by ' + activeRelation
    : shown.length + (shown.length === 1 ? ' organisation' : ' organisations');

  if ($('count')) $('count').textContent = countText;
  if ($('mobileCount')) $('mobileCount').textContent = shown.length;

  if (!shown.length) {
    root.append(el('p', 'empty-state', 'No organisations match your search. Try another term or clear the filters.'));
  }

  shown.forEach(org => {
    const card = el('details', 'entry');
    card.open = false;
    card.id = 'card-' + org.id;

    const summary = el('summary', 'entry-summary');
    const body = el('div', 'entry-body');
    const head = el('div', 'entry-top');
    head.append(
      window.MCHOrganisationLogos?.badge(org) || el('span', 'logo-fallback', org.name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()),
      el('h2', 'name', org.name)
    );

    if (org.stage) {
      head.append(el('span', 'stage-badge', org.stage));
    }

    head.firstChild.setAttribute('aria-hidden', 'true');
    card.append(summary, body);
    summary.append(head, el('p', 'meta', [org.type, org.city || 'Location under review', org.country].filter(Boolean).join(' | ')));
    appendFoundingYear(summary,org);

    if (org.address) body.append(el('p', 'meta', [org.address, org.postal_code].filter(Boolean).join(', ')));
    if (org.description) body.append(el('p', 'desc', org.description));
    appendRegistryDetails(body, org);

    const tags = [...(org.focus || []), ...(org.technology || [])];
    if (tags.length) {
      const list = el('div', 'tags');
      [...new Set(tags)].forEach(tag => {
        const badge = el('button', 'tag', tag);
        badge.type = 'button';
        badge.title = 'Filter by ' + tag;
        badge.addEventListener('click', e => {
          e.stopPropagation();
          activeRelation = null;
          if ($('focus') && [...$('focus').options].some(opt => opt.value === tag)) {
            if ($('focus').multiple) [...$('focus').options].find(opt=>opt.value===tag).selected=true; else $('focus').value = tag;
          } else if ($('technology') && [...$('technology').options].some(opt => opt.value === tag)) {
            if ($('technology').multiple) [...$('technology').options].find(opt=>opt.value===tag).selected=true; else $('technology').value = tag;
          } else if ($('search')) {
            $('search').value = tag;
          }
          filter();
          if ($('directory')) $('directory').scrollIntoView({ behavior: 'smooth' });
        });
        list.append(badge);
      });
      body.append(list);
    }

    if (org.verification && !/^verified$/i.test(org.verification)) body.append(el('p', 'verification', 'Review status: ' + org.verification));

    const pBtn = viewPortfolioButton(org);
    if (pBtn) body.append(pBtn);

    const links = el('div', 'card-links');
    for (const [label, url] of [['Website ↗', org.website], ['LinkedIn ↗', org.linkedin_url], ['Public source ↗', org.sourceUrl]]) {
      const link = externalLink(label, url);
      if (link) links.append(link);
    }

    if (!safeUrl(org.sourceUrl)) {
      body.append(el('p', 'verification', 'Supporting source not yet recorded.'));
    }

    if (located(org)) {
      if (map) {
        const button = el('button', 'map-link', 'Show on map');
        button.addEventListener('click', () => show(org, false));
        links.append(button);
      } else {
        const mapLink = el('a', 'text-link', 'Show on map');
        mapLink.href = 'index.html?organisation=' + encodeURIComponent(org.id);
        links.append(mapLink);
      }
    }

    if(window.MCHOrganisationTeam)body.append(window.MCHOrganisationTeam.card(org));
  body.append(publicAffiliations(org));
    const workspace = el('a', 'text-link', 'Associations & sharing');
    workspace.href = 'organisation-management.html?org=' + encodeURIComponent(org.id);
    links.append(workspace);
    if(window.MCHOrganisationLogos)links.append(window.MCHOrganisationLogos.managementLink(org));

    if (links.children.length) body.append(links);
    root.append(card);
  });

  updateMarkers();
}

function filter(syncUrl = true) {
  activeRelation = null;
  for (const key of window.MCHOrganisationModel.filterKeys) {
    const input = $(key === 'q' ? 'search' : key);
    if (input) filterState[key] = input.multiple ? [...input.selectedOptions].map(option => option.value).filter(Boolean) : input.value.trim();
  }
  const {type,country,focus,technology,stage} = filterState;
  shown = window.MCHOrganisationModel.filterRows(all, filterState);
  if (syncUrl) {
    const url = new URL(location.href);
    url.searchParams.delete('organisation');
    for (const key of window.MCHOrganisationModel.filterKeys) {
      url.searchParams.delete(key);
      if (filterState[key]) for (const value of Array.isArray(filterState[key]) ? filterState[key] : [filterState[key]]) url.searchParams.append(key,value);
    }
    history.replaceState(null, '', url);
  }
  const hasFilters = window.MCHOrganisationModel.filterKeys.some(key => Array.isArray(filterState[key]) ? filterState[key].length : filterState[key]);
  if ($('clearMapFilters')) $('clearMapFilters').hidden = !hasFilters;
  const query = window.MCHOrganisationModel.toSearch(filterState).toString();
  for (const link of document.querySelectorAll('header nav a[href^="directory.html"], header nav a[href^="index.html"]')) {
    const page = link.getAttribute('href').split('?')[0];
    link.href = page + (query ? '?' + query : '');
  }
  if ($('filteredDirectory')) {
    $('filteredDirectory').hidden = !hasFilters;
    $('filteredDirectory').href = 'directory.html' + (query ? '?' + query : '');
    $('filteredDirectory').textContent = `View ${shown.length} ${window.MCHOrganisationModel.categoryLabel(type, shown.length)} in the directory`;
  }

  const active = [type,country,focus,technology,stage].reduce((sum,value)=>sum+(Array.isArray(value)?value.length:Number(Boolean(value))),0);
  if ($('filterCount')) $('filterCount').textContent = active ? '(' + active + ')' : '';
  document.querySelectorAll('.legend-item[data-type]').forEach(button => button.setAttribute('aria-pressed', String((Array.isArray(type)?type:[type]).includes(button.dataset.type))));
  render();
  window.MCHFilterBar?.refresh();
}

function addOptions(id, values) {
  const select = $(id);
  if (!select) return;
  const selected = select.multiple ? [...select.selectedOptions].map(option => option.value).filter(Boolean) : select.value;
  const placeholder = select.options[0]?.textContent || '';
  const options = [...new Set(values.filter(Boolean))].sort()
    .map(value => new Option(id === 'type' && value === 'hub' ? 'Hubs & accelerators (group)' : value, value));
  for (const value of Array.isArray(selected) ? selected : [selected]) if (value && !options.some(option => option.value === value)) options.push(new Option(value + ' (not in current data)', value));
  select.replaceChildren(...(select.multiple ? [] : [new Option(placeholder, '')]), ...options);
  if (select.multiple) for (const option of select.options) option.selected = selected.includes(option.value);
  else if (selected) select.value = selected;
}

function initMap() {
  if (!window.maplibregl) {
    if ($('mapFallback')) $('mapFallback').hidden = false;
    return;
  }
  try {
    map = new maplibregl.Map({
      container: 'map',
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [-27, 37],
      zoom: 1.7
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', updateMarkers);
    map.on('error', () => { if (!map.isStyleLoaded() && $('mapFallback')) $('mapFallback').hidden = false; });
    map.on('idle', () => { if ($('mapFallback')) $('mapFallback').hidden = true; });
    if ($('mapRegion')) new ResizeObserver(() => map.resize()).observe($('mapRegion'));
    updateMarkers();
  } catch {
    map = null;
    if ($('mapFallback')) $('mapFallback').hidden = false;
  }
}

let initialRouteHandled = false;

function applyOrganisationData(data, source) {
  if (!Array.isArray(data) || !data.length) return false;
  all = data.map(org => ({ ...org, registryTechnology: (registry.assignments.get(org.id) || [])
    .map(row => registry.terms.get(row.term_id)).filter(term => term?.facet === 'technology').map(term => term.label) }));
  all.sort((a, b) => (a.id === 'seed-1' ? -1 : b.id === 'seed-1' ? 1 : a.name.localeCompare(b.name)));

  addOptions('type', [...all.map(org => org.type), 'hub']);
  // Use the same live taxonomy for directory filters and human-reviewed suggestions.
  if ($('subType')) {
    const selectedType = $('subType').value;
    const types = [...new Set([...all.map(org => org.type), selectedType].filter(Boolean))].sort();
    $('subType').replaceChildren(new Option('Choose an organisation type', ''), ...types.map(type => new Option(type, type)));
    if (types.includes(selectedType)) $('subType').value = selectedType;
  }
  addOptions('country', all.map(org => org.country));
  addOptions('focus', all.flatMap(org => org.focus || []));
  addOptions('technology', all.flatMap(org => [...(org.technology || []), ...(org.registryTechnology || [])]));
  addOptions('stage', all.map(org => org.stage));

  const params = new URLSearchParams(location.search);
  if (!initialRouteHandled) {
    if ($('search')) $('search').value = params.get('q') || '';
    for (const id of ['type', 'country', 'focus', 'technology', 'stage']) {
      const elNode = $(id);
      const requested = elNode?.multiple ? params.getAll(id) : params.getAll(id).slice(0,1);
      if (elNode && requested.length) {
        for (const value of requested) if (![...elNode.options].some(opt => opt.value === value)) elNode.append(new Option(value + ' (not in current data)', value));
        if (elNode.multiple) for (const option of elNode.options) option.selected = requested.includes(option.value); else elNode.value = requested[0];
      }
    }
  }

  filter(false);
  const linkedOrganisation = params.get('organisation');
  if (!initialRouteHandled && linkedOrganisation) {
    const organisation = all.find(org => String(org.id) === linkedOrganisation);
    if (organisation) {
      if ($('search')) $('search').value = organisation.name;
      for (const id of ['type', 'country', 'focus', 'technology', 'stage']) if ($(id)) { if ($(id).multiple) [...$(id).options].forEach(option=>option.selected=false); else $(id).value=''; }
      filter(false);
      show(organisation, true);
    }
    else if ($('status')) $('status').textContent = 'This organisation is no longer in the current directory. You can search for another record.';
  }
  initialRouteHandled = true;
  if ($('status')) {
    $('status').textContent = source === 'local snapshot' ? 'Showing a saved directory copy. Some details may have changed.' : '';
  }
  return true;
}

async function init() {
  await loadPublicRegistry();
  let snapshotLoaded = false;
  try {
    const res = await fetch('./data/organisations.json');
    if (res.ok) snapshotLoaded = applyOrganisationData(await res.json(), 'local snapshot');
  } catch (err) {
    console.error('Local JSON fetch failed:', err);
  }

  if (!snapshotLoaded && !all.length && $('status')) $('status').textContent = 'Directory unavailable';

  if (SUPABASE_ANON_KEY && (SUPABASE_ANON_KEY.startsWith('sb_publishable_') || SUPABASE_ANON_KEY.startsWith('ey'))) {
    try {
      const query = new URLSearchParams({ select: PUBLIC_ORGANISATION_FIELDS.join(',') });
      const res = await fetch(`${SUPABASE_URL}/rest/v1/organisations?${query}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) applyOrganisationData(json, 'live directory');
      }
    } catch (err) {
      console.warn('Supabase fetch failed; keeping the bundled snapshot:', err);
    }
  }
}

// --------------------------------------------------------------------------
// Map legend and page links
// --------------------------------------------------------------------------
document.querySelectorAll('.legend-item[data-type]').forEach(item => {
  item.addEventListener('click', () => {
    const targetType = item.getAttribute('data-type');
    const typeSelect=$('type');
    if(typeSelect?.multiple){const option=[...typeSelect.options].find(entry=>entry.value===targetType);if(option)option.selected=!option.selected;}
    else if(typeSelect)typeSelect.value=typeSelect.value===targetType?'':targetType;
    else {const types=Array.isArray(filterState.type)?filterState.type:filterState.type?[filterState.type]:[];filterState.type=types.includes(targetType)?types.filter(value=>value!==targetType):[...types,targetType];}
    window.MCHMapSheet?.close(false);
    filter();
    fitResults();
  });
});

function clearAllFilters() {
  for (const key of window.MCHOrganisationModel.filterKeys) {
    filterState[key] = '';
    const input = $(key === 'q' ? 'search' : key);
    if (input) { if (input.multiple) [...input.options].forEach(option=>option.selected=false); else input.value = ''; }
  }
  window.MCHMapSheet?.close(false);
  filter();
  if (map) fitResults();
}
$('clearMapFilters')?.addEventListener('click', clearAllFilters);

if ($('legendTcl')) {
  $('legendTcl').addEventListener('click', () => {
    const tcl = all.find(org => org.id === 'seed-1');
    if (tcl) { document.querySelector('.map-legend').open = false; show(tcl, true); }
  });
}

// Show filters restored from shared URLs immediately.
const initialFilters = new URLSearchParams(location.search);
if (['type', 'focus', 'country', 'technology', 'stage'].some(key => initialFilters.has(key))) {
  const filterPanel = document.querySelector('.filter-panel');
  if (filterPanel) filterPanel.open = true;
}

// --------------------------------------------------------------------------
// Human-reviewed organisation suggestions
// --------------------------------------------------------------------------
const modal = $('submitModal');
if (modal && $('openSubmitModal')) {
  $('openSubmitModal').addEventListener('click', () => {
    if ($('submitMsg')) $('submitMsg').hidden = true;
    modal.showModal();
  });
  if ($('closeModal')) $('closeModal').addEventListener('click', () => modal.close());
  if ($('closeModalCross')) $('closeModalCross').addEventListener('click', () => modal.close());

  const form = $('submissionForm');
  if (form) {
    for (const id of ['subWebsite', 'subLinkedin']) {
      $(id).addEventListener('input', () => {
        $('subWebsite').setCustomValidity('');
        $('subLinkedin').setCustomValidity('');
      });
    }
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('submitBtn');
      const msg = $('submitMsg');
      if (btn?.disabled) return;

      // Keep link validation local so neither field must be individually required.
      const website = $('subWebsite');
      const linkedin = $('subLinkedin');
      website.setCustomValidity('');
      linkedin.setCustomValidity('');
      if (!website.value.trim() && !linkedin.value.trim()) {
        website.setCustomValidity('Provide an organisation website or LinkedIn page.');
      }
      if (linkedin.value.trim()) {
        try {
          const url = new URL(linkedin.value.trim());
          if (!['https:', 'http:'].includes(url.protocol) ||
              !['linkedin.com', 'www.linkedin.com'].includes(url.hostname) ||
              !/^\/(company|school|showcase)\/[^/]+/.test(url.pathname)) throw Error();
        } catch {
          linkedin.setCustomValidity('Use an organisation LinkedIn page, such as https://www.linkedin.com/company/example/.');
        }
      }
      if (website.value.trim() && !/^https?:\/\//i.test(website.value.trim())) {
        website.setCustomValidity('Use a website address starting with https:// or http://.');
      }
      if (!form.reportValidity()) return;

      // Acknowledge the publication and privacy terms.
      if (!$('subGdpr').checked) {
        if (msg) {
          msg.textContent = 'Please accept the privacy terms to submit.';
          msg.style.color = '#c53030';
          msg.hidden = false;
        }
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

      const newEntry = {
        name: $('subName') ? $('subName').value.trim() : '',
        type: $('subType') ? $('subType').value : 'Startup',
        stage: $('subStage') ? $('subStage').value : '',
        city: $('subCity') ? $('subCity').value.trim() : '',
        country: $('subCountry') ? $('subCountry').value.trim() : '',
        website: $('subWebsite') ? $('subWebsite').value.trim() : '',
        clinical_focus: $('subFocus') ? $('subFocus').value.trim() : '',
        address: $('subAddress').value.trim(),
        postal_code: $('subPostcode').value.trim(),
        linkedin_url: linkedin.value.trim(),
        description: $('subDescription').value.trim(),
        source_url: $('subSource').value.trim(),
        status: 'pending'
      };

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(newEntry)
        });

        if (!res.ok) throw Error('HTTP ' + res.status);

        if (msg) {
          msg.textContent = 'Thank you. Your suggestion is awaiting human review by The Child Lens. It is not published on the map yet.';
          msg.style.color = '#007074';
          msg.hidden = false;
        }
        form.reset();

      } catch (err) {
        console.error('Submission error:', err);
        if (msg) {
          msg.textContent = 'Your suggestion could not be submitted. Please try again, or email map@thechildlens.com.';
          msg.style.color = '#c53030';
          msg.hidden = false;
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Send suggestion'; }
      }
    });
  }
}

if ($('search')) $('search').addEventListener('input', () => filter());
if ($('type')) $('type').addEventListener('change', () => filter());
if ($('country')) $('country').addEventListener('change', () => filter());
if ($('focus')) $('focus').addEventListener('change', () => filter());
if ($('technology')) $('technology').addEventListener('change', () => filter());
if ($('stage')) $('stage').addEventListener('change', () => filter());

if ($('reset')) $('reset').addEventListener('click', clearAllFilters);

if ($('findTcl')) {
  $('findTcl').addEventListener('click', () => {
    const tcl = all.find(org => org.id === 'seed-1');
    if (tcl) show(tcl, true);
  });
}

if ($('fitMap')) $('fitMap').addEventListener('click', fitResults);

if ($('map')) initMap();
init();

// Open the existing review submission form from the profile affiliation search.
if (new URLSearchParams(location.search).get('suggest') === 'organisation') {
  document.getElementById('openSubmitModal')?.click();
}

$('clearKeyFilters')?.addEventListener('click', clearAllFilters);
