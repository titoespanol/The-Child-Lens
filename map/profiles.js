'use strict';
(() => {
  const config = window.MCH_PROFILES || { enabled: false };
  const dialog = document.getElementById('authModal');
  let modal = dialog;
  let modalHeader, modalHeading;
  const opener = document.getElementById('authBtn');
  if (!modal || !opener) return;
  let client = typeof dbClient === 'undefined' ? null : dbClient;
  let loadingClient = null;
  let subscribed = false;
  function subscribe() {
    if (subscribed || !client) return;
    subscribed = true;
    // Run outside the SDK's auth lock. Token refresh must not erase unsaved edits.
    client.auth.onAuthStateChange((event, session) => setTimeout(() => {
      opener.textContent = 'My account';
      if(event === 'SIGNED_OUT'){
        currentUser=null;generation++;modal.replaceChildren();
        try { for(let i=window.sessionStorage.length-1;i>=0;i--){const key=window.sessionStorage.key(i);if(key?.startsWith('mch:onboarding:'))window.sessionStorage.removeItem(key);} } catch {}
      }
      if (event === 'SIGNED_OUT' || (session?.user?.id !== currentUser?.id && event === 'SIGNED_IN')) {
        if (dialog.open) refresh().catch(showUnavailable);
      }
    }, 0));
  }
  async function getClient() {
    if (client) { subscribe(); return client; }
    if (!loadingClient) loadingClient = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
      script.async = true;
      const timer = setTimeout(() => { script.remove(); reject(new Error('Sign-in unavailable')); }, 8000);
      script.onerror = () => { clearTimeout(timer); reject(new Error('Sign-in unavailable')); };
      script.onload = () => {
        clearTimeout(timer);
        if (!window.supabase?.createClient) { reject(new Error('Sign-in unavailable')); return; }
        client = window.supabase.createClient('https://zbhvwduyohpiiksyjqba.supabase.co', 'sb_publishable_P_gC6PJRohYkXn1nMBGC4A_bHKkQmef');
        subscribe();
        resolve(client);
      };
      document.head.append(script);
    }).catch(error => { loadingClient = null; throw error; });
    return loadingClient;
  }
  window.MCHAccountClient = { getClient };
  const entryQuery = new URL(window.location.href).searchParams;
  let route = entryQuery.get('memberSuggestion') === '1' ? 'suggest' : entryQuery.get('review') === '1' ? 'review' : 'home';
  // Consume the redirect intent once; ordinary visits start at the account overview.
  try {
    const pending = window.sessionStorage?.getItem('mch-account-route');
    const returning = new URL(window.location.href);
    const hash = new URLSearchParams(returning.hash.slice(1));
    if ((returning.searchParams.has('code') || returning.searchParams.has('error') || hash.has('access_token') || hash.has('error')) && ['home', 'profile', 'updates', 'suggest', 'review'].includes(pending)) route = pending;
    window.sessionStorage?.removeItem?.('mch-account-route');
  } catch {}
  let currentUser = null;
  let generation = 0;
  const copy = {
    tcl: "The Child Lens may email me about opportunities in children's health.",
    partner: "The Child Lens may email me opportunities from its partners and sponsors in children's health."
  };
  function node(tag, text, parent, attrs = {}) {
    const e = document.createElement(tag);
    if (text) e.textContent = text;
    Object.assign(e, attrs);
    if (parent) parent.append(e);
    return e;
  }
  function field(parent, title, type = 'text', value = '', required = false, maxLength = 200) {
    const label = node('label', title, parent, { className: 'profile-field' });
    return node(type === 'textarea' ? 'textarea' : 'input', '', label,
      { ...(type === 'textarea' ? {} : { type }), value, required, maxLength });
  }
  function check(parent, text, checked = false) {
    const label = node('label', '', parent, { className: 'profile-choice' });
    const input = node('input', '', label, { type: 'checkbox', checked });
    node('span', text, label);
    return input;
  }
  function shell(title) {
    if (!modalHeader) {
      dialog.replaceChildren();
      modal = node('div', '', dialog, { className: 'account-modal-scroll' });
      modalHeader = node('div', '', modal, { className: 'modal-header' });
      modalHeading = node('h2', title, modalHeader, { id: 'authTitle' });
      const close = node('button', '×', modalHeader, { type: 'button', className: 'modal-close' });
      close.setAttribute('aria-label', 'Close profile');
      close.onclick = () => dialog.close();
    } else {
      modal.replaceChildren(); modal.append(modalHeader); modalHeading.textContent = title;
    }
    modal.scrollTop = 0;
    if (route !== 'home') {
      const back = node('button', 'Back to my account', modal, { type: 'button', className: 'account-back-bottom' });
      back.onclick = () => { route = 'home'; refresh().catch(showUnavailable); };
    }
  }
  function message(parent) {
    const p = node('p', '', parent, { className: 'form-msg' });
    p.setAttribute('role', 'status');
    return p;
  }
  async function bounded(operation) {
    let timer;
    try {
      return await Promise.race([operation, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Connection timed out')), 10000);
      })]);
    } finally { clearTimeout(timer); }
  }
  async function action(button, status, operation) {
    button.disabled = true;
    status.textContent = 'Please wait…';
    try { await operation(); } catch { status.textContent = 'We could not complete this request. Please try again. If it continues, contact map@thechildlens.com.'; }
    finally { button.disabled = false; }
  }
  function legal(parent) {
    const p = node('p', 'By using the account service, you agree to the ', parent);
    node('a', 'Terms of Use', p, { href: config.termsUrl });
    p.append(' and acknowledge the ');
    node('a', 'Privacy Notice', p, { href: config.privacyUrl });
    p.append('. Optional emails from The Child Lens are a separate choice.');
  }
  function showUnavailable() {
    shell('Sign-in unavailable');
    node('p', 'We could not connect. You can keep exploring the directory and try again.', modal);
    const retry = node('button', 'Try again', modal, { type: 'button', className: 'btn-primary' });
    retry.onclick = () => refresh().catch(showUnavailable);
  }
  function login() {
    shell(route === 'updates' ? 'Keep up to date with The Child Lens' : 'Sign in to your account');
    if (!config.enabled || !client) {
      node('p', config.enabled ? 'Connecting to sign-in…' : 'Profile registration is being prepared. You can continue exploring the directory without an account.', modal);
      return;
    }
    node('p', 'Accounts are for people aged 16 and over. Sign in to manage your private profile, affiliations and email choices.', modal);
    const privacy = node('details', '', modal, { className: 'account-help' });
    node('summary', 'How we use your account information', privacy);
    node('p', 'We use basic identity information and email for your account, without inbox or contacts access. Provider information is not added to mailing lists. Email updates are a separate, optional choice.', privacy);
    node('p', 'For account deletion or provider disconnection, contact privacy@thechildlens.com.', privacy);
    legal(modal);
    const status = message(modal);
    for (const [provider, name] of [['google', 'Google']]) {
      if (provider === 'google' && config.googleEnabled === false) {
        node('p', 'Google sign-in is being configured. Use an email sign-in link below.', modal);
        continue;
      }
      const b = node('button', `Continue with ${name}`, modal, { type: 'button', className: 'btn-primary profile-provider' });
      b.onclick = () => action(b, status, async () => {
        try { window.sessionStorage?.setItem('mch-account-route', route); } catch {}
        const { error } = await client.auth.signInWithOAuth({ provider,
          options: { redirectTo: new URL('index.html', window.location.href).href, scopes: 'openid profile email' } });
        if (error) throw error;
        status.textContent = `Continuing to ${name}…`;
      });
    }
    const form = node('form', '', modal);
    const email = field(form, 'Or sign in with your email', 'email', '', true, 254);
    email.autocomplete = 'email';
    const send = node('button', 'Email me a sign-in link', form, { type: 'submit', className: 'btn-primary' });
    form.onsubmit = event => {
      event.preventDefault();
      action(send, status, async () => {
        try { window.sessionStorage?.setItem('mch-account-route', route); } catch {}
        const { error } = await client.auth.signInWithOtp({ email: email.value.trim(), options: {
          emailRedirectTo: new URL('index.html', window.location.href).href
        } });
        if (error) {
          status.textContent = ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(error.code)
            ? 'Too many sign-in requests. Please wait a few minutes before trying again.'
            : error.code === 'email_address_not_authorized'
              ? 'Email sign-in is not yet available for this address. Contact map@thechildlens.com.'
              : 'We could not send a sign-in link. Please try again later.';
          return;
        }
        status.textContent = 'Check your inbox for your sign-in link. It may take a few minutes. You can close this window.';
      });
    };
  }
  function accountShell(title) {
    shell(title);
    const nav = node('div', '', modal, { className: 'account-actions' });
    if (route !== 'home') {
      const back = node('button', 'Back to my account', nav, { type: 'button', className: 'btn-secondary' });
      back.onclick = () => { route = 'home'; refresh().catch(showUnavailable); };
    }
    const browse = node('button', 'Back to map', nav, { type:'button', className:'btn-secondary' });
    browse.onclick = () => dialog.close();
    const logout = node('button', 'Sign out', nav, { type: 'button', className: 'btn-secondary' });
    const status = message(nav);
    logout.onclick = () => action(logout, status, async () => {
      const { error } = await bounded(client.auth.signOut({ scope: 'local' }));
      if (error) throw error;
      route = 'home'; await refresh();
    });
    return status;
  }
  async function account(user, stamp) {
    accountShell('Your account');
    const overview = node('div', '', modal, { className: 'account-overview' });
    const affiliations = node('section', '', overview, { className: 'account-affiliations' });
    node('h3', 'Your affiliations', affiliations);
    const summary = node('p', 'Loading…', affiliations, { className: 'account-summary' });
    const names = node('div', '', affiliations, { className: 'account-affiliation-names' });
    node('p', 'Only you can see these affiliations unless you choose to publish one.', affiliations, { className: 'field-help' });
    const edit = node('button', 'Edit profile & affiliations', overview, { type: 'button', className: 'account-option' });
    edit.onclick = () => { route = 'profile'; refresh().catch(showUnavailable); };
    const contact = node('button', 'Email preferences', overview, { type: 'button', className: 'account-option' });
    contact.onclick = () => { route = 'updates'; refresh().catch(showUnavailable); };
    const suggest = node('button', 'Suggest an organisation', overview, { type: 'button', className: 'account-option' });
    suggest.onclick = () => { route = 'suggest'; refresh().catch(showUnavailable); };
    const reviewer = node('div', '', overview);
    // A visible link is navigation only. Every moderation RPC still checks the caller.
    bounded(client.rpc('moderator_access').abortSignal(AbortSignal.timeout(5000))).then(result => {
      if (stamp !== generation || currentUser?.id !== user.id) return;
      if (!result.error && result.data === true) {
        node('a', 'Moderation dashboard', reviewer, { href: 'moderation.html', className: 'account-option' });
      } else if (result.error) {
        node('p', 'Reviewer access could not be checked. Reopen My account to try again.', reviewer, {className:'field-help',role:'status'});
      }
    }).catch(() => {
      if (stamp === generation) node('p', 'Reviewer access could not be checked. Reopen My account to try again.', reviewer, {className:'field-help',role:'status'});
    });
    node('a', 'Saved organisations', overview, { href: 'directory.html?saved=1', className: 'account-option' });
    node('a', 'Request account deletion', overview, { href: 'mailto:privacy@thechildlens.com?subject=Delete%20my%20Mapping%20Children%27s%20Health%20account', className: 'account-option' });
    const help = node('details', '', overview, { className: 'account-help' });
    node('summary', 'Privacy & account help', help);
    node('p', 'Your profile stays private. Affiliations are shared only when you choose to publish them and they are approved. Email updates are optional and can be changed or withdrawn in Email preferences.', help);
    node('a', 'Privacy notice', help, { href: config.privacyUrl });
    try {
      const result = await bounded(client.from('member_profiles').select('organisation_ids').eq('user_id', user.id).maybeSingle());
      if (stamp !== generation) return;
      if (result.error) throw result.error;
      const ids = (result.data?.organisation_ids || []).map(String);
      summary.textContent = ids.length ? `${ids.length} saved affiliation${ids.length === 1 ? '' : 's'}.` : 'No affiliations added yet.';
      if (ids.length) {
        const directory = await client.from('organisations').select('id,name,type,city,country').abortSignal(AbortSignal.timeout(5000));
        if (stamp !== generation) return;
        if (directory.error) throw directory.error;
        for (const id of ids) {
          const org = directory.data?.find(item => String(item.id) === id);
          node('p', org?.name || 'Saved organisation currently unavailable', names);
        }
      }
    } catch { if (stamp === generation) summary.textContent = 'Saved affiliations could not be loaded. Open your professional profile to retry; no saved affiliations have been changed.'; }
  }
  function suggestion(user) {
    accountShell('Suggest an organisation');
    if (window.MCH_SUBMISSIONS_ENABLED !== true) {
      node('p', 'In-app suggestions are temporarily paused. Email map@thechildlens.com with public evidence links.', modal);
      return;
    }
    node('p', 'Suggest a public organisation for human review. It will not appear in the directory until approved. Do not send patient information, private contacts or confidential material.', modal);
    const form = node('form', '', modal);
    const name = field(form, 'Organisation name', 'text', '', true, 200);
    const typeLabel = node('label', 'Organisation type', form, { className: 'profile-field' });
    const type = node('select', '', typeLabel, { required: true, disabled: true });
    node('option', 'Loading types…', type, { value: '' });
    const typeStatus = message(form);
    bounded(client.from('taxonomy_terms').select('label').eq('facet', 'organisation_type').abortSignal(AbortSignal.timeout(5000)))
      .then(result => {
        if (result.error || !Array.isArray(result.data) || !result.data.length) throw new Error('Types unavailable');
        const types = [...new Set(result.data.map(row => row.label).filter(Boolean))].sort();
        type.replaceChildren();
        node('option', 'Choose an organisation type', type, { value: '' });
        types.forEach(label => node('option', label, type, { value: label }));
        type.disabled = false;
      }).catch(() => { typeStatus.textContent = 'Organisation types are unavailable. Please reopen this form or email map@thechildlens.com.'; });
    const city = field(form, 'City', 'text', '', true, 120);
    const country = field(form, 'Country', 'text', '', true, 120);
    node('p', 'City and country help us place the organisation on the map after review.', form, {className:'field-help'});
    const address = field(form, 'Public organisation address (optional)', 'textarea', '', false, 500);
    node('p', 'Use the organisation’s public business address, never a home or patient address.', form, {className:'field-help'});
    const website = field(form, 'Website or public evidence link', 'url', '', true, 2000);
    const send = node('button', 'Submit for review', form, { type: 'submit', className: 'btn-primary' });
    const status = message(form);
    form.onsubmit = event => {
      event.preventDefault();
      if (send.disabled) return;
      const payload = {name:name.value.trim(),org_type:type.value.trim(),city:city.value.trim(),country:country.value.trim(),website:website.value.trim(),address:address.value.trim() || null};
      if (!payload.name || !payload.org_type || !payload.city || !payload.country || payload.name.length>200 || payload.org_type.length>100 || payload.city.length>120 || payload.country.length>120 || (payload.address || '').length>500) {
        feedback(status, 'Enter the organisation name, type, city and country within the field limits.'); return;
      }
      try {
        const url = new URL(payload.website);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || payload.website.length>2000) throw new Error();
        payload.website = url.href;
      } catch { feedback(status, 'Enter a public website or evidence link starting with https:// or http://.'); return; }
      action(send, status, async () => {
        const {data, error:authError} = await bounded(client.auth.getUser());
        if (authError || data?.user?.id !== user.id) { feedback(status, 'Please sign in again before submitting.'); return; }
        const result = await bounded(client.from('org_suggestions').insert({...payload,suggested_by:user.id})
          .select('id,name,status').abortSignal(AbortSignal.timeout(10000)).single());
        if (result.error || !result.data) {
          const error = result.error;
          feedback(status, error?.code === '23505' ? 'You already have a pending suggestion for this organisation.'
            : error?.code === 'P0001' && /limit reached/i.test(error.message || '') ? 'Your suggestion limit has been reached. Please wait or email map@thechildlens.com.'
            : error?.code === 'P0001' && /suggestions are paused/i.test(error.message || '') ? 'Suggestions are temporarily paused. Email map@thechildlens.com.'
            : 'We could not confirm your suggestion was saved. Your details are still here. Contact map@thechildlens.com before retrying if the result is uncertain.');
          return;
        }
        form.replaceChildren();
        node('p', 'Saved for review. Submitting does not change your email preferences.', form, {role:'status'});
      });
    };
  }
  function feedback(status, text) {
    status.textContent = text;
    status.scrollIntoView?.({ block: 'nearest' });
  }
  async function saveRequest(button, status, rpc, values, success) {
    if (button.disabled) return;
    await action(button, status, async () => {
      let result;
      try { result = await client.rpc(rpc, values).abortSignal(AbortSignal.timeout(12000)); }
      catch { feedback(status, 'We could not confirm the save. Reopen this screen to check your saved values before trying again.'); return; }
      if (result.error) {
        const error = result.error;
        const text = String(error.message || '');
        feedback(status, text.includes('verified account email')
          ? 'Use your verified sign-in email for now. A different contact address needs separate verification. You can still withdraw both choices.'
          : error.code === 'PGRST202' || error.code === '42P01'
            ? 'This feature is not ready on the server yet. Your changes have not been saved.'
            : /abort|timeout/i.test(text)
              ? 'We could not confirm the save. Reopen this screen to check your saved values before trying again.'
              : 'Your changes could not be saved. Please try again or contact map@thechildlens.com.');
        return;
      }
      success();
    });
  }
  async function preferences(user, stamp) {
    const loading = accountShell('Your email preferences');
    loading.textContent = 'Loading your choices…';
    let result;
    try { result = await bounded(client.from('member_contact_preferences').select('contact_email,tcl_opt_in,partner_opportunities_opt_in').eq('user_id', user.id).maybeSingle()); }
    catch { feedback(loading, 'Your choices could not be loaded. Reopen this screen to retry.'); return; }
    if (stamp !== generation) return;
    if (result.error) { feedback(loading, 'Contact preferences are unavailable. Your existing choices have not been changed.'); return; }
    loading.textContent = '';
    const saved = result.data;
    const form = node('form', '', modal, { noValidate: true });
    node('p', saved ? 'Your saved email choices are shown below. You can leave them unchanged, update them or withdraw them.' : 'Email updates are optional. Choose them here if you would like to receive them; you can keep using your account without subscribing.', form);
    node('p', `Your private sign-in email: ${user.email || 'unavailable'}.`, form);
    node('p', 'For now, use your verified sign-in address. Separate verification for a different address will follow. No professional profile is required.', form);
    // Only restore a previously directly entered address; never read this from provider metadata.
    node('a', 'Privacy notice — how we use your email', form, {href: config.privacyUrl});
    const contact = field(form, 'Contact email', 'email', saved?.contact_email || '', false, 254);
    contact.autocomplete = 'off';
    const tcl = check(form, copy.tcl, saved?.tcl_opt_in || false);
    node('p', 'Includes news, jobs, funding calls, events, venture-building support and partnerships.', form);
    const partner = check(form, copy.partner, saved?.partner_opportunities_opt_in || false);
    node('p', 'Both choices are optional. The Child Lens sends these emails. Choosing partner or sponsor opportunities does not share your contact details with those organisations. We do not use your Google or LinkedIn profile information for promotional targeting.', form);
    node('p', 'Saving these choices replaces any earlier email preferences. Earlier consent is not automatically transferred to these choices.', form);
    const privacy = node('p', 'Manage or withdraw your choices here, or email ', form);
    node('a', 'privacy@thechildlens.com', privacy, { href: 'mailto:privacy@thechildlens.com' }); privacy.append('.');
    node('a', 'Read the Privacy Notice', form, { href: config.privacyUrl });
    const save = node('button', 'Save email preferences', form, { type: 'submit', className: 'btn-primary profile-provider' });
    const status = message(form);
    form.onsubmit = event => {
      event.preventDefault();
      if (save.disabled) return;
      if ((tcl.checked || partner.checked) && (!contact.value.trim() || !contact.checkValidity())) {
        feedback(status, 'Enter a valid contact email, or untick both choices to withdraw.'); contact.focus(); return;
      }
      if ((tcl.checked || partner.checked) && contact.value.trim().toLowerCase() !== (user.email || '').toLowerCase()) {
        feedback(status, 'For now, enter the verified sign-in email shown above. A different contact address needs separate verification.'); contact.focus(); return;
      }
      saveRequest(save, status, 'save_contact_preferences', {
        p_contact: contact.value.trim(), p_tcl: tcl.checked, p_partner_opportunities: partner.checked
      }, () => {
        if (!tcl.checked && !partner.checked) contact.value = '';
        feedback(status, tcl.checked || partner.checked ? 'Your email preferences have been saved. No professional profile has been created or changed.' : 'Your email choices have been withdrawn and the active contact address has been cleared.');
      });
    };
  }
  function providerPictures(user) {
    const photos = [];
    for (const identity of user.identities || []) {
      if (!['google', 'linkedin_oidc'].includes(identity.provider)) continue;
      const raw = identity.identity_data?.picture || identity.identity_data?.avatar_url;
      try {
        const url = new URL(raw);
        const hosts = identity.provider === 'google' ? ['googleusercontent.com'] : ['licdn.com', 'licdn-ei.com'];
        if (url.protocol !== 'https:' || url.username || url.password || !hosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) continue;
        photos.push({ provider: identity.provider, url: url.href, label: identity.provider === 'google' ? 'Google' : 'LinkedIn' });
      } catch { /* A provider picture is optional and may be absent or expired. */ }
    }
    return photos;
  }
  async function profile(user, stamp) {
    const loading = accountShell('Your professional profile');
    loading.textContent = 'Loading your profile…';
    let result;
    try { result = await bounded(client.from('member_profiles').select('display_name,role,bio,interests,organisation_ids,photo_provider,city,country,linkedin_url').eq('user_id', user.id).maybeSingle()); }
    catch { feedback(loading, 'Your profile could not be loaded. You can sign out or reopen this screen to retry.'); return; }
    if (stamp !== generation) return;
    if (result.error) { feedback(loading, 'Your profile could not be loaded. Reopen this screen to retry.'); return; }
    const saved = result.data;
    loading.textContent = '';
    node('p', 'Build a professional introduction and link your self-reported affiliations. This profile and its preview are private. Saving it does not subscribe you to emails.', modal);
    const form = node('form', '', modal, { noValidate: true });
    const name = field(form, 'Professional name', 'text', saved?.display_name || '', true, 120);
    name.autocomplete = 'name';
    const role = field(form, 'Role', 'text', saved?.role || '', false, 160);
    const bio = field(form, 'Short professional bio', 'textarea', saved?.bio || '', false, 1000);
    const interests = field(form, 'Areas of interest', 'text', saved?.interests || '', false, 500);
    const photos = providerPictures(user);
    let photoProvider = saved?.photo_provider || null;
    const photoSection = node('fieldset', '', form);
    node('legend', 'Profile picture (optional)', photoSection);
    node('p', 'Choose a picture already supplied by a connected sign-in account. It is used only in your private professional profile and preview. Loading it contacts the provider’s image service. You can remove it here; no picture is copied into contact records.', photoSection);
    const picture = node('img', '', photoSection, { className: 'profile-avatar', alt: 'Your chosen profile picture', hidden: true, referrerPolicy: 'no-referrer' });
    const pictureStatus = message(photoSection);
    function showPicture() {
      const chosen = photos.find(photo => photo.provider === photoProvider);
      picture.hidden = !chosen;
      if (chosen) picture.src = chosen.url;
      else picture.removeAttribute('src');
      pictureStatus.textContent = photoProvider && !chosen ? 'Your chosen account picture is unavailable. Reconnect that provider or choose no picture.' : '';
    }
    picture.onerror = () => { picture.hidden = true; pictureStatus.textContent = 'This picture could not be loaded. You can still save without a visible picture.'; };
    const removePhoto = node('button', 'Use no picture', photoSection, { type: 'button', className: 'btn-secondary' });
    removePhoto.onclick = async () => { try { await window.MCHAccountExtras.clearPhoto(client,user); photoProvider = null; showPicture(); } catch {pictureStatus.textContent='The custom photo could not be removed. Try again.';} };
    for (const photo of photos) {
      const choose = node('button', `Use my ${photo.label} picture`, photoSection, { type: 'button', className: 'btn-secondary' });
      choose.onclick = async () => { try { await window.MCHAccountExtras.clearPhoto(client,user); photoProvider = photo.provider; showPicture(); } catch {pictureStatus.textContent='The photo choice could not be saved. Try again.';} };
    }
    if (!photos.length) node('p', 'No picture is available from your connected account. A picture is not required.', photoSection);
    showPicture();
    window.MCHAccountExtras.mountPhoto(client, user, photoSection, picture, pictureStatus);
    const orgs = node('fieldset', '', form);
    node('legend', 'Organisation affiliations (self-reported)', orgs);
    const selected = new Set((saved?.organisation_ids || []).map(String));
    const selectedList = node('div', '', orgs, { className: 'profile-selected-organisations' });
    const search = field(orgs, 'Search for an organisation', 'search', '', false, 200);
    const options = node('div', '', orgs, { className: 'profile-organisations' });
    const affiliationStatus = message(orgs);
    let organisations = [];
    try {
      const result = await client.from('organisations').select('id,name,type,city,country').abortSignal(AbortSignal.timeout(5000));
      if (result.error || !Array.isArray(result.data) || !result.data.length) throw new Error('directory');
      organisations = result.data;
    } catch {
      try {
        const res = await fetch('data/organisations.json', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error('directory');
        organisations = await res.json();
      } catch { organisations = []; }
    }
    if (stamp !== generation) return;
    organisations = (Array.isArray(organisations) ? organisations : []).filter(org => org.id != null && typeof org.name === 'string');
    organisations.sort((a, b) => a.name.localeCompare(b.name));
    function renderSelection() {
      selectedList.replaceChildren();
      node('p', `${selected.size} selected (maximum 30)`, selectedList);
      for (const id of selected) {
        const org = organisations.find(org => String(org.id) === id);
        const row = node('div', '', selectedList, { className: 'profile-affiliation' });
        if (org) node('a', org.name, row, { href: `index.html?organisation=${encodeURIComponent(id)}#directory`, rel: 'noopener' });
        else node('span', `Previously selected organisation (${id}) — currently unavailable`, row);
        const remove = node('button', 'Remove', row, { type: 'button', className: 'btn-secondary' });
        remove.setAttribute('aria-label', `Remove ${org?.name || id}`);
        remove.onclick = () => { selected.delete(id); renderSelection(); renderMatches(); };
      }
    }
    function renderMatches() {
      options.replaceChildren();
      const term = search.value.trim().toLowerCase();
      if (term.length < 2) { affiliationStatus.textContent = organisations.length ? 'Type at least two characters to find an organisation.' : 'Organisation search is unavailable. Existing affiliations are retained; you can still save.'; return; }
      const matches = organisations.filter(org => !selected.has(String(org.id)) && org.name.toLowerCase().includes(term));
      affiliationStatus.textContent = matches.length ? `${matches.length} matches${matches.length > 5 ? '; showing the first 5. Refine your search to see others.' : '.'}` : 'No unselected matches. You can suggest an organisation below or leave affiliations empty.';
      for (const org of matches.slice(0, 5)) {
        const b = node('button', `Add ${org.name}`, options, { type: 'button', className: 'btn-primary profile-provider' });
        b.onclick = () => {
          if (selected.size >= 30) { feedback(affiliationStatus, 'You can select up to 30 affiliations. Remove one before adding another.'); return; }
          selected.add(String(org.id)); search.value = ''; renderSelection(); renderMatches();
        };
      }
    }
    search.oninput = renderMatches; renderSelection(); renderMatches();
    node('a', 'Suggest a missing organisation', orgs, { href: 'index.html?suggest=organisation', rel: 'noopener' });
    node('p', 'Independent or pre-company? Leave affiliations empty. Affiliation does not verify employment or grant permission to edit an organisation.', orgs);
    legal(form);
    const visibilityPanel = node('section', '', modal);
    window.MCHAccountExtras.mountAffiliations(client,user,visibilityPanel,selected,organisations);
    const preview = node('section', '', form, { className: 'profile-preview', hidden: true });
    preview.setAttribute('aria-label', 'Professional profile preview');
    const previewButton = node('button', 'Preview professional profile', form, { type: 'button', className: 'btn-primary profile-provider' });
    previewButton.onclick = () => {
      preview.replaceChildren(); preview.hidden = false;
      const photo = photos.find(photo => photo.provider === photoProvider);
      if (!picture.hidden && picture.src) node('img', '', preview, { src: picture.src, alt: 'Your chosen profile picture', className: 'profile-avatar', referrerPolicy: 'no-referrer' });
      node('h3', name.value.trim() || 'Your professional name', preview);
      node('p', role.value.trim(), preview); node('p', bio.value.trim(), preview);
      node('p', interests.value.trim() ? `Interests: ${interests.value.trim()}` : '', preview);
      node('h4', 'Your affiliations', preview);
      for (const org of organisations.filter(org => selected.has(String(org.id)))) node('a', org.name, preview, { href: `index.html?organisation=${encodeURIComponent(org.id)}#directory`, rel: 'noopener' });
      for (const id of selected) if (!organisations.some(org => String(org.id) === id)) node('p', 'Previously selected organisation — currently unavailable', preview);
      if (!selected.size) node('p', 'Independent / no organisation listed', preview);
      node('p', 'Private preview only. Emails and contact preferences are excluded. Choose public affiliations separately; this preview remains private.', preview);
      preview.scrollIntoView?.({ block: 'nearest' });
    };
    const save = node('button', 'Save professional profile', form, { type: 'submit', className: 'btn-primary profile-provider' });
    const status = message(form);
    form.onsubmit = event => {
      event.preventDefault();
      if (!name.value.trim()) { feedback(status, 'Enter your professional name to save a profile. Email preferences do not require one.'); name.focus(); return; }
      saveRequest(save, status, 'save_professional_profile', {
        p_name: name.value.trim(), p_role: role.value.trim(), p_bio: bio.value.trim(), p_interests: interests.value.trim(), p_organisations: [...selected], p_photo_provider: photoProvider
      }, () => { feedback(status, 'Your professional profile has been saved privately. Your email preferences have not changed.');
        window.dispatchEvent?.(new Event('mch:affiliations-changed'));
        visibilityPanel.replaceChildren();window.MCHAccountExtras.mountAffiliations(client,user,visibilityPanel,selected,organisations);
      });
    };
  }
  async function refresh() {
    const stamp = ++generation;
    if (!config.enabled) { login(); return; }
    shell(route === 'profile' ? 'Your professional profile' : route === 'updates' ? 'Your email preferences' : 'Your account');
    node('p', 'Loading your account…', modal, {className:'account-loading',role:'status'});
    await getClient();
    const { data, error } = await bounded(client.auth.getUser());
    if (stamp !== generation) return;
    currentUser = error ? null : data.user;
    opener.textContent = 'My account';
    if (currentUser) {
      if (!window.MCHAccountExtras) { showUnavailable(); return; }
      const ready = await window.MCHAccountExtras.ensureEligible(client, currentUser, () => {
        accountShell('Finish account setup'); return node('section', '', modal);
      }, () => refresh().catch(showUnavailable));
      if (stamp !== generation || !ready) return;
      if (route === 'profile') await profile(currentUser, stamp);
      else if (route === 'updates') await preferences(currentUser, stamp);
      else if (route === 'suggest') suggestion(currentUser);
      else await account(currentUser, stamp);
    }
    else {
      login();
      if (isReturn) node('p', 'The sign-in link could not be completed. Request a new email link or try signing in again in this browser.', modal, { role: 'status' });
    }
  }
  const returnUrl = new URL(window.location.href);
  const fragment = new URLSearchParams(returnUrl.hash.slice(1));
  let isReturn = returnUrl.searchParams.has('code') || returnUrl.searchParams.has('error') || fragment.has('access_token') || fragment.has('error');
  function cleanReturn() {
    isReturn = false;
    for (const key of ['code', 'error', 'error_code', 'error_description']) returnUrl.searchParams.delete(key);
    if (fragment.has('access_token') || fragment.has('error')) returnUrl.hash = '';
    window.history?.replaceState(null, '', returnUrl.pathname + returnUrl.search + returnUrl.hash);
  }
  if (config.enabled && isReturn) {
    dialog.showModal();
    if (returnUrl.searchParams.has('error') || fragment.has('error')) {
      cleanReturn(); login();
      node('p', 'Sign-in was cancelled or the link has expired. Please request a new link or try signing in again.', modal, { role: 'status' });
      const stamp = ++generation;
      getClient().then(() => {
        if (stamp !== generation) return;
        login(); node('p', 'Sign-in was cancelled or the link has expired. Please request a new link or try signing in again.', modal, { role: 'status' });
      }).catch(showUnavailable);
    } else refresh().then(cleanReturn).catch(() => { cleanReturn(); showUnavailable(); });
  }
  opener.addEventListener('pointerenter', () => { if(config.enabled)getClient().catch(() => {}); }, {once:true});
  opener.addEventListener('focus', () => { if(config.enabled)getClient().catch(() => {}); }, {once:true});
  const updatesOpener = document.getElementById('updatesBtn');
  updatesOpener?.addEventListener('click', () => { route = 'updates'; if (!dialog.open) dialog.showModal(); refresh().catch(showUnavailable); });
  opener.addEventListener('click', () => { if(dialog.open)return;route='home';const opening=refresh();dialog.showModal();opening.catch(showUnavailable); });
  if (new URLSearchParams(window.location.search).get('account') === '1') {
    dialog.showModal();
    refresh().catch(showUnavailable);
  }
  dialog.addEventListener('close', () => { generation++; });
  // Restore the returning-user label independently; never delay directory/map startup.
  let hasSavedSession = Boolean(client);
  try { hasSavedSession ||= Boolean(window.localStorage?.getItem('sb-zbhvwduyohpiiksyjqba-auth-token')); } catch { /* Storage may be unavailable. */ }
  if (config.enabled && !isReturn && hasSavedSession) setTimeout(() => {
    getClient().then(c => c.auth.getSession()).then(({ data }) => {
      opener.textContent = 'My account';
    }).catch(() => {});
  }, 0);
})();
