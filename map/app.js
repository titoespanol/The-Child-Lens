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
let all = [], shown = [], map = null, markers = new Map(), activePopup = null, activeRelation = null;
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
    let memberHeadingShown = false;
    for (const row of relations) {
      const target = row.target_org_id && all.find(item => item.id === row.target_org_id);
      const label = target?.name || row.target_name;
      if (!label) continue;
      if (relation.childNodes.length) relation.append(document.createTextNode(' · '));
      const taskforceId = 'coalition-child-lens-taskforce-gb';
      const isTaskforceMember = org.id === taskforceId && row.relationship === 'affiliated_with';
      const relationLabel = row.target_org_id === taskforceId ? 'Representatives are members of ' :
        isTaskforceMember ? (memberHeadingShown ? '' : 'Member representatives from: ') :
        row.relationship === 'part_of' ? 'Part of ' : 'Affiliated with ';
      if (isTaskforceMember) memberHeadingShown = true;
      const targetLabel = el(target ? 'a' : 'span', '', label);
      if (target) targetLabel.href = publicListingUrl(target);
      relation.append(el('span', 'registry-relation-kind', relationLabel), targetLabel);
    }
    if (relation.childNodes.length) parent.append(relation);
  }
}

async function loadPublicRegistry() {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
  const read = async (table, select) => {
    const rows = [];
    const order = table === 'taxonomy_terms' ? 'id.asc' : table === 'organisation_terms' ?
      'org_id.asc,term_id.asc,context.asc' : 'source_org_id.asc,relationship.asc,target_name.asc';
    for (let offset = 0; ; offset += 500) {
      const query = new URLSearchParams({ select, order, limit: '500', offset: String(offset) });
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers, signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`Registry read ${table}: ${response.status}`);
      const page = await response.json();
      if (!Array.isArray(page)) throw new Error(`Registry response ${table} is not a list`);
      rows.push(...page);
      if (page.length < 500) return rows;
    }
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
  if (label.startsWith('Website')) link.dataset.usage = 'website_open';
  if (label.startsWith('Public source')) link.dataset.usage = 'source_open';
  return link;
}

function publicListingUrl(org) {
  if (window.MCHPublishedProfiles?.has(org.id)) {
    return new URL('/map/organisations/' + encodeURIComponent(org.id) + '/', location.origin).href;
  }
  const mainSite = ['thechildlens.com', 'www.thechildlens.com'].includes(location.hostname);
  const url = new URL(mainSite ? 'https://thechildlens.com/directory/' : 'directory.html', document.baseURI);
  url.searchParams.set('organisation', org.id);
  return url.href;
}

function appendProfileLink(links, org) {
  if (!window.MCHPublishedProfiles?.has(org.id)) return;
  const link = el('a', 'text-link', 'View organisation profile');
  link.href = publicListingUrl(org);
  link.dataset.usage = 'profile_open';
  links.append(link);
}

function suggestListingCorrection(org) {
  const name = org.name.replace(/[\r\n]+/g, ' ').trim();
  const subject = encodeURIComponent(`Listing correction for ${name}`);
  const body = [
    'Hello The Child Lens team,',
    '',
    'I’d like to suggest a correction to this listing.',
    name,
    publicListingUrl(org),
    '',
    'Suggested correction',
    '',
    'Public source (if available)',
    ''
  ].join('\r\n');
  const link = el('a', 'text-link', 'Suggest a correction');
  link.href = `mailto:map@thechildlens.com?subject=${subject}&body=${encodeURIComponent(body)}`;
  return link;
}

