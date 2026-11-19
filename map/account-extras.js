'use strict';
// Account-scoped settings. Private reads and reviewed publication are enforced by SQL.
(() => {
 const confirmed = new Set();
 const contactChoices = Object.freeze({
  tcl: "The Child Lens may email me about opportunities in children's health.",
  partner: "The Child Lens may email me opportunities from its partners and sponsors in children's health."
 });
 const add=(parent,tag,text,attrs={})=>{const node=document.createElement(tag);node.textContent=text||'';Object.assign(node,attrs);parent.append(node);return node;};
 const status=parent=>{const n=add(parent,'p','',{className:'form-msg'});n.setAttribute('role','status');return n;};
 const query=async operation=>{const result=await operation;if(result?.error)throw result.error;return result?.data;};

 function pendingEmailChoices(userId, choices) {
  // Only keep the two choices in this tab. Never retain the contact address or birth date.
  const key = `mch:onboarding:age-email:${userId}`;
  try {
   if (choices === null) return window.sessionStorage?.removeItem(key);
   if (choices) return window.sessionStorage?.setItem(key, JSON.stringify(choices));
   const saved = JSON.parse(window.sessionStorage?.getItem(key) || 'null');
   if (typeof saved?.tcl === 'boolean' && typeof saved.partner === 'boolean') return saved;
  } catch { /* Account setup also works when browser storage is unavailable. */ }
  return null;
 }

 function checkbox(parent, text, checked) {
  const label = add(parent, 'label', '', {className: 'profile-choice'});
  const box = add(label, 'input', '', {type: 'checkbox', checked});
  add(label, 'span', text);
  return box;
 }

 async function ensureEligible(client,user,target,onReady) {
  const pending = pendingEmailChoices(user.id);
  if (confirmed.has(user.id) && !pending) return true;
  let ageConfirmed;
  try {
   const age = await query(client.from('member_account_eligibility').select('confirmed_at')
    .eq('user_id', user.id).abortSignal(AbortSignal.timeout(8000)).maybeSingle());
   ageConfirmed = Boolean(age?.confirmed_at);
   if (ageConfirmed && !pending) {
    confirmed.add(user.id);
    return true;
   }
  } catch {
   const root = target();
   if (!root) return false;
   add(root, 'p', 'We could not load your account setup.');
   const retry = add(root, 'button', 'Try again', {type: 'button', className: 'btn-secondary'});
   retry.onclick = async () => {
    root.replaceChildren();
    if (await ensureEligible(client, user, target, onReady)) onReady();
   };
   return false;
  }

  let saved;
  let emailAvailable = true;
  try {
   saved = await query(client.from('member_contact_preferences').select('tcl_opt_in,partner_opportunities_opt_in')
    .eq('user_id', user.id).abortSignal(AbortSignal.timeout(8000)).maybeSingle());
  } catch { emailAvailable = false; }
  const savedTcl = saved?.tcl_opt_in === true;
  const savedPartner = saved?.partner_opportunities_opt_in === true;
  if (ageConfirmed && emailAvailable && pending && pending.tcl === savedTcl && pending.partner === savedPartner) {
   pendingEmailChoices(user.id, null);
   confirmed.add(user.id);
   return true;
  }

  const root = target();
  if (!root) return false;
  const form = add(root, 'form', '', {noValidate: true});
  const fields = add(form, 'fieldset', '', {className: 'account-setup-fields'});
  const ageFields = add(fields, 'div', '', {hidden: ageConfirmed});
  add(ageFields, 'h3', 'A quick age check');
  add(ageFields, 'p', 'Accounts are for people aged 16 and over. We save the confirmation and discard your date of birth.');
  const birthDate = add(add(ageFields, 'label', 'Date of birth', {className: 'profile-field'}),
   'input', '', {type: 'date', required: !ageConfirmed, autocomplete: 'off'});
  const emailFields = add(fields, 'fieldset', '', {className: 'account-setup-email', disabled: !emailAvailable});
  add(emailFields, 'legend', 'Email preferences (optional)');
  add(emailFields, 'p', emailAvailable
   ? 'Choose the emails you’d like to receive. You can change your choices in My account.'
   : 'Email choices could not be loaded. You can continue and manage them later in My account.');
  const tcl = checkbox(emailFields, contactChoices.tcl, pending?.tcl ?? savedTcl);
  const partner = checkbox(emailFields, contactChoices.partner, pending?.partner ?? savedPartner);
  add(emailFields, 'p', 'The Child Lens sends both types of email and keeps your email address private.');
  const contact = add(add(emailFields, 'label', 'Enter your verified sign-in email', {className: 'profile-field'}),
   'input', '', {type: 'email', maxLength: 254, autocomplete: 'off'});
  const contactLabel = contact.parentElement;
  function updateContact() {
   contactLabel.hidden = !(tcl.checked || partner.checked);
   contact.required = !contactLabel.hidden;
  }
  tcl.onchange = partner.onchange = updateContact;
  updateContact();
  add(form, 'a', 'Privacy notice', {href: 'privacy.html#policy-optional-contact-preferences'});
  const next = add(form, 'button', 'Continue', {type: 'submit', className: 'btn-primary profile-provider'});
  const msg = status(form);
  if (ageConfirmed) msg.textContent = 'Your age is confirmed. You can finish saving your email choices below.';
  form.onsubmit = async event => {
   event.preventDefault();
   if (next.disabled) return;
   const date = birthDate.value;
   if (!ageConfirmed) {
    const eligible = window.MCHAgeGate?.eligible(date);
    if (eligible !== true) {
     msg.textContent = eligible === false
      ? 'Accounts are available to people aged 16 and over. You can return to the public map.'
      : 'Enter a valid date of birth.';
     if (eligible === false) {
      birthDate.value = '';
      fields.disabled = next.disabled = true;
      pendingEmailChoices(user.id, null);
     } else birthDate.focus();
     return;
    }
   }
   const choices = {tcl: tcl.checked, partner: partner.checked};
   const changed = emailAvailable && (choices.tcl !== savedTcl || choices.partner !== savedPartner);
   const address = contact.value.trim();
   if (changed && (choices.tcl || choices.partner) &&
       (!address || !contact.checkValidity() || address.toLowerCase() !== user.email?.toLowerCase())) {
    msg.textContent = 'Enter the verified email address you used to sign in, or leave both choices unticked.';
    contact.focus();
    return;
   }
   fields.disabled = next.disabled = true;
   msg.textContent = 'Saving your choices…';
   pendingEmailChoices(user.id, changed ? choices : null);
   try {
    const auth = await query(client.auth.getUser());
    if (auth?.user?.id !== user.id) throw new Error('Account changed during setup.');
    if (!ageConfirmed) {
     await query(client.rpc('confirm_member_age', {p_birth_date: date}).abortSignal(AbortSignal.timeout(10000)));
     ageConfirmed = true;
     birthDate.value = '';
     ageFields.hidden = true;
    }
    if (changed) {
     await query(client.rpc('save_contact_preferences', {
      p_contact: address, p_tcl: choices.tcl, p_partner_opportunities: choices.partner
     }).abortSignal(AbortSignal.timeout(10000)));
    }
    pendingEmailChoices(user.id, null);
    confirmed.add(user.id);
    if (root.isConnected) onReady();
   } catch {
    birthDate.value = '';
    msg.textContent = ageConfirmed
     ? 'Your age is confirmed. We could not confirm that your email choices were saved. Please try again.'
     : 'We could not confirm your age. Please enter your date of birth and try again.';
    fields.disabled = next.disabled = false;
   }
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
  add(parent,'p','Or upload your own picture. JPEG, PNG or WebP, up to 2 MB. We crop a square and remove image metadata.');
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
    await show(path);file.value='';msg.textContent='Your uploaded photo is saved.';
   }catch(error){msg.textContent=error instanceof Error&&/Choose/.test(error.message)?error.message:'Your photo could not be confirmed saved. Reopen your profile to check before retrying.';}
   finally{upload.disabled=false;}
  };
  try {const saved=await query(client.from('member_photo_preferences').select('object_path').eq('user_id',user.id).abortSignal(AbortSignal.timeout(5000)).maybeSingle());if(saved?.object_path)await show(saved.object_path);}catch{}
 }

 async function mountPhotoSharing(client, user, parent) {
  let saved;
  try {
   saved = await query(client.from('member_profiles').select('team_photo_public').eq('user_id', user.id)
    .abortSignal(AbortSignal.timeout(5000)).maybeSingle());
  } catch { return; }
  if (!parent.isConnected) return;
  const choice = checkbox(parent, 'Show my saved picture on public Team listings', saved?.team_photo_public === true);
  add(parent, 'p', 'Anyone can see your picture next to your approved public Team entries when this is on. You can switch it off here at any time.');
  const msg = status(parent);
  choice.onchange = async () => {
   const publish = choice.checked;
   choice.disabled = true;
   msg.textContent = 'Saving picture visibility…';
   try {
    await query(client.rpc('set_member_team_photo_visibility', {p_public: publish})
     .abortSignal(AbortSignal.timeout(8000)));
    msg.textContent = publish
     ? 'Your picture visibility is set to public for approved Team entries.'
     : 'Your picture visibility is set to private.';
   } catch (error) {
    choice.checked = !publish;
    msg.textContent = error?.code === '22023'
     ? 'Save your profile and choose a picture first.'
     : 'We could not confirm your change. Reopen your profile to check.';
   } finally { choice.disabled = false; }
  };
 }

 async function mountAffiliations(client,user,parent,selected,organisations) {
  const root=add(parent,'section','',{className:'public-affiliation-settings'});add(root,'h3','Choose which affiliations to share');
  add(root,'p','Choose which affiliations to share after saving your private profile. Approved affiliations show your professional name, role and organisation in Team, labelled self-reported. A picture appears only if you also choose to share it.');
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
 window.MCHAccountExtras={ensureEligible,contactChoices,mountPhoto,mountPhotoSharing,clearPhoto,mountAffiliations,prepareAvatar};
})();
