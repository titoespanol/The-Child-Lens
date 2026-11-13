'use strict';
// Age eligibility is an account onboarding step, not a sign-in prerequisite.
(() => {
  const root = document.getElementById('onboarding-root');
  root.textContent = 'Loading professional profile…';
  const script = document.createElement('script'); script.src = 'onboarding.js';
  script.onerror = () => { root.textContent = 'Your profile could not load. Refresh to try again.'; };
  document.head.append(script);
})();