function shareListing(org) {
  const url = publicListingUrl(org);

  const group = el('div', 'listing-share');
  const button = el('button', 'map-link', 'Copy listing link');
  button.type = 'button';
  const status = el('span', 'listing-share-status');
  status.setAttribute('role', 'status');
  const field = el('input', 'listing-share-url');
  field.type = 'url';
  field.readOnly = true;
  field.hidden = true;
  field.value = url;
  field.setAttribute('aria-label', 'Shareable listing link');
  group.append(button, status, field);

  button.addEventListener('click', async () => {
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(url);
      field.hidden = true;
      status.textContent = 'Link copied';
      window.MCHMeasure?.('listing_link_copy');
    } catch {
      status.textContent = 'Copy the link below';
      field.hidden = false;
      field.focus();
      field.select();
    }
  });
  return group;
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

  appendRegistryDetails(card, org);
  const pBtn = viewPortfolioButton(org);
  if (pBtn) card.append(pBtn);

  const links = el('div', 'popup-links');
  appendProfileLink(links, org);
  const directoryLink = el('a', 'text-link', 'Open in directory');
  directoryLink.href = ecosystemUrl('directory', window.MCHOrganisationModel.toSearch(filterState), org.id);
  directoryLink.dataset.rememberMap = '';
  links.append(directoryLink);
  for (const [label, url] of [['Website ↗', org.website], ['LinkedIn ↗', org.linkedin_url], ['Public source ↗', org.sourceUrl]]) {
    const link = externalLink(label, url);
    if (link) links.append(link);
  }

  const workspace = el('a', 'text-link', 'Associations & sharing');
  workspace.href = 'organisation-management.html?org=' + encodeURIComponent(org.id);
  links.append(workspace);
  if(window.MCHOrganisationLogos)links.append(window.MCHOrganisationLogos.managementLink(org));
  links.append(shareListing(org), suggestListingCorrection(org));
  card.append(links);

  if(window.MCHOrganisationTeam)card.append(window.MCHOrganisationTeam.card(org));
  return card;
}

