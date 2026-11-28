'use strict';
// Shared by browser filtering and the static public-data build.
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MCHOrganisationModel = api;
})(typeof window === 'object' ? window : globalThis, () => {
  const SUPABASE_URL = 'https://zbhvwduyohpiiksyjqba.supabase.co';
  // Publishable browser key only. Never put a service-role/secret key in this client.
  const SUPABASE_ANON_KEY = 'sb_publishable_P_gC6PJRohYkXn1nMBGC4A_bHKkQmef';
  // Match the anon SELECT grants. New database columns are opt-in.
  const publicFields = Object.freeze(['id','name','logo_enabled','type','stage','city','country','lat','lng','website','sourceUrl','sourceType','verification','description','technology','focus','founding_year','founding_year_source_url']);
  async function readPublicOrganisations({ timeout = 5000 } = {}) {
    const rows = [];
    const ids = new Set();
    let total;
    do {
      const query = new URLSearchParams({
        select: publicFields.join(','), order: 'id.asc', limit: '250', offset: String(rows.length)
      });
      const response = await fetch(`${SUPABASE_URL}/rest/v1/organisations?${query}`, {
        headers: { apikey: SUPABASE_ANON_KEY, Prefer: 'count=exact' },
        signal: AbortSignal.timeout(timeout)
      });
      if (!response.ok) throw new Error(`Public directory returned HTTP ${response.status}`);
      const page = await response.json();
      const range = response.headers.get('Content-Range')?.match(/^(?:(\d+)-(\d+)|\*)\/(\d+)$/);
      const count = range && Number(range[3]);
      if (!Array.isArray(page) || !count || (total !== undefined && count !== total) ||
          Number(range[1]) !== rows.length || Number(range[2]) !== rows.length + page.length - 1 ||
          !page.length || rows.length + page.length > count) {
        throw new Error('The public directory response is empty or changed during pagination');
      }
      for (const row of page) {
        if (!row?.id || ids.has(row.id)) throw new Error('Missing or duplicate public organisation ID');
        ids.add(row.id);
        rows.push(row);
      }
      total = count;
    } while (rows.length < total);
    return rows;
  }

  const filterKeys = Object.freeze(['q','type','country','focus','technology','stage','area','group']);
  const multiKeys = Object.freeze(['type','country','focus','technology','stage']);
  const normalise = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function foundingLabel(org) {
    const year=org.founding_year;
    if(!Number.isInteger(year)||year<1000||year>new Date().getFullYear())return '';
    try{const source=new URL(org.founding_year_source_url);if(source.protocol!=='https:'||source.username||source.password)return '';}catch{return '';}
    return `Founded ${year}`;
  }
  const wrapLongitude = lng => ((lng + 180) % 360 + 360) % 360 - 180;
  function readArea(value) {
    if (typeof value !== 'string') return null;
    const fields = value.split(',');
    if (fields.length !== 4 || fields.some(field => !field.trim())) return null;
    const [west, south, east, north] = fields.map(Number);
    if (![west, south, east, north].every(Number.isFinite) || west < -180 || west > 180 ||
        east <= west || east > west + 360 + 1e-9 || south < -90 || north > 90 || north <= south) return null;
    return [west, south, east, north];
  }
  function areaFromBounds(bounds) {
    const west = wrapLongitude(bounds.getWest());
    const span = Math.min(360, bounds.getEast() - bounds.getWest());
    const fields = [west, Math.max(-90, bounds.getSouth()), west + span, Math.min(90, bounds.getNorth())];
    const value = fields.map(field => field.toFixed(6)).join(',');
    return readArea(value) ? value : '';
  }
  function fromSearch(search) {
    const params = new URLSearchParams(search);
    const values = Object.fromEntries(filterKeys.map(key => [key, multiKeys.includes(key) ? params.getAll(key).filter(Boolean) : params.get(key) || '']));
    if (!readArea(values.area)) values.area = '';
    values.group = [...readGroup(values.group)].join(',');
    return values;
  }
  function toSearch(values) {
    const params = new URLSearchParams();
    for (const key of filterKeys) if (values[key]) for (const value of Array.isArray(values[key]) ? values[key] : [values[key]]) params.append(key, value.trim());
    return params;
  }
  function readGroup(value) {
    const ids = typeof value === 'string' ? value.split(',') : [];
    return new Set(ids.filter(id => /^[a-z0-9][a-z0-9_-]*$/.test(id)));
  }
  function filterRows(rows, values) {
    const q = normalise(values.q?.trim());
    const area = readArea(values.area);
    const group = readGroup(values.group);
    const choices = key => Array.isArray(values[key]) ? values[key].filter(Boolean) : values[key] ? [values[key]] : [];
    const types=choices('type'),countries=choices('country'),focuses=choices('focus'),technologies=choices('technology'),stages=choices('stage');
    return rows.filter(org =>
      (!area || inArea(org, area)) &&
      (!group.size || group.has(String(org.id))) &&
      (!types.length || types.includes(org.type) || (types.includes('hub') && ['Innovation hub','Accelerator'].includes(org.type))) &&
      (!countries.length || countries.includes(org.country)) &&
      (!focuses.length || (org.focus || []).some(value => focuses.includes(value))) &&
      (!technologies.length || [...(org.technology || []), ...(org.registryTechnology || [])].some(value => technologies.includes(value))) &&
      (!stages.length || stages.includes(org.stage)) &&
      (!q || normalise([org.name,org.city,org.country,org.type,org.stage,org.description,...(org.focus || []),...(org.technology || []),...(org.registryTechnology || [])].filter(Boolean).join(' ')).includes(q))
    );
  }
  function inArea(org, [west, south, east, north]) {
    if (!Number.isFinite(org.lat) || !Number.isFinite(org.lng) || Math.abs(org.lng) > 180) return false;
    const offset = (wrapLongitude(org.lng) - west + 360) % 360;
    return org.lat >= south && org.lat <= north && offset <= east - west;
  }
  function categoryLabel(type, count) {
    if (Array.isArray(type)) type=type.length===1?type[0]:'';
    const names = {"Children's hospital":['hospital','hospitals'],Startup:['startup','startups'],Investor:['investor','investors'],hub:['hub / accelerator','hubs / accelerators'],'Innovation hub':['innovation hub','innovation hubs'],Accelerator:['accelerator','accelerators']};
    return (names[type] || ['organisation','organisations'])[count === 1 ? 0 : 1];
  }
  return Object.freeze({publicFields,readPublicOrganisations,SUPABASE_URL,SUPABASE_ANON_KEY,filterKeys,multiKeys,fromSearch,toSearch,filterRows,readArea,areaFromBounds,categoryLabel,foundingLabel});
});
