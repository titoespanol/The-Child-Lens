'use strict';
// Enhance the existing native filter controls; their listeners and URL state stay authoritative.
(()=>{
 const search=document.getElementById('search');if(!search)return;
 const keys=[['type','Type'],['focus','Specialty'],['technology','Product / innovation sector'],['country','Country'],['stage','Stage']];
 const selects=keys.map(([key,label])=>({key,label,select:document.getElementById(key)})).filter(item=>item.select);
 const map=document.body.classList.contains('map-page'),host=map?document.getElementById('mapRegion'):document.getElementById('directory');
 if(!host)return;
 const make=(tag,text,attrs={})=>{const n=document.createElement(tag);n.textContent=text||'';Object.assign(n,attrs);return n;};
 const bar=make('section','',{className:'discovery-filters'});bar.setAttribute('aria-label','Search and filter organisations');
 if(map){const heading=host.querySelector('.discovery-heading');if(heading)bar.append(heading);}
 const searchWrap=make('div','',{className:'discovery-search'}),label=make('label','Search organisations',{htmlFor:'search',className:'sr-only'});
 const oldLabel=search.closest('label')||document.querySelector('label[for="search"]');if(oldLabel){oldLabel.hidden=true;oldLabel.removeAttribute('for');}
 search.placeholder='Name, place or specialty';searchWrap.append(label,search);bar.append(searchWrap);
 const chips=make('div','',{className:'filter-chip-row'});chips.setAttribute('aria-label','Filter categories');bar.append(chips);
 const active=make('div','',{className:'active-filter-row'});active.setAttribute('aria-label','Active filters');bar.append(active);
 const clear=make('button','Clear all',{type:'button',className:'filter-clear'});clear.onclick=()=>document.getElementById(map?'clearMapFilters':'reset')?.click();
 const dialog=make('dialog','',{className:'filter-picker'});dialog.setAttribute('aria-labelledby','filterPickerTitle');document.body.append(dialog);
 let originButton;
 dialog.addEventListener('close',()=>originButton?.focus());
 function choose(item){
  originButton=item.button;dialog.replaceChildren();
  const header=make('div','',{className:'filter-picker-header'}),title=make('h2',item.label,{id:'filterPickerTitle'}),done=make('button','Done',{type:'button',className:'btn-primary'});done.onclick=()=>dialog.close();header.append(title,done);dialog.append(header);
  const hint=make('p','Choose more than one. Your results update as you select.',{className:'filter-picker-hint'});dialog.append(hint);
  const findLabel=make('label','Find a '+item.label.toLowerCase(),{className:'sr-only',htmlFor:'filterOptionSearch'}),find=make('input','',{id:'filterOptionSearch',type:'search',placeholder:'Search '+item.label.toLowerCase(),autocomplete:'off'});dialog.append(findLabel,find);
  const list=make('div','',{className:'filter-options'});dialog.append(list);
  function renderOptions(focusValue){list.replaceChildren();const q=find.value.trim().toLowerCase();
   const options=[...item.select.options].filter(option=>option.value&&!option.disabled&&(!q||option.textContent.toLowerCase().includes(q)));
   if(!options.length)list.append(make('p','No matching choices. Try another search.'));
   for(const option of options){const selected=[...item.select.selectedOptions].some(current=>current.value===option.value);const b=make('button','',{type:'button',className:'filter-option'});b.append(make('span',option.value==='hub'?'Hubs & accelerators':option.textContent,{className:'filter-option-label'}),make('span',selected?'✓':'',{className:'filter-option-check'}));b.setAttribute('aria-pressed',String(selected));b.setAttribute('aria-label',(option.value==='hub'?'Hubs & accelerators':option.textContent)+(selected?', selected':''));b.onclick=()=>{option.selected=!selected;item.select.dispatchEvent(new Event('change',{bubbles:true}));renderOptions(option.value);};list.append(b);if(option.value===focusValue)b.focus();}
  }
  find.oninput=renderOptions;renderOptions();dialog.showModal();if(window.matchMedia('(max-width:840px)').matches)done.focus();else find.focus();
 }
 for(const item of selects){item.button=make('button',item.label+' ▾',{type:'button',className:'filter-chip'});item.button.setAttribute('aria-haspopup','dialog');item.button.onclick=()=>choose(item);chips.append(item.button);}
 const panel=document.querySelector('.filter-panel');if(panel)panel.hidden=true;
 const fields=document.querySelector('.map-filter-fields');if(fields)fields.hidden=true;
 const legend=document.querySelector('.map-legend>summary');if(legend)legend.textContent='Map key';
 let disclosure,disclosureSummary;
 if(map){
  const dock=make('div','',{className:'map-discovery-dock'});
  disclosure=make('details','',{className:'map-search-disclosure'});
  disclosureSummary=make('summary','Search & filters');disclosure.append(disclosureSummary,bar);
  const close=make('button','Close',{type:'button',className:'discovery-close'});
  close.onclick=()=>{disclosure.open=false;disclosureSummary.focus();};
  const panelHeader=make('div','',{className:'discovery-panel-header'});panelHeader.append(make('h2','Find organisations'),close);bar.prepend(panelHeader);
  const heading=bar.querySelector('.discovery-heading');if(heading){heading.classList.add('sr-only');host.prepend(heading);}
  dock.append(disclosure);const key=document.querySelector('.map-legend');if(key)dock.append(key);
  const tools=document.querySelector('.map-tools');if(tools)dock.append(tools);
  host.append(dock);
  disclosure.addEventListener('toggle',()=>{if(disclosure.open&&key)key.open=false;});
  key?.addEventListener('toggle',()=>{if(key.open)disclosure.open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog.open&&disclosure.open){disclosure.open=false;disclosureSummary.focus();}});
 }
 if(!map){const head=host.querySelector('.results-head');host.insertBefore(bar,head);}
 function refresh(){active.replaceChildren();let count=0;
  for(const item of selects){const selected=[...item.select.selectedOptions].filter(option=>option.value);const value=selected.map(option=>option.value);item.button.replaceChildren(make('span',item.label,{className:'filter-chip-label'}),...(value.length?[make('span',String(value.length),{className:'filter-chip-count'})]:[]),make('span','▾',{className:'filter-chip-chevron'}));item.button.title=value.length?selected.map(option=>option.textContent).join(', '):item.label;item.button.setAttribute('aria-pressed',String(Boolean(value.length)));item.button.setAttribute('aria-label',item.label+(value.length?' — '+value.length+' selected':' — no selection'));if(!value.length)continue;count++;
   const remove=make('button',item.label+': '+selected.map(option=>option.textContent).join(', ')+' ×',{type:'button',className:'active-filter'});remove.setAttribute('aria-label','Remove '+item.label.toLowerCase()+' filter');remove.onclick=()=>{if(item.select.multiple)[...item.select.options].forEach(option=>option.selected=false);else item.select.value='';item.select.dispatchEvent(new Event('change',{bubbles:true}));};active.append(remove);
  }
  clear.hidden=!count&&!search.value;active.append(clear);active.hidden=!count&&!search.value;
  if(disclosureSummary)disclosureSummary.textContent='Search & filters'+(count+(search.value.trim()?1:0)?' · '+(count+(search.value.trim()?1:0)):'');
 }
 search.addEventListener('input',refresh);selects.forEach(item=>item.select.addEventListener('change',refresh));
 window.MCHFilterBar={refresh};refresh();document.body.classList.add('has-discovery-filters');
})();
