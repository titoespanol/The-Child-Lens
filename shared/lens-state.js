/* Keep the existing homepage lens effect in step with the other site routes. */
(function () {
  var key = 'tcl-child-lens-enabled';
  var wanted = false;
  try { wanted = localStorage.getItem(key) === '1'; } catch (_) {}
  var initialised = false;
  var switching = false;

  function button() {
    return Array.prototype.find.call(document.querySelectorAll('header button'), function (item) {
      return /^(CHILD|ADULT) LENS$/i.test(item.textContent.trim());
    });
  }

  function sync() {
    var control = button();
    if (!control) return;
    var enabled = /^ADULT LENS$/i.test(control.textContent.trim());
    control.classList.add('tcl-home-switch');
    control.setAttribute('role', 'switch');
    control.setAttribute('aria-label', 'Child Lens playful view');
    control.setAttribute('aria-checked', String(enabled));
    if (!initialised && wanted !== enabled && !switching) {
      switching = true;
      control.click();
      setTimeout(function () { switching = false; initialised = true; sync(); }, 60);
      return;
    }
    initialised = true;
    wanted = enabled;
    try { localStorage.setItem(key, enabled ? '1' : '0'); } catch (_) {}
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest && event.target.closest('header button.tcl-home-switch')) {
      setTimeout(sync, 60);
    }
  });
  new MutationObserver(sync).observe(document.body, { childList: true, characterData: true, subtree: true });
  sync();
})();
