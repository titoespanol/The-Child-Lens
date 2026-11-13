'use strict';
// Shared by browser filtering and the static public-data build.
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MCHOrganisationModel = api;
})(typeof window === 'object' ? window : globalThis, () => {
  const publicFields = Object.freeze(['id','name','logo_enabled','type','stage','city','country','lat','lng','website','sourceUrl','sourceType','verification','description','technology','focus','founding_year','founding_year_source_url']);
  const filterKeys = Object.freeze(['q','type','country','focus','technology','stage']);
  const multiKeys = Object.freeze(['type','country','focus','technology','stage']);
  const normalise = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function foundingLabel(org) {
    const year=org.founding_year;
    if(!Number.isInteger(year)||year<1000||year>new Date().getFullYear())return '';
    try{const source=new URL(org.founding_year_source_url);if(source.protocol!=='https:'||source.username||source.password)return '';}catch{return '';}
    return `Founded ${year}`;
  }
  const fromSearch = search => { const params = new URLSearchParams(search); return Object.fromEntries(filterKeys.map(key => [key, multiKeys.includes(key) ? params.getAll(key).filter(Boolean) : params.get(key) || ''])); };
  function toSearch(values) {
    const params = new URLSearchParams();
    for (const key of filterKeys) if (values[key]) for (const value of Array.isArray(values[key]) ? values[key] : [values[key]]) params.append(key, value.trim());
    return params;
  }
  function filterRows(rows, values) {
    const q = normalise(values.q?.trim());
    const choices = key => Array.isArray(values[key]) ? values[key].filter(Boolean) : values[key] ? [values[key]] : [];
    const types=choices('type'),countries=choices('country'),focuses=choices('focus'),technologies=choices('technology'),stages=choices('stage');
    return rows.filter(org =>
      (!types.length || types.includes(org.type) || (types.includes('hub') && ['Innovation hub','Accelerator'].includes(org.type))) &&
      (!countries.length || countries.includes(org.country)) &&
      (!focuses.length || (org.focus || []).some(value => focuses.includes(value))) &&
      (!technologies.length || [...(org.technology || []), ...(org.registryTechnology || [])].some(value => technologies.includes(value))) &&
      (!stages.length || stages.includes(org.stage)) &&
      (!q || normalise([org.name,org.city,org.country,org.type,org.stage,org.description,...(org.focus || []),...(org.technology || []),...(org.registryTechnology || [])].filter(Boolean).join(' ')).includes(q))
    );
  }
  function categoryLabel(type, count) {
    if (Array.isArray(type)) type=type.length===1?type[0]:'';
    const names = {"Children's hospital":['hospital','hospitals'],Startup:['startup','startups'],Investor:['investor','investors'],hub:['hub / accelerator','hubs / accelerators'],'Innovation hub':['innovation hub','innovation hubs'],Accelerator:['accelerator','accelerators']};
    return (names[type] || ['organisation','organisations'])[count === 1 ? 0 : 1];
  }
  return Object.freeze({publicFields,filterKeys,multiKeys,fromSearch,toSearch,filterRows,categoryLabel,foundingLabel});
});
