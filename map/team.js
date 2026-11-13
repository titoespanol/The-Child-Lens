'use strict';
(async()=>{
 const status=document.getElementById('teamStatus'),root=document.getElementById('founders');
 const id=new URL(location.href).searchParams.get('org');
 const form=document.getElementById('workEmailForm'),claimStatus=document.getElementById('claimStatus'),sendButton=form.querySelector('button');
 form.addEventListener('submit',event=>{event.preventDefault();if(!window.MCH_TEAM_CONFIG?.deliveryEnabled)claimStatus.textContent='Verification email delivery is not enabled. No claim has been created.';});
 try{
  const [orgs,people]=await Promise.all(['data/organisations.json','data/organisation-team.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error();return r.json();}));
  const org=orgs.find(row=>String(row.id)===id);if(!org)throw Error();
  document.querySelector('#teamMain h1').textContent=org.name+' · Team';document.title=org.name+' team | Mapping Children’s Health';
  const entries=people.filter(row=>row.organisationId===id);status.textContent=entries.length?'Founders listed from public sources.':'No founders are listed yet.';
  for(const row of entries){const url=new URL(row.sourceUrl);if(url.protocol!=='https:')continue;const p=document.createElement('p');p.textContent=row.name+' · '+row.role+' · ';const a=document.createElement('a');a.href=url.href;a.textContent='Public source';p.append(a);root.append(p);}
  if(window.MCH_TEAM_CONFIG?.deliveryEnabled){await loadVerifiedTeam(org);await prepareVerification(org);}
  document.getElementById('backOrganisation').href='directory.html?organisation='+encodeURIComponent(id);
 }catch{status.textContent='Organisation not found in the public snapshot. Return to the directory and choose an organisation.';document.getElementById('workEmailForm').hidden=true;}
 async function loadVerifiedTeam(org){
  try{const response=await fetch('https://zbhvwduyohpiiksyjqba.supabase.co/rest/v1/rpc/list_verified_organisation_team',{method:'POST',headers:{apikey:'sb_publishable_P_gC6PJRohYkXn1nMBGC4A_bHKkQmef','Content-Type':'application/json'},body:JSON.stringify({p_org:String(org.id)}),signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error();const rows=await response.json();if(!Array.isArray(rows))throw Error();if(rows.length){const section=document.createElement('section'),heading=document.createElement('h2');heading.textContent='Members who chose to be public';section.append(heading);for(const row of rows){const p=document.createElement('p');p.textContent=[row.name,row.role,row.verification].filter(Boolean).join(' · ');section.append(p);}root.after(section);}}catch{const p=document.createElement('p');p.textContent='Verified Team members could not be loaded. Public source information is shown above.';root.after(p);}
 }
 async function prepareVerification(org){
  const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
  await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;document.head.append(script);});
  const client=window.supabase.createClient('https://zbhvwduyohpiiksyjqba.supabase.co','sb_publishable_P_gC6PJRohYkXn1nMBGC4A_bHKkQmef');
  const {data,error}=await client.auth.getUser();if(error||!data.user){claimStatus.textContent='Sign in to your existing account through My account on the map, then return to this Team page.';return;}
  document.getElementById('deliveryNotice').textContent='Verify an additional work email. Your login email will stay unchanged.';
  const own=await client.rpc('get_my_organisation_team');
  if(own.error)throw Error('Linked work email settings unavailable');
  const existing=(own.data||[]).find(row=>row.organisationId===String(org.id));
  if(existing){
   const settings=document.createElement('section'),heading=document.createElement('h3');heading.textContent='Your linked work email';settings.append(heading);
   const address=document.createElement('p');address.textContent=existing.workEmail+' · '+(existing.memberRole?'Membership reviewed':existing.claimStatus||'Email verified');settings.append(address);
   const choice=document.getElementById('publishTeam');choice.checked=Boolean(existing.isPublic);
   choice.onchange=async()=>{choice.disabled=true;const wanted=choice.checked;const result=await client.rpc('set_team_publication',{p_org:String(org.id),p_public:wanted});if(result.error){choice.checked=!wanted;claimStatus.textContent='Team visibility could not be saved.';}else claimStatus.textContent=wanted?'Public Team choice saved. Publication also requires reviewed membership and public organisation Team settings.':'Your verified Team affiliation is now private.';choice.disabled=false;};
   const warning=document.createElement('p');warning.textContent='Removing this address also leaves this organisation’s verified Team, withdraws pending claims and removes your organisation-management access. Your normal login stays unchanged.';settings.append(warning);
   const remove=document.createElement('button');remove.type='button';remove.textContent='Remove work email and Team access';remove.onclick=async()=>{remove.disabled=true;const result=await client.rpc('remove_my_work_email_and_team_access',{p_org:String(org.id)});if(result.error){claimStatus.textContent='Removal could not be confirmed. Reopen this page to check.';remove.disabled=false;}else{settings.remove();choice.checked=false;choice.onchange=null;claimStatus.textContent='Work email and verified Team access removed. Your login address is unchanged.';}};settings.append(remove);form.before(settings);
  }

  sendButton.disabled=false;sendButton.textContent='Send verification code';let challenge;
  const label=document.createElement('label');label.textContent='Eight-digit verification code';const input=document.createElement('input');input.inputMode='numeric';input.pattern='[0-9]{8}';input.maxLength=8;label.append(input);label.hidden=true;form.append(label);
  const verify=document.createElement('button');verify.type='button';verify.textContent='Verify work email and request review';verify.hidden=true;form.append(verify);
  form.addEventListener('submit',async event=>{event.preventDefault();if(sendButton.disabled)return;sendButton.disabled=true;claimStatus.textContent='Requesting a code…';try{const {data,error}=await client.functions.invoke('work-email-verification',{body:{action:'start',email:document.getElementById('workEmail').value,organisationId:String(org.id)}});if(error||data?.error||!data?.challengeId)throw Error();challenge=data.challengeId;label.hidden=false;verify.hidden=false;claimStatus.textContent='Check your work inbox. The code expires in ten minutes. A new request invalidates an older code.';}catch{claimStatus.textContent='A code could not be confirmed sent. Check the work domain and request limits, or contact map@thechildlens.com.';}finally{sendButton.disabled=false;}});
  verify.onclick=async()=>{if(verify.disabled)return;if(!/^[0-9]{8}$/.test(input.value)){claimStatus.textContent='Enter the eight-digit code.';return;}verify.disabled=true;try{const {data,error}=await client.functions.invoke('work-email-verification',{body:{action:'verify',challengeId:challenge,code:input.value}});input.value='';if(error||!data?.verified)throw Error();const result=await client.rpc('request_verified_organisation_claim',{p_org:String(org.id),p_public:document.getElementById('publishTeam').checked});if(result.error)throw Error();claimStatus.textContent='Work inbox verified and claim submitted for moderator review. Your login address has not changed. Your work address is private.';sendButton.disabled=true;verify.hidden=true;label.hidden=true;}catch{claimStatus.textContent='Verification or claim submission could not be confirmed. Check your code or contact map@thechildlens.com before retrying.';}finally{verify.disabled=false;}};
 }
})();
