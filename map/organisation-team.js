'use strict';
(()=>{
 const data=fetch('data/organisation-team.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>[]);
 function card(org){const section=document.createElement('section');section.className='organisation-team-summary';const heading=document.createElement('h3');heading.textContent='Team';const link=document.createElement('a');link.href='team.html?org='+encodeURIComponent(org.id);link.textContent='Claim this organisation';section.append(heading,link);
 data.then(rows=>{const founders=Array.isArray(rows)?rows.filter(row=>row.organisationId===String(org.id)):[];if(founders.length)link.textContent=founders.map(row=>row.name+' · '+row.role).join('; ');});return section;}
 window.MCHOrganisationTeam={card};
})();
