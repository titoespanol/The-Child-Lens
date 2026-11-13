'use strict';
// Account-scoped settings. Private reads and reviewed publication are enforced by SQL.
(() => {
 const confirmed = new Set();
 const add=(parent,tag,text,attrs={})=>{const node=document.createElement(tag);node.textContent=text||'';Object.assign(node,attrs);parent.append(node);return node;};
 const status=parent=>{const n=add(parent,'p','',{className:'form-msg'});n.setAttribute('role','status');return n;};
 const query=async operation=>{const result=await operation;if(result?.error)throw result.error;return result?.data;};
 async function ensureEligible(client,user,target,onReady) {
  if(confirmed.has(user.id))return true;
  let saved;
  try {saved=await query(client.from('member_account_eligibility').select('confirmed_at,minimum_age').eq('user_id',user.id).abortSignal(AbortSignal.timeout(8000)).maybeSingle());}
  catch {const root=target();add(root,'p','We could not load your account setup. Reopen My account to retry.');return false;}
  if(saved?.confirmed_at){confirmed.add(user.id);return true;}
  const root=target();add(root,'h3','A quick age check');
  add(root,'p','Accounts are for people aged 16 and over. We ask once during account setup. We save the confirmation, not your date of birth.');
  const notice=add(root,'p','Read how we use your age information in the ');add(notice,'a','Privacy notice',{href:'privacy.html#age-eligibility'});notice.append('.');
  const form=add(root,'form');const label=add(form,'label','Date of birth',{className:'profile-field'});
  const input=add(label,'input','',{type:'date',required:true,autocomplete:'off'});
  const next=add(form,'button','Continue',{type:'submit',className:'btn-primary'});const msg=status(form);
  let blocked=false;
  form.onsubmit=async event=>{
   event.preventDefault();if(next.disabled||blocked)return;
   const date=input.value;const eligible=window.MCHAgeGate?.eligible(date);
   if(eligible===null||eligible===undefined){msg.textContent='Enter a valid date of birth.';return;}
   if(!eligible){input.value='';blocked=true;input.disabled=true;next.disabled=true;msg.textContent='Accounts are available to people aged 16 and over. You can return to the public map.';return;}
   next.disabled=true;
   try {await query(client.rpc('confirm_member_age',{p_birth_date:date}).abortSignal(AbortSignal.timeout(10000)));input.value='';confirmed.add(user.id);onReady();}
   catch {input.value='';msg.textContent='We could not save the age confirmation. Please try again.';next.disabled=false;}
  };
  return false;
 }
 async function prepareAvatar(file) {
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2097152)throw Error('Choose a JPEG, PNG or WebP image up to 2 MB.');
  const image=await createImageBitmap(file);
  try {
   if(!image.width||!image.height||image.width*image.height>40000000)throw Error('Choose a smaller image.');
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,512);const side=Math.min(image.width,image.height);
   ctx.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,512,512);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.85));
   if(!blob||blob.size>1048576)throw Error('Choose a smaller image.');return blob;
  }finally{image.close?.();}
 }
 async function clearPhoto(client,user) {
  await query(client.rpc('save_member_photo',{p_path:null}).abortSignal(AbortSignal.timeout(10000)));
  // An old unused private image is removed through Storage, never by deleting metadata in SQL.
  if(client.storage) await query(client.storage.from('member-avatars').remove([`${user.id}/avatar.jpg`]));
 }
 async function mountPhoto(client,user,parent,picture,msg) {
  add(parent,'p','Or upload your own picture. JPEG, PNG or WebP, up to 2 MB. We crop a square and remove image metadata. Custom uploads are private and are not published with affiliations.');
  const label=add(parent,'label','Choose a photo',{className:'profile-field'});
  const file=add(label,'input','',{type:'file',accept:'image/jpeg,image/png,image/webp'});
  const upload=add(parent,'button','Save uploaded photo',{type:'button',className:'btn-secondary'});
  let photoUrl;
  async function show(path){const blob=await query(client.storage.from('member-avatars').download(path));if(!picture.isConnected)return;if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=URL.createObjectURL(blob);picture.src=photoUrl;picture.hidden=false;}
  if(typeof MutationObserver!=='undefined'){const watcher=new MutationObserver(()=>{if(!picture.isConnected){if(photoUrl)URL.revokeObjectURL(photoUrl);watcher.disconnect();}});watcher.observe(document.body,{childList:true,subtree:true});}
  upload.onclick=async()=>{
   if(upload.disabled)return;upload.disabled=true;msg.textContent='Preparing photo…';
   try {
    const blob=await prepareAvatar(file.files?.[0]);const path=`${user.id}/avatar.jpg`;
    await query(client.storage.from('member-avatars').upload(path,blob,{upsert:true,contentType:'image/jpeg',cacheControl:'0'}));
    await query(client.rpc('save_member_photo',{p_path:path}).abortSignal(AbortSignal.timeout(10000)));
    await show(path);file.value='';msg.textContent='Your custom photo is saved to your private profile. Custom photos are not published.';
   }catch(error){msg.textContent=error instanceof Error&&/Choose/.test(error.message)?error.message:'Your photo could not be confirmed saved. Reopen your profile to check before retrying.';}
   finally{upload.disabled=false;}
  };
  try {const saved=await query(client.from('member_photo_preferences').select('object_path').eq('user_id',user.id).abortSignal(AbortSignal.timeout(5000)).maybeSingle());if(saved?.object_path)await show(saved.object_path);}catch{}
 }
 async function mountAffiliations(client,user,parent,selected,organisations) {
  const root=add(parent,'section','',{className:'public-affiliation-settings'});add(root,'h3','Choose which affiliations to share');
  add(root,'p','Private by default. Save your professional profile first, then choose each affiliation you want public. Your saved professional name, role and organisation will be shown after review, labelled self-reported. Your email, photo and private bio are not included.');
  const msg=status(root);let saved=[];
  try {saved=await query(client.from('member_public_affiliations').select('organisation_id,status').eq('user_id',user.id).abortSignal(AbortSignal.timeout(5000)))||[];}
  catch{msg.textContent='Public affiliation choices could not be loaded. Your existing choices have not been changed.';return;}
  for(const id of selected){
   const org=organisations.find(o=>String(o.id)===id);const row=add(root,'div');
   const existing=saved.find(a=>a.organisation_id===id);const label=add(row,'label','',{className:'profile-choice'});
   const toggle=add(label,'input','',{type:'checkbox',checked:['pending','public'].includes(existing?.status)});
   add(label,'span',`Make my affiliation with ${org?.name||id} public`);
   const result=add(row,'p',existing?.status==='public'?'Public · self-reported':existing?.status==='pending'?'Awaiting review':'Private',{className:'field-help'});
   toggle.onchange=async()=>{
    const requested=toggle.checked;toggle.disabled=true;
    try {const value=await query(client.rpc('set_public_affiliation',{p_org:id,p_public:requested}).abortSignal(AbortSignal.timeout(10000)));result.textContent=value.status==='pending'?'Awaiting review. You can withdraw at any time.':'Private. Removed from public display.';msg.textContent='Affiliation visibility saved.';}
    catch{toggle.checked=!requested;msg.textContent='Visibility could not be saved. Save your profile with this affiliation first, then try again.';}
    finally{toggle.disabled=false;}
   };
  }
  if(!selected.size)add(root,'p','Add and save an affiliation to choose whether to share it.');
 }
 window.MCHAccountExtras={ensureEligible,mountPhoto,clearPhoto,mountAffiliations,prepareAvatar};
})();
