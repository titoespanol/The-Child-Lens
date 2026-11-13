'use strict';
// Logos are organisation branding. No remote third-party logo lookup or member data in public images.
(() => {
 const base='https://zbhvwduyohpiiksyjqba.supabase.co';
 const key='sb_publishable_P_gC6PJRohYkXn1nMBGC4A_bHKkQmef';
 const valid=id=>/^[A-Za-z0-9_-]{1,160}$/.test(String(id));
 const path=id=>`${id}/logo.png`;
 const query=async operation=>{const r=await operation;if(r.error)throw r.error;return r.data;};
 async function prepare(file){
  if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2097152)throw Error('Choose a PNG, JPEG or WebP logo up to 2 MB.');
  const source=await createImageBitmap(file);
  try{
   if(!source.width||!source.height||source.width*source.height>40000000)throw Error('Choose a smaller logo.');
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');
   const scale=Math.min(224/source.width,224/source.height);const w=source.width*scale,h=source.height*scale;
   ctx.drawImage(source,(256-w)/2,(256-h)/2,w,h);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   if(!blob||blob.size>262144)throw Error('Choose a simpler or smaller logo.');return blob;
  }finally{source.close?.();}
 }
 function badge(org){
  const root=document.createElement('span');root.className='organisation-logo';root.setAttribute('aria-hidden','true');
  const fallback=document.createElement('span');fallback.className='logo-fallback';fallback.textContent=String(org.name||'').split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();root.append(fallback);
  // The site's own organisation has a bundled brand asset, independent of hosted uploads.
  if(org.id==='seed-1'&&org.name==='The Child Lens'){
   const image=document.createElement('img');image.alt='';image.width=48;image.height=48;
   image.onload=()=>{fallback.hidden=true;};image.onerror=()=>{image.remove();fallback.hidden=false;};
   image.src='child-lens-map-pin.png';root.append(image);return root;
  }
  if(org.logo_enabled===true&&valid(org.id)){
   fetch(`${base}/storage/v1/object/authenticated/organisation-logos/${encodeURIComponent(org.id)}/logo.png`,{headers:{apikey:key},signal:AbortSignal.timeout(5000),cache:'no-store'})
    .then(async r=>{if(!r.ok)throw Error();const blob=await r.blob();if(blob.type!=='image/png'||blob.size>262144)throw Error();return blob;})
    .then(blob=>{if(!root.isConnected)return;const image=document.createElement('img');image.alt='';image.width=48;image.height=48;const url=URL.createObjectURL(blob);image.onload=()=>URL.revokeObjectURL(url);image.onerror=()=>{URL.revokeObjectURL(url);image.remove();fallback.hidden=false;};image.src=url;fallback.hidden=true;root.append(image);}).catch(()=>{});
  }
  return root;
 }
 let manageable=new Set(),accessRevision=0,accessViewer=null,accessClient;
 function updateLinks(){document.querySelectorAll('[data-logo-org]').forEach(link=>{link.hidden=!manageable.has(link.dataset.logoOrg);});}
 function managementLink(org){const link=document.createElement('a');link.className='text-link logo-management-link';link.textContent='Manage logo';link.dataset.logoOrg=String(org.id);link.href='organisation-management.html?org='+encodeURIComponent(org.id)+'#organisation-logo-editor';link.hidden=!manageable.has(String(org.id));return link;}
 async function reloadAccess(){
  const stamp=++accessRevision;manageable.clear();updateLinks();
  try{const {data,error}=await accessClient.auth.getUser();if(stamp!==accessRevision||error||!data?.user)return;accessViewer=data.user.id;
   const ids=await query(accessClient.rpc('list_manageable_logo_organisations').abortSignal(AbortSignal.timeout(8000)));
   if(stamp!==accessRevision)return;manageable=new Set(Array.isArray(ids)?ids:[]);updateLinks();
  }catch{if(stamp===accessRevision){manageable.clear();updateLinks();}}
 }
 async function startAccess(){
  if(!window.MCHAccountClient)return;
  try{accessClient=await window.MCHAccountClient.getClient();reloadAccess();
   accessClient.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||session?.user?.id!==accessViewer){accessViewer=null;accessRevision++;manageable.clear();updateLinks();setTimeout(reloadAccess,0);}});
   window.addEventListener('mch:affiliations-changed',reloadAccess);
  }catch{}
 }
 window.MCHOrganisationLogos={badge,prepare,managementLink};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startAccess,{once:true});else startAccess();
 const editor=document.getElementById('organisation-logo-editor');if(!editor)return;
 const id=new URLSearchParams(location.search).get('org');if(!valid(id))return;
 let client,revision=0,viewer=null;
 const add=(tag,text,parent=editor)=>{const n=document.createElement(tag);n.textContent=text||'';parent.append(n);return n;};
 async function render(){
  const stamp=++revision;editor.replaceChildren();add('h2','Organisation logo');
  const status=add('p','Checking logo permissions…');status.setAttribute('role','status');
  try{
   const {data,error}=await client.auth.getUser();if(stamp!==revision)return;if(error||!data?.user){viewer=null;status.textContent='Sign in with an authorised organisation account to manage its logo.';return;}
   viewer=data.user.id;
   const allowed=await query(client.rpc('can_manage_organisation_logo',{p_org:id}).abortSignal(AbortSignal.timeout(8000)));if(stamp!==revision)return;
   if(!allowed){status.textContent='Only people affiliated with this organisation and moderators can change its logo.';return;}
   status.textContent='Upload a logo you are authorised to use. It is visible wherever the organisation’s core details are public. Do not upload private or personal information.';
   const label=add('label','Choose organisation logo');label.className='profile-field';const file=add('input','',label);file.type='file';file.accept='image/png,image/jpeg,image/webp';
   add('p','PNG, JPEG or WebP, up to 2 MB. We preserve the full logo inside a transparent square and remove image metadata.');
   const save=add('button','Save organisation logo');save.type='button';save.className='btn-primary';
   const remove=add('button','Remove organisation logo');remove.type='button';remove.className='btn-secondary';
   async function change(deleting){
    if(save.disabled)return;save.disabled=remove.disabled=true;status.textContent=deleting?'Removing logo…':'Preparing logo…';
    try{
     if(deleting){await query(client.rpc('set_organisation_logo',{p_org:id,p_enabled:false}).abortSignal(AbortSignal.timeout(10000)));await query(client.storage.from('organisation-logos').remove([path(id)]));}
     else {const blob=await prepare(file.files?.[0]);if(stamp!==revision)return;await query(client.storage.from('organisation-logos').upload(path(id),blob,{contentType:'image/png',upsert:true,cacheControl:'0'}));await query(client.rpc('set_organisation_logo',{p_org:id,p_enabled:true}).abortSignal(AbortSignal.timeout(10000)));file.value='';}
     if(stamp===revision)status.textContent=deleting?'Logo removed. Initials will appear instead.':'Logo saved. Refresh the map or directory to see the updated branding.';
    }catch(e){if(stamp===revision)status.textContent=/Choose/.test(e.message)?e.message:'We could not confirm the logo change. Refresh and check before retrying.';}
    finally{if(stamp===revision)save.disabled=remove.disabled=false;}
   }
   save.onclick=()=>change(false);remove.onclick=()=>change(true);
  }catch{if(stamp===revision)status.textContent='Logo tools could not load. Refresh this page to retry.';}
 }
 function connect(){client=window.MCHOrganisationWorkspaceClient;if(!client)return;render();client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||session?.user?.id!==viewer){viewer=null;revision++;editor.replaceChildren();setTimeout(render,0);}});}
 if(window.MCHOrganisationWorkspaceClient)connect();else window.addEventListener('mch:workspace-ready',connect,{once:true});
})();