let selectedMapOrganisation = null;
function dismissOrganisationCard(event) {
  const target = event?.target;
  if (target?.closest?.('.map-pin, .map-cluster, .maplibregl-popup, .organisation-sheet, .ecosystem-switch, dialog, .nav-more, .map-link, #findTcl, #legendTcl')) return;
  window.MCHMapSheet?.close(false);
  if (activePopup) { activePopup.remove(); activePopup = null; }
  clearMapSelection();
}
function clearMapSelection() {
  if (!selectedMapOrganisation) return;
  selectedMapOrganisation = null;
  renderMapMarkers();
  syncViewLinks(window.MCHOrganisationModel.toSearch(filterState));
}
// Clicks follow a completed tap, so dragging/panning does not dismiss the card.
document.addEventListener('click', dismissOrganisationCard);
function show(org, scrollCard = true, keyboard = false, returnFocus, preserveCamera = false) {
  if (!map || !located(org)) return;

  if (activePopup) { activePopup.remove(); activePopup = null; }
  selectedMapOrganisation = org;
  renderMapMarkers();
  syncViewLinks(window.MCHOrganisationModel.toSearch(filterState));
  if (window.MCHMapSheet && matchMedia('(max-width: 840px)').matches) {
    const currentZoom = map.getZoom();
    const nearby = map.getBounds().contains([org.lng, org.lat]);
    const zoom = currentZoom < 4 ? 5 : nearby ? currentZoom : Math.min(currentZoom, 6);
    let firstFrame = true;
    window.MCHMapSheet.open(org, popup(org), {
      focus: keyboard,
      resize: height => {
        if (preserveCamera) return;
        // Offset the centre into the visible area, without changing persistent map padding.
        map.easeTo({ center: [org.lng, org.lat], offset: [0, (76 - height) / 2],
          ...(firstFrame ? { zoom } : {}),
          duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350,
          essential: false });
        firstFrame = false;
      },
      close: restoreFocus => {
        clearMapSelection();
        if (restoreFocus && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
        else if (restoreFocus) [...document.querySelectorAll('.map-pin')].find(button => button.dataset.organisationId === String(org.id))?.focus({ preventScroll: true });
      }
    });
    return;
  }
  window.MCHMapSheet?.close(false);
  selectedMapOrganisation = org; renderMapMarkers();
  if (!preserveCamera) map.easeTo({ center: [org.lng, org.lat], zoom: Math.max(map.getZoom(), 10.5),
    duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500, essential: false });
  activePopup = new maplibregl.Popup({ offset: 18, anchor: 'left', maxWidth: '340px', closeButton: true, closeOnClick: false })
    .setLngLat([org.lng, org.lat]).setDOMContent(popup(org)).addTo(map);
  activePopup.on('close', () => { clearMapSelection(); });

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

const clusterSourceId = 'organisation-points';
let pointGroups = new Map();
let clusterRevision = 0;
let clusterSignature;
let clusterRequest = 0;

function updateMarkers() {
  const pins = shown.filter(located);
  const fit = $('fitMap');
  if (fit) fit.hidden = fit.disabled = !map || !pins.length;
  if ($('mapNote')) {
    $('mapNote').textContent =
      shown.length + (shown.length === 1 ? ' organisation matches.' : ' organisations match.');
  }
  const resultText = $('mapFilterResultText');
  if (resultText && all.length) {
    const count = shown.length;
    resultText.textContent = count === 0 ? 'No organisations match your search.'
      : pins.length === 0 ? (count === 1 ? 'One match has no map location.' : `${count} matches have no map locations.`)
      : pins.length === count ? `${count} matching ${count === 1 ? 'organisation' : 'organisations'} on the map.`
      : `${pins.length} of ${count} matching organisations have map locations.`;
    $('mapFilterDirectory').hidden = count === pins.length;
  }

  const source = map?.getSource(clusterSourceId);
  if (!source) return;
  const groups = new Map();
  for (const org of pins) {
    const key = `${org.lng.toFixed(6)},${org.lat.toFixed(6)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(org);
  }
  pointGroups = groups;
  const signature = JSON.stringify([...groups].map(([key, rows]) => [key, rows.map(org => [org.id, org.name, org.type, org.city])]));
  if (signature === clusterSignature) return;
  clusterSignature = signature;
  clusterRevision++;
  if ($('mapClusterDialog').open) $('mapClusterDialog').close();
  source.setData({ type: 'FeatureCollection', features: [...groups].map(([key, organisations]) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: key.split(',').map(Number) },
    properties: { group: key, count: organisations.length, revision: clusterRevision }
  })) });
}

function organisationPin(org) {
  const type = (org.type || '').toLowerCase();
  const category = ['hospital', 'startup', 'investor', 'hub'].find(value => type.includes(value))
    || (type.includes('accelerator') ? 'hub' : '');
  const button = el('button', 'map-pin' + (org.id === 'seed-1' ? ' tcl-pin' : category ? ' type-' + category : ''));
  button.type = 'button';
  button.title = org.name;
  button.dataset.organisationId = String(org.id);
  button.addEventListener('click', event => {
    window.MCHMeasure?.('map_pin_open');
    show(shown.find(row => row.id === org.id) || org, true, event.detail === 0);
  });
  return button;
}

async function openCluster(button, properties, coordinates) {
  const request = ++clusterRequest;
  const dialog = $('mapClusterDialog');
  const title = $('mapClusterTitle');
  const list = $('mapClusterList');
  const status = $('mapClusterStatus');
  const zoom = $('mapClusterZoom');
  const search = $('mapClusterSearch');
  const searchField = $('mapClusterSearchField');
  const count = properties.count;
  title.textContent = `${count} organisations`;
  status.textContent = 'Loading organisations…';
  list.replaceChildren();
  zoom.hidden = true;
  zoom.onclick = null;
  search.value = '';
  search.oninput = null;
  searchField.hidden = true;
  dismissOrganisationCard();
  dialog.onclose = () => {
    if (document.activeElement === document.body) {
      (button.isConnected ? button : $('mapRegion')).focus({ preventScroll: true });
    }
  };
  dialog.showModal();

  try {
    const source = map.getSource(clusterSourceId);
    const groups = properties.cluster
      ? (await source.getClusterLeaves(properties.cluster_id, properties.point_count, 0)).map(leaf => leaf.properties.group)
      : [properties.group];
    if (!dialog.open || request !== clusterRequest || properties.revision !== clusterRevision) return;
    const organisations = groups.flatMap(key => pointGroups.get(key) || []).sort((a, b) => a.name.localeCompare(b.name));
    const rows = organisations.map(org => {
      const row = el('li');
      const select = el('button', 'cluster-organisation');
      select.type = 'button';
      select.append(el('strong', '', org.name));
      const detail = [org.type, org.city || org.country].filter(Boolean).join(' · ');
      if (detail) select.append(el('span', '', detail));
      select.addEventListener('click', () => {
        dialog.close();
        window.MCHMeasure?.('map_pin_open');
        show(org, true, true, button);
      });
      row.append(select);
      return { row, text: normalise([org.name, org.type, org.city, org.country].filter(Boolean).join(' ')) };
    });
    list.append(...rows.map(({ row }) => row));
    searchField.hidden = rows.length < 10;
    search.oninput = () => {
      const words = normalise(search.value.trim()).split(/\s+/).filter(Boolean);
      let matches = 0;
      for (const { row, text } of rows) {
        row.hidden = !words.every(word => text.includes(word));
        if (!row.hidden) matches++;
      }
      list.scrollTop = 0;
      status.textContent = !words.length ? '' : matches === 0 ? 'No organisations in this group match your search.'
        : `${matches} of ${rows.length} organisations`;
    };
    status.textContent = '';
    if (!properties.cluster) return;
    const level = await source.getClusterExpansionZoom(properties.cluster_id);
    if (!dialog.open || request !== clusterRequest || properties.revision !== clusterRevision) return;
    zoom.hidden = false;
    zoom.onclick = () => {
      dialog.close();
      $('mapRegion').focus({ preventScroll: true });
      map.easeTo({ center: coordinates, zoom: level,
        duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450, essential: false });
    };
  } catch {
    if (dialog.open && request === clusterRequest && !list.children.length) {
      status.textContent = 'This group could not be loaded. Close it and try again.';
    }
  }
}

function renderMapMarkers() {
  if (!map?.getSource(clusterSourceId)) return;
  const visible = new Set();
  const bounds = map.getBounds();
  const features = map.querySourceFeatures(clusterSourceId);
  for (const { geometry, properties } of features) {
    if (properties.revision !== clusterRevision || !bounds.contains(geometry.coordinates)) continue;
    const org = pointGroups.get(properties.group)?.[0];
    if (properties.count === 1 && org?.id === selectedMapOrganisation?.id) continue;
    const key = properties.cluster ? 'cluster:' + properties.cluster_id : 'group:' + properties.group;
    renderMarker(key, geometry.coordinates, properties, org);
  }
  if (selectedMapOrganisation) {
    const org = selectedMapOrganisation;
    renderMarker('selected:' + org.id, [org.lng, org.lat], { count: 1 }, org);
  }
  for (const [key, marker] of markers) {
    if (visible.has(key)) continue;
    const focused = marker.getElement() === document.activeElement;
    marker.remove();
    markers.delete(key);
    if (focused) {
      const id = selectedMapOrganisation?.id;
      (markers.get(clusterRevision + ':selected:' + id)?.getElement() || $('mapRegion')).focus({ preventScroll: true });
    }
  }

  function renderMarker(key, coordinates, properties, org) {
    key = clusterRevision + ':' + key;
    if (visible.has(key)) return;
    visible.add(key);
    if (markers.has(key)) return;
    const group = properties.count > 1;
    if (!group && !org) return;
    const button = group ? el('button', 'map-cluster', String(properties.count)) : organisationPin(org);
    if (group) {
      button.type = 'button';
      button.setAttribute('aria-haspopup', 'dialog');
      button.addEventListener('click', () => openCluster(button, properties, coordinates));
    }
    const marker = new maplibregl.Marker({ element: button }).setLngLat(coordinates).addTo(map);
    button.setAttribute('aria-label', group ? `Browse ${properties.count} organisations in this area`
      : `Show ${org.name}${org.city ? ' in ' + org.city : ''} on map`);
    if (group) button.removeAttribute('aria-pressed');
    else button.setAttribute('aria-pressed', String(org.id === selectedMapOrganisation?.id));
    if (!group && org.id === selectedMapOrganisation?.id) button.classList.add('is-selected');
    markers.set(key, marker);
  }
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

function render(preserveExpanded = false) {
  const root = $('results');
  if (!root) {
    updateMarkers();
    return;
  }
  const expanded = preserveExpanded
    ? new Set([...root.querySelectorAll('details.entry[open]')].map(card => card.id))
    : new Set();
  const focusedId = preserveExpanded ? document.activeElement?.closest('details.entry')?.id : null;
  root.replaceChildren();

  const countText = activeRelation
    ? 'Showing ' + shown.length + ' portfolio companies backed by ' + activeRelation
    : shown.length + (shown.length === 1 ? ' organisation' : ' organisations');

  if ($('count')) $('count').textContent = countText;
  if ($('mobileCount')) $('mobileCount').textContent = shown.length;

  if (!shown.length) {
    const empty = el('div', 'empty-state');
    empty.append(el('p', '', 'No organisations match your search.'));
    if (window.MCHOrganisationModel.toSearch(filterState).size) {
      const clear = el('button', 'btn-secondary', 'Clear search and filters');
      clear.type = 'button';
      clear.addEventListener('click', () => {
        clearAllFilters();
        $('search')?.focus();
      });
      empty.append(clear);
    }
    root.append(empty);
  }

  shown.forEach(org => {
    const card = el('details', 'entry');
    card.id = 'card-' + org.id;
    card.open = expanded.has(card.id);

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
    appendProfileLink(links, org);
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
        mapLink.href = ecosystemUrl('map', window.MCHOrganisationModel.toSearch(filterState), org.id);
        links.append(mapLink);
      }
    }

    if(window.MCHOrganisationTeam)body.append(window.MCHOrganisationTeam.card(org, card));
    const workspace = el('a', 'text-link', 'Associations & sharing');
    workspace.href = 'organisation-management.html?org=' + encodeURIComponent(org.id);
    links.append(workspace);
    if(window.MCHOrganisationLogos)links.append(window.MCHOrganisationLogos.managementLink(org));

    links.append(shareListing(org), suggestListingCorrection(org));
    body.append(links);
    root.append(card);
    if (card.id === focusedId) summary.focus({preventScroll: true});
  });

  updateMarkers();
}

function ecosystemUrl(view, query, organisation) {
  const onMainSite = ['thechildlens.com', 'www.thechildlens.com'].includes(location.hostname);
  const mapPath = onMainSite ? '/map/' : './';
  const directoryPath = onMainSite ? '/directory/' : 'directory.html';
  const params = new URLSearchParams(query);
  if (organisation) params.set('organisation', organisation);
  return (view === 'map' ? mapPath : directoryPath) + (params.size ? '?' + params : '');
}

function syncViewLinks(query) {
  const organisation = selectedMapOrganisation?.id || new URLSearchParams(location.search).get('organisation');
  for (const link of document.querySelectorAll('a[data-ecosystem-view]')) {
    link.href = ecosystemUrl(link.dataset.ecosystemView, query, organisation);
  }
}

function restoreFilterControls() {
  if ($('search')) $('search').value = filterState.q;
  for (const key of window.MCHOrganisationModel.multiKeys) {
    const select = $(key);
    if (!select) continue;
    const requested = select.multiple ? filterState[key] : filterState[key].slice(0, 1);
    for (const value of requested) {
      if (![...select.options].some(option => option.value === value)) {
        select.append(new Option(value + ' (not in current data)', value));
      }
    }
    if (select.multiple) {
      for (const option of select.options) option.selected = requested.includes(option.value);
    } else select.value = requested[0] ?? '';
  }
}

function filter(syncUrl = true) {
  activeRelation = null;
  for (const key of window.MCHOrganisationModel.filterKeys) {
    const input = $(key === 'q' ? 'search' : key);
    if (input) filterState[key] = input.multiple ? [...input.selectedOptions].map(option => option.value).filter(Boolean) : input.value.trim();
  }
  const {type,country,focus,technology,stage} = filterState;
  shown = window.MCHOrganisationModel.filterRows(all, filterState);
  const query = window.MCHOrganisationModel.toSearch(filterState);
  if (syncUrl) {
    const url = new URL(location.href);
    url.searchParams.delete('organisation');
    for (const key of window.MCHOrganisationModel.filterKeys) url.searchParams.delete(key);
    for (const [key, value] of query) url.searchParams.append(key, value);
    history.replaceState(null, '', url);
  }
  const hasFilters = query.size > 0;
  syncViewLinks(query);
  if ($('clearMapFilters')) $('clearMapFilters').hidden = !hasFilters;
  if ($('filteredDirectory')) {
    $('filteredDirectory').hidden = !hasFilters;
    $('filteredDirectory').textContent = `View ${shown.length} ${window.MCHOrganisationModel.categoryLabel(type, shown.length)} in the directory`;
  }

  const active = [type,country,focus,technology,stage].reduce((sum,value)=>sum+(Array.isArray(value)?value.length:Number(Boolean(value))),0);
  if ($('filterCount')) $('filterCount').textContent = active ? '(' + active + ')' : '';
  document.querySelectorAll('.legend-item[data-type]').forEach(button => button.setAttribute('aria-pressed', String((Array.isArray(type)?type:[type]).includes(button.dataset.type))));
  render(!syncUrl);
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

const cameraKey = 'mch-map-camera';
const restoreCameraKey = 'mch-map-return';

function takeSavedCamera() {
  try {
    if (sessionStorage.getItem(restoreCameraKey) !== '1') return null;
    sessionStorage.removeItem(restoreCameraKey);
    const camera = JSON.parse(sessionStorage.getItem(cameraKey));
    if (!camera || ![camera.lng, camera.lat, camera.zoom, camera.bearing, camera.pitch].every(Number.isFinite)) return null;
    if (Math.abs(camera.lat) > 90 || camera.zoom < 0 || camera.zoom > 22 || camera.pitch < 0 || camera.pitch > 85) return null;
    return { center: [camera.lng, camera.lat], zoom: camera.zoom, bearing: camera.bearing, pitch: camera.pitch };
  } catch { return null; }
}

document.addEventListener('click', event => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href]');
  if (!link) return;
  try {
    if (map && link.matches('[data-ecosystem-view="directory"], [data-remember-map]')) {
      const { lng, lat } = map.getCenter();
      sessionStorage.setItem(cameraKey, JSON.stringify({
        lng, lat, zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch()
      }));
    } else if (document.body.classList.contains('directory-page') && link.matches('.ecosystem-switch [data-ecosystem-view="map"]')) {
      sessionStorage.setItem(restoreCameraKey, '1');
    }
  } catch { /* The links also work with storage disabled. */ }
}, { capture: true });

function initMap() {
  if (!window.maplibregl) {
    if ($('mapFallback')) $('mapFallback').hidden = false;
    return;
  }
  try {
    const width = $('map').clientWidth;
    map = new maplibregl.Map({
      container: 'map',
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [-27, 37],
      zoom: width > 0 && width < 840 ? Math.max(0, 1.7 + Math.log2(width / 840)) : 1.7,
      ...savedCamera
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', async () => {
      map.addSource(clusterSourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 52,
        clusterMaxZoom: 16,
        clusterProperties: { count: ['+', ['get', 'count']], revision: ['max', ['get', 'revision']] }
      });
      map.addLayer({ id: clusterSourceId, source: clusterSourceId, type: 'circle', paint: { 'circle-opacity': 0 } });
      map.on('render', renderMapMarkers);
      updateMarkers();
      const background = map.getStyle()?.layers?.find(layer => layer.type === 'background');
      if (!background) return;
      const patternUrl = location.hostname === 'thechildlens.com' || location.hostname === 'www.thechildlens.com' || location.hostname === 'localhost'
        ? '/assets/boho-pattern.jpg' : 'https://thechildlens.com/assets/boho-pattern.jpg';
      try {
          const image = (await map.loadImage(patternUrl)).data;
          const tile = document.createElement('canvas');
          tile.width = tile.height = 512;
          const context = tile.getContext('2d');
          context.drawImage(image, 0, 0, 512, 512);
          map.addImage('tcl-boho', context.getImageData(0, 0, 512, 512));
          let applied = false;
          const applyLens = () => {
            const enabled = document.body.classList.contains('child-lens');
            if (enabled) { map.setPaintProperty(background.id, 'background-pattern', 'tcl-boho'); applied = true; }
            else if (applied) { map.setPaintProperty(background.id, 'background-pattern', null); applied = false; }
            document.body.classList.toggle('child-lens-map-pattern', enabled);
          };
          window.addEventListener('tcl-lens-change', applyLens);
          applyLens();
      } catch { /* The unmodified basemap remains available. */ }
    });
    map.on('error', () => { if (!map.isStyleLoaded() && $('mapFallback')) $('mapFallback').hidden = false; });
    map.on('idle', () => { if ($('mapFallback')) $('mapFallback').hidden = true; });
    if ($('mapRegion')) new ResizeObserver(() => map.resize()).observe($('mapRegion'));
    updateMarkers();
  } catch {
    map = null;
    if ($('mapFallback')) $('mapFallback').hidden = false;
  }
}

let linkedOrganisationResolved = false;
const initialView = new URLSearchParams(location.search);
const savedCamera = $('map') ? takeSavedCamera() : null;
let fitInitialFilters = !savedCamera && !initialView.has('organisation') && window.MCHOrganisationModel.toSearch(filterState).size > 0;

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
  const linkedOrganisation = params.get('organisation');
  const wasOpen = linkedOrganisation && $('card-' + linkedOrganisation)?.open;
  const organisation = linkedOrganisation && all.find(org => String(org.id) === linkedOrganisation);
  filter(false);
  if (map && fitInitialFilters && shown.some(located)) {
    fitInitialFilters = false;
    fitResults();
  }
  if (organisation && (!linkedOrganisationResolved || wasOpen)) {
    const firstOpen = !linkedOrganisationResolved;
    if (firstOpen && !savedCamera && !window.MCHOrganisationModel.toSearch(filterState).size) {
      if ($('search')) $('search').value = organisation.name;
      for (const id of ['type', 'country', 'focus', 'technology', 'stage']) if ($(id)) { if ($(id).multiple) [...$(id).options].forEach(option=>option.selected=false); else $(id).value=''; }
      filter(false);
    }
    if (firstOpen) show(organisation, true, false, null, Boolean(savedCamera));
    const card = $('card-' + linkedOrganisation);
    if (card) {
      card.open = true;
      if (firstOpen) card.scrollIntoView({block: 'nearest'});
    }
  }
  linkedOrganisationResolved = Boolean(organisation);
  if ($('status')) {
    $('status').textContent = source === 'local snapshot' ? 'Showing a saved directory copy. Some details may have changed.' : '';
  }
  return true;
}

async function init() {
  let latest;
  function showLatest(data, source) {
    if (latest?.source === 'live directory' && source === 'local snapshot') return;
    if (applyOrganisationData(data, source)) latest = {data, source, registry};
  }
  const registryRequest = loadPublicRegistry().then(loaded => {
    if (loaded && latest && latest.registry !== registry) showLatest(latest.data, latest.source);
  });
  const snapshotRequest = fetch('./data/organisations.json', {signal: AbortSignal.timeout(5000)})
    .then(async response => {
      if (response.ok) showLatest(await response.json(), 'local snapshot');
    })
    .catch(error => console.error('Local JSON fetch failed:', error));
  const liveRequest = loadLiveOrganisations().then(data => showLatest(data, 'live directory'));

  await Promise.all([snapshotRequest, liveRequest, registryRequest]);
  if (!latest) {
    if ($('status')) $('status').textContent = 'Directory unavailable';
    if ($('mapFilterResultText')) $('mapFilterResultText').textContent = 'Organisation data is unavailable right now.';
  }
  else if (!linkedOrganisationResolved && new URLSearchParams(location.search).get('organisation') && $('status')) {
    $('status').textContent = 'This listing could not be found. You can search for another organisation.';
  }
}

async function loadLiveOrganisations() {
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
      if (res.ok) return await res.json();
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

restoreFilterControls();
syncViewLinks(window.MCHOrganisationModel.toSearch(filterState));
if ($('map')) {
  // The shared headers affect the map height. Start with their final layout so
  // MapLibre clamps the restored camera against the actual viewport.
  document.addEventListener('DOMContentLoaded', () => {
    initMap();
    init();
  }, { once: true });
} else init();

// Open the existing review submission form from the profile affiliation search.
if (new URLSearchParams(location.search).get('suggest') === 'organisation') {
  document.getElementById('openSubmitModal')?.click();
}

$('clearKeyFilters')?.addEventListener('click', clearAllFilters);
