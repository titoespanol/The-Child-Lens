'use strict';
// URL contains only a view intent. Identity and all saved data come from the signed-in account.
(() => {
 const results=document.getElementById('results');if(!results)return;
 let client,user=null,ids=new Set(),revision=0,showing=new URLSearchParams(location.search).get('saved')==='1',ready=false;
 const busy=new Set();
 const toggle=document.createElement('button');toggle.type='button';toggle.className='saved-toggle';
 const status=document.createElement('p');status.className='field-help';status.setAttribute('role','status');
 const retry=document.createElement('button');retry.type='button';retry.textContent='Retry saved organisations';retry.hidden=true;
 document.querySelector('.results-head')?.insertBefore(toggle,document.getElementById('reset'));
 document.querySelector('.results-head')?.after(status,retry);
 function signIn(){document.getElementById('authBtn')?.click();}
 function paint(){
  toggle.textContent=showing?'Show all organisations':'Saved organisations';toggle.setAttribute('aria-pressed',String(showing));
  let visible=0;
  results.querySelectorAll('.entry').forEach(card=>{
   const id=card.id.replace(/^card-/,'');const name=card.querySelector('.name')?.textContent?.trim();if(!id||!name)return;
   let button=card.querySelector('[data-bookmark]');
   if(!button){button=document.createElement('button');button.type='button';button.dataset.bookmark=id;button.className='bookmark-button';card.append(button);button.addEventListener('click',()=>save(id));}
   button.textContent=!user?'Sign in to save':ids.has(id)?'Saved':'Save';button.setAttribute('aria-label',`${ids.has(id)?'Remove saved organisation':'Save organisation'}: ${name}`);
   button.setAttribute('aria-pressed',String(ids.has(id)));button.disabled=!!user&&(!ready||busy.has(id));
   card.hidden=showing&&(!user||!ready||!ids.has(id));if(!card.hidden)visible++;
  });
  if(showing)status.textContent=!user?'Sign in to see your saved organisations. This link only opens your own saved list.':!ready?'Loading your saved organisations…':`${visible} saved organisation${visible===1?'':'s'} ${visible===1?'matches':'match'} these filters. Saves are private to your account.`;
 }
 async function load(next){
  const stamp=++revision;user=next;ids=new Set();busy.clear();ready=false;retry.hidden=true;status.textContent='';paint();if(!user)return;
  try{const r=await client.from('member_saved_organisations').select('organisation_id').eq('user_id',user.id).abortSignal(AbortSignal.timeout(8000));if(stamp!==revision)return;if(r.error)throw r.error;ids=new Set((r.data||[]).map(x=>x.organisation_id));ready=true;paint();}
  catch{if(stamp!==revision)return;paint();status.textContent='Saved organisations could not be loaded. Your saved list has not been changed.';retry.hidden=false;}
 }
 async function save(id){
  if(!user){signIn();return;}if(!ready||busy.has(id))return;
  const stamp=revision;const requested=!ids.has(id);let notice='';busy.add(id);paint();
  try{const r=await client.rpc('set_saved_organisation',{p_org:id,p_saved:requested}).abortSignal(AbortSignal.timeout(10000));if(stamp!==revision)return;if(r.error)throw r.error;requested?ids.add(id):ids.delete(id);notice=requested?'Saved to your private account.':'Removed from your saved organisations.';}
  catch{if(stamp===revision){notice='We could not confirm the change. Retry loading your saved list before trying again.';retry.hidden=false;}}
  finally{if(stamp===revision){busy.delete(id);paint();if(notice)status.textContent=notice;}}
 }
 toggle.addEventListener('click',()=>{if(!user){signIn();return;}showing=!showing;const url=new URL(location.href);showing?url.searchParams.set('saved','1'):url.searchParams.delete('saved');history.replaceState(null,'',url);paint();});
 retry.addEventListener('click',()=>load(user));new MutationObserver(paint).observe(results,{childList:true});paint();
 async function start(){
  try{client=await window.MCHAccountClient.getClient();const stamp=revision;
   client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||session?.user?.id!==user?.id){user=null;ids.clear();ready=false;revision++;paint();setTimeout(()=>load(session?.user||null),0);}});
   const result=await client.auth.getUser();if(revision===stamp)await load(result.error?null:result.data?.user||null);
  }catch{status.textContent='Sign-in is unavailable. You can keep exploring and try again later.';}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
