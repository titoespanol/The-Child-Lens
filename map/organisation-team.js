'use strict';
(() => {
  const supabase = 'https://zbhvwduyohpiiksyjqba.supabase.co';
  const apikey = 'sb_publishable_P_gC6PJRohYkXn1nMBGC4A_bHKkQmef';
  let publishedTeam;
  const inFlight = new Map();

  function node(tag, text, attrs = {}) {
    const element = document.createElement(tag);
    element.textContent = text;
    return Object.assign(element, attrs);
  }

  async function read(response) {
    const result = await response;
    if (!result.ok) throw new Error('Team data is unavailable.');
    const rows = await result.json();
    if (!Array.isArray(rows)) throw new Error('Invalid team data.');
    return rows;
  }

  function sourceUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  }

  function key(name) {
    return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function roster(published, affiliations) {
    const remaining = affiliations.filter(row => typeof row.name === 'string' && row.name.trim());
    const members = [];
    const listed = new Set();
    for (const row of published) {
      const url = sourceUrl(row.sourceUrl);
      if (!url || typeof row.name !== 'string' || !row.name.trim()) continue;
      const name = key(row.name);
      if (listed.has(name)) continue;
      listed.add(name);
      const matching = remaining.filter(person => key(person.name) === name);
      const member = {name: row.name, role: row.role, sourceUrl: url};
      if (matching.length === 1) {
        const match = matching[0];
        member.photoPath = match.photoPath;
        member.photoUrl = match.photoUrl;
        remaining.splice(remaining.indexOf(match), 1);
      }
      members.push(member);
    }
    return members.concat(remaining.map(row => ({
      name: row.name, role: row.role, affiliation: 'Self-reported affiliation',
      photoPath: row.photoPath, photoUrl: row.photoUrl
    })));
  }

  function load(id) {
    id = String(id);
    if (inFlight.has(id)) return inFlight.get(id);
    publishedTeam ??= read(fetch('data/organisation-team.json?v=20261119-account-team', {signal: AbortSignal.timeout(5000)}))
      .catch(error => { publishedTeam = null; throw error; });
    const affiliations = read(fetch(`${supabase}/rest/v1/rpc/list_public_affiliations`, {
      method: 'POST', headers: {apikey, 'Content-Type': 'application/json'},
      body: JSON.stringify({p_org: id}), cache: 'no-store', signal: AbortSignal.timeout(5000)
    }));
    const request = Promise.allSettled([publishedTeam, affiliations]).then(([published, shared]) => {
      const sourced = published.status === 'fulfilled'
        ? published.value.filter(row => String(row.organisationId) === id) : [];
      return {
        members: roster(sourced, shared.status === 'fulfilled' ? shared.value : []),
        complete: published.status === 'fulfilled' && shared.status === 'fulfilled'
      };
    }).finally(() => inFlight.delete(id));
    inFlight.set(id, request);
    return request;
  }

  function list(members) {
    const list = node('ul', '', {className: 'organisation-team-members'});
    for (const member of members) {
      const row = node('li', '');
      const label = node('span', [member.name, member.role].filter(Boolean).join(' · '));
      if (member.affiliation) label.append(node('small', member.affiliation));
      if (member.sourceUrl) label.append(node('a', 'Public source', {href: member.sourceUrl}));
      row.append(label);
      list.append(row);
      showAvatar(row, member);
    }
    return list;
  }

  function showAvatar(row, member) {
    const path = typeof member.photoPath === 'string' && member.photoPath.match(
      /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/avatar\.jpg$/i);
    const providerUrl = sourceUrl(member.photoUrl);
    if (path) {
      fetch(`${supabase}/storage/v1/object/authenticated/member-avatars/${path[1]}/avatar.jpg`, {
        headers: {apikey}, cache: 'no-store', signal: AbortSignal.timeout(5000)
      }).then(async response => {
        if (!response.ok) return;
        const blob = await response.blob();
        if (row.isConnected && blob.type === 'image/jpeg' && blob.size && blob.size <= 1048576) {
          appendAvatar(row, URL.createObjectURL(blob), true);
        }
      }).catch(() => {});
    } else if (providerUrl) {
      const url = new URL(providerUrl);
      const domains = ['googleusercontent.com', 'licdn.com', 'licdn-ei.com'];
      if (!url.port && domains.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) {
        appendAvatar(row, url.href);
      }
    }
  }

  function appendAvatar(row, src, isBlob = false) {
    const image = node('img', '', {alt: '', width: 40, height: 40, referrerPolicy: 'no-referrer'});
    if (isBlob) image.onload = () => URL.revokeObjectURL(src);
    else image.loading = 'lazy';
    image.onerror = () => {
      if (isBlob) URL.revokeObjectURL(src);
      image.remove();
    };
    image.src = src;
    row.prepend(image);
  }

  function card(org, parentDetails) {
    const section = node('section', '', {className: 'organisation-team-summary'});
    const link = node('a', 'View team', {href: 'team.html?org=' + encodeURIComponent(org.id)});
    link.setAttribute('aria-label', `View ${org.name} team`);
    section.append(link);
    let loading = false;
    let rendered = false;
    async function update() {
      if (loading || rendered) return;
      loading = true;
      try {
        const {members, complete} = await load(org.id);
        if (!section.isConnected) return;
        link.textContent = members.length || !complete ? 'View team' : 'Claim this organisation';
        link.setAttribute('aria-label', members.length || !complete ? `View ${org.name} team` : `Claim ${org.name}`);
        rendered = complete;
        if (!members.length) return;
        if (complete && members.length > 3) {
          const disclosure = node('details', '', {className: 'organisation-team-disclosure'});
          disclosure.append(node('summary', 'Team'), link);
          disclosure.addEventListener('toggle', function showTeam() {
            if (!disclosure.open) return;
            link.before(list(members));
            disclosure.removeEventListener('toggle', showTeam);
          });
          section.replaceChildren(disclosure);
        } else section.replaceChildren(node('h3', 'Team'), list(members), link);
      } finally { loading = false; }
    }
    if (parentDetails) {
      parentDetails.addEventListener('toggle', () => { if (parentDetails.open) update(); });
    } else update();
    return section;
  }

  window.MCHOrganisationTeam = {card, load, list};
})();
