'use strict';
// Local date validation for the single account-onboarding declaration.
(function(root){
  function eligible(value, today = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const birth = new Date(0);
    birth.setFullYear(year, month - 1, day); birth.setHours(0, 0, 0, 0);
    if (year < 1900 || birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day || birth > today) return null;
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
    return age >= 16;
  }
  const api={eligible};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.MCHAgeGate=api;
})(typeof window==='undefined'?globalThis:window);
