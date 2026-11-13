import { formatUiDate } from './ui-dates.mjs';

'use strict';
const root = document.getElementById('networkResults'), status = document.getElementById('networkStatus'), search = document.getElementById('networkSearch');
const state = {view:'events', events:[], people:[], projects:[], organisations:[], errors:new Set(), loading:true};
const labels = {events:'event',people:'person',projects:'project'};
const make = (tag, text) => { const node = document.createElement(tag); node.textContent = text || ''; return node; };
const orgName = id => state.organisations.find(org => org.id === id)?.name || 'Organisation under review';
const normalise = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function sourceLink(url, label='Public source ↗') { try { const parsed = new URL(url); if (parsed.protocol !== 'https:') return null; const link = make('a',label); link.className='text-link'; link.href=parsed.href; link.rel='noopener noreferrer'; return link; } catch { return null; } }
function card(item) {
 const c = make('article'); c.className='entry';
 if (state.view === 'events') {
  c.append(make('h2',item.name),make('p',[formatUiDate(item.date),item.venue,item.city,item.country].filter(Boolean).join(' | ')),make('p',item.description));
  if (item.organisationIds?.length) { c.append(make('h3','Organisations reported as represented')); const list=make('ul'); item.organisationIds.forEach(id=>list.append(make('li',orgName(id)))); c.append(list); }
  c.append(make('p','Participation: user-reported. Individual attendance is not verified.'));
 } else if (state.view === 'people') {
  c.append(make('h2',item.name),make('p',item.headline)); (item.organisationAffiliations||[]).forEach(a=>c.append(make('p',orgName(a.organisationId)+' | '+a.role)));
 } else {
  c.append(make('h2',item.title),make('p',[item.stage,item.organisationId?orgName(item.organisationId):null].filter(Boolean).join(' | ')),make('p',item.publicSummary));
  const contact=make('a','Discuss your project with The Child Lens');contact.className='venture-contact';contact.href='mailto:team@thechildlens.com?subject='+encodeURIComponent('Venture support enquiry: '+item.title);c.append(contact);
 }
 const source=sourceLink(item.sourceUrl);if(source)c.append(source);if(item.verification)c.append(make('p','Review status: '+item.verification));return c;
}
function render() {
 root.replaceChildren();if(state.loading){status.textContent='Loading network…';return;}if(state.errors.has(state.view)){status.textContent='This collection could not load. Please refresh to try again.';return;}
 const q=normalise(search.value.trim());const items=state[state.view].filter(item=>normalise([item.name,item.title,item.headline,item.description,item.publicSummary,item.stage,item.city,item.country,...(item.organisationIds||[]).map(orgName),item.organisationId?orgName(item.organisationId):'',...(item.organisationAffiliations||[]).map(a=>orgName(a.organisationId)+' '+a.role)].join(' ')).includes(q));
 status.textContent=items.length+' '+(items.length===1?labels[state.view]:state.view)+(state.errors.has('organisations')?' | Organisation details temporarily unavailable':'');
 if(!items.length){const empty=make('div');empty.className='empty-state';empty.append(make('h2',q?'No matching records':state.view==='people'?'People are coming into focus':state.view==='projects'?'Help surface the next child-first venture':'No public events yet'),make('p',q?'Try a different name, organisation or focus.':state.view==='projects'?'We are building a source-backed collection of pre-spinout research. If your team is working on a child-first project, we would like to hear from you.':'Records will appear here once their public sources have been reviewed.'));const link=make('a',state.view==='projects'?'Tell The Child Lens about your project ↗':'Suggest a record ↗');link.className='text-link';link.href='mailto:team@thechildlens.com?subject='+encodeURIComponent('Mapping children’s health: '+state.view);empty.append(link);root.append(empty);}items.forEach(item=>root.append(card(item)));
}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{state.view=button.dataset.view;document.querySelectorAll('[data-view]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab===button)));search.value='';render();}));search.addEventListener('input',render);
Promise.all(['events','people','projects','organisations'].map(async name=>{try{const response=await fetch('./data/'+name+'.json');if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data))throw Error();state[name]=data;}catch{state.errors.add(name);}})).then(()=>{state.loading=false;render();});
