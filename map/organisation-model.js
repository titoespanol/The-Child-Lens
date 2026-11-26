'use strict';
// Shared by browser filtering and the static public-data build.
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MCHOrganisationModel = api;
})(typeof window === 'object' ? window : globalThis, () => {
  const publicFields = Object.freeze(['id','name','logo_enabled','type','stage','city','country','lat','lng','website','sourceUrl','sourceType','verification','description','technology','focus','founding_year','founding_year_source_url']);
  const filterKeys = Object.freeze(['q','type','country','focus','technology','stage','area']);
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
    return values;
  }
  function toSearch(values) {
    const params = new URLSearchParams();
    for (const key of filterKeys) if (values[key]) for (const value of Array.isArray(values[key]) ? values[key] : [values[key]]) params.append(key, value.trim());
    return params;
  }
  function filterRows(rows, values) {
    const q = normalise(values.q?.trim());
    const area = readArea(values.area);
    const choices = key => Array.isArray(values[key]) ? values[key].filter(Boolean) : values[key] ? [values[key]] : [];
    const types=choices('type'),countries=choices('country'),focuses=choices('focus'),technologies=choices('technology'),stages=choices('stage');
    return rows.filter(org =>
      (!area || inArea(org, area)) &&
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
  return Object.freeze({publicFields,filterKeys,multiKeys,fromSearch,toSearch,filterRows,readArea,areaFromBounds,categoryLabel,foundingLabel});
});
