(function() {
  'use strict';
  const root = document.documentElement;
  const accentSelect = document.getElementById('accentSelect');
  const darkToggle = document.getElementById('darkToggle');
  const audienceSelect = document.getElementById('audienceSelect');
  const ageSelect = document.getElementById('ageSelect');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const scrollProgress = document.getElementById('scrollProgress');
  const copyToast = document.getElementById('copyToast');
  const LS_KEYS = {
    accent: 'childlens-accent',
    theme: 'childlens-theme',
    audience: 'childlens-audience',
    age: 'childlens-age',
    reduceMotion: 'childlens-reduce-motion'
  };
  function persistSetting(key, value) {
    try { localStorage.setItem(key, value); } catch(e) {}
  }
  function loadSetting(key) {
    try { return localStorage.getItem(key); } catch(e) { return null; }
  }
  (function restoreSettings() {
    const savedAccent = loadSetting(LS_KEYS.accent);
    const savedTheme = loadSetting(LS_KEYS.theme);
    const savedAudience = loadSetting(LS_KEYS.audience);
    const savedAge = loadSetting(LS_KEYS.age);
    const savedMotion = loadSetting(LS_KEYS.reduceMotion);
    if (savedAccent && accentSelect) {
      setAccentStyles(savedAccent);
      accentSelect.value = savedAccent;
      const accentOpts = accentSelect.closest('.custom-dropdown')?.querySelectorAll('.custom-dropdown-option');
      if (accentOpts) accentOpts.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.value === savedAccent) {
          opt.classList.add('selected');
          const lbl = accentSelect.closest('.custom-dropdown')?.querySelector('.dd-label');
          if (lbl) lbl.textContent = opt.textContent.trim();
        }
      });
    }
    if (savedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      if (darkToggle) {
        const icon = darkToggle.querySelector('.toggle-icon');
        if (icon) icon.textContent = '☀️';
        darkToggle.setAttribute('aria-pressed', 'true');
      }
    }
    if (savedAudience && audienceSelect) {
      root.setAttribute('data-audience', savedAudience);
      audienceSelect.value = savedAudience;
      const audOpts = audienceSelect.closest('.custom-dropdown')?.querySelectorAll('.custom-dropdown-option');
      if (audOpts) audOpts.forEach(opt => {
        if (opt.dataset.value === savedAudience) {
          opt.classList.add('selected');
          const lbl = audienceSelect.closest('.custom-dropdown')?.querySelector('.dd-label');
          if (lbl) lbl.textContent = opt.textContent.trim();
        }
      });
    }
    if (savedAge && ageSelect) {
      root.setAttribute('data-age', savedAge);
      ageSelect.value = savedAge;
      const ageOpts = ageSelect.closest('.custom-dropdown')?.querySelectorAll('.custom-dropdown-option');
      if (ageOpts) ageOpts.forEach(opt => {
        if (opt.dataset.value === savedAge) {
          opt.classList.add('selected');
          const lbl = ageSelect.closest('.custom-dropdown')?.querySelector('.dd-label');
          if (lbl) lbl.textContent = opt.textContent.trim();
        }
      });
    }
    if (savedMotion === 'true') {
      root.setAttribute('data-reduce-motion', 'true');
      const motionBtn = document.getElementById('reduceMotionToggle');
      if (motionBtn) motionBtn.setAttribute('aria-pressed', 'true');
    }
  })();
  function setAccentStyles(color) {
    root.style.setProperty('--accent', color);
    root.style.setProperty('--accent-soft', 'color-mix(in srgb, ' + color + ' 15%, var(--color-cream))');
    root.style.setProperty('--accent-medium', 'color-mix(in srgb, ' + color + ' 40%, var(--color-cream))');
    root.style.setProperty('--accent-contrast', 'color-mix(in srgb, ' + color + ' 100%, #000 30%)');
    root.style.setProperty('--accent-muted', 'color-mix(in srgb, ' + color + ' 25%, var(--color-cream))');
  }
  if (accentSelect) {
    accentSelect.addEventListener('change', function() {
      const val = this.value;
      setAccentStyles(val);
      persistSetting(LS_KEYS.accent, val);
      root.dispatchEvent(new CustomEvent('childlens:settings-changed'));
    });
  }
  if (darkToggle) {
    darkToggle.addEventListener('click', function() {
      const isDark = root.getAttribute('data-theme') === 'dark';
      if (isDark) {
        root.setAttribute('data-theme', 'light');
        this.querySelector('.toggle-icon').textContent = '🌙';
        this.setAttribute('aria-pressed', 'false');
        persistSetting(LS_KEYS.theme, 'light');
      } else {
        root.setAttribute('data-theme', 'dark');
        this.querySelector('.toggle-icon').textContent = '☀️';
        this.setAttribute('aria-pressed', 'true');
        persistSetting(LS_KEYS.theme, 'dark');
      }
    });
  }
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    root.setAttribute('data-reduce-motion', 'true');
    const motionBtnPref = document.getElementById('reduceMotionToggle');
    if (motionBtnPref) motionBtnPref.setAttribute('aria-pressed', 'true');
  }
  const reduceMotionToggle = document.getElementById('reduceMotionToggle');
  if (reduceMotionToggle) {
    reduceMotionToggle.addEventListener('click', function() {
      const isOn = root.getAttribute('data-reduce-motion') === 'true';
      root.setAttribute('data-reduce-motion', isOn ? 'false' : 'true');
      this.setAttribute('aria-pressed', String(!isOn));
      persistSetting(LS_KEYS.reduceMotion, !isOn);
      root.dispatchEvent(new CustomEvent('childlens:settings-changed'));
    });
  }
  if (audienceSelect) {
    audienceSelect.addEventListener('change', function() {
      root.setAttribute('data-audience', this.value);
      persistSetting(LS_KEYS.audience, this.value);
      root.dispatchEvent(new CustomEvent('childlens:settings-changed'));
    });
  }
  if (ageSelect) {
    ageSelect.addEventListener('change', function() {
      root.setAttribute('data-age', this.value);
      persistSetting(LS_KEYS.age, this.value);
      root.dispatchEvent(new CustomEvent('childlens:settings-changed'));
    });
  }
  function getSidebarLinks() {
    return sidebar ? sidebar.querySelectorAll('.sidebar-link') : [];
  }
  var currentSectionId = '';
  function setActiveSection(id) {
    if (id === currentSectionId) return;
    currentSectionId = id;
    getSidebarLinks().forEach(function(link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }
  (function initScrollSpy() {
    var sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;
    if ('IntersectionObserver' in window) {
      var visibleSections = new Map();
      var spyObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });
        var bestId = '';
        var bestTop = Infinity;
        visibleSections.forEach(function(top, id) {
          var el = document.getElementById(id);
          if (el) {
            var rect = el.getBoundingClientRect().top;
            if (rect <= 150 && rect > -window.innerHeight * 0.5 && rect < bestTop) {
              bestTop = rect;
              bestId = id;
            }
          }
        });
        if (!bestId && visibleSections.size > 0) {
          visibleSections.forEach(function(top, id) {
            if (!bestId) bestId = id;
          });
        }
        if (bestId) setActiveSection(bestId);
      }, { rootMargin: '-60px 0px -40% 0px', threshold: 0 });
      sections.forEach(function(s) { spyObserver.observe(s); });
    } else {
      window.addEventListener('scroll', function() {
        var current = '';
        sections.forEach(function(s) {
          if (s.getBoundingClientRect().top <= 120) current = s.id;
        });
        setActiveSection(current);
      });
    }
  })();
  function updateScrollProgress() {
    if (!scrollProgress) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.width = h > 0 ? (window.scrollY / h * 100) + '%' : '0%';
  }
  if (sidebarToggle && sidebar && !document.getElementById('sidebarOverlay')) {
    sidebarToggle.addEventListener('click', function() { sidebar.classList.toggle('open'); });
    sidebar.addEventListener('click', function(e) {
      if (e.target.classList.contains('sidebar-link') && window.innerWidth <= 960) {
        sidebar.classList.remove('open');
      }
    });
  }
  var header = document.querySelector('.global-header');
  var ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        updateScrollProgress();
        if (header) {
          header.classList.toggle('scrolled', window.scrollY > 10);
        }
        ticking = false;
      });
      ticking = true;
    }
  });
  updateScrollProgress();
  (function initRevealSystem() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal, .section-header').forEach(function(el) {
        el.classList.add('is-visible');
      });
      return;
    }
    if (root.getAttribute('data-reduce-motion') === 'true') {
      document.querySelectorAll('.reveal, .section-header').forEach(function(el) {
        el.classList.add('is-visible');
      });
      return;
    }
    var revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0.01 });
    document.querySelectorAll('.card, .doctrine, .callout, .ecosystem-card, .do-dont-card, .metric-card, .pattern-detail, .data-table, .scorecard').forEach(function(el) {
      if (!el.classList.contains('reveal') && !el.classList.contains('is-visible') && !el.classList.contains('section-header')) {
        el.classList.add('reveal');
      }
    });
    document.querySelectorAll('.ecosystem-grid, .do-dont-grid, .metrics-grid, .doctrines-grid').forEach(function(el) {
      el.classList.add('reveal-stagger');
    });
    var allAnimated = document.querySelectorAll('.reveal, .section-header');
    allAnimated.forEach(function(el) {
      revealObserver.observe(el);
    });
    requestAnimationFrame(function() {
      allAnimated.forEach(function(el) {
        if (el.classList.contains('is-visible')) return;
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-visible');
          revealObserver.unobserve(el);
        }
      });
    });
    root.addEventListener('childlens:settings-changed', function() {
      if (root.getAttribute('data-reduce-motion') === 'true') {
        document.querySelectorAll('.reveal, .section-header').forEach(function(el) {
          el.classList.add('is-visible');
        });
      }
    });
  })();
  function initSidebarGroups() {
    if (!sidebar) return;
    var groups = sidebar.querySelectorAll('.sidebar-group');
    groups.forEach(function(group) {
      var header = group.querySelector('.sidebar-group-header');
      var items = group.querySelector('.sidebar-group-items');
      if (!header || !items) return;
      items.style.maxHeight = items.scrollHeight + 'px';
      header.addEventListener('click', function() {
        var isCollapsed = group.classList.contains('collapsed');
        if (isCollapsed) {
          group.classList.remove('collapsed');
          header.setAttribute('aria-expanded', 'true');
          items.style.maxHeight = items.scrollHeight + 'px';
        } else {
          group.classList.add('collapsed');
          header.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }
  initSidebarGroups();
  function initSidebarSearch() {
    var searchInput = document.getElementById('sidebarSearch');
    var clearBtn = document.getElementById('sidebarSearchClear');
    var noResults = document.getElementById('sidebarNoResults');
    if (!searchInput || !sidebar) return;
    var links = sidebar.querySelectorAll('.sidebar-link');
    var linkData = [];
    links.forEach(function(link) {
      linkData.push({
        el: link,
        text: link.textContent.trim().toLowerCase(),
        originalHTML: link.innerHTML
      });
    });
    function escapeHTML(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
    function doSearch(query) {
      query = query.toLowerCase().trim();
      var visibleCount = 0;
      linkData.forEach(function(item) {
        if (!query) {
          item.el.style.display = '';
          item.el.innerHTML = item.originalHTML;
          visibleCount++;
          return;
        }
        if (item.text.indexOf(query) !== -1) {
          item.el.style.display = '';
          var iconEl = item.el.querySelector('.sidebar-link-icon');
          var iconHTML = iconEl ? iconEl.outerHTML : '';
          var rawText = item.el.textContent.trim();
          var matchStart = rawText.toLowerCase().indexOf(query);
          if (matchStart !== -1) {
            var before = rawText.substring(0, matchStart);
            var match = rawText.substring(matchStart, matchStart + query.length);
            var after = rawText.substring(matchStart + query.length);
            item.el.innerHTML = iconHTML + escapeHTML(before) + '<mark>' + escapeHTML(match) + '</mark>' + escapeHTML(after);
          }
          visibleCount++;
        } else {
          item.el.style.display = 'none';
        }
      });
      sidebar.querySelectorAll('.sidebar-group').forEach(function(group) {
        var itemsContainer = group.querySelector('.sidebar-group-items');
        if (!itemsContainer) return;
        var hasVisible = false;
        itemsContainer.querySelectorAll('.sidebar-link').forEach(function(link) {
          if (link.style.display !== 'none') hasVisible = true;
        });
        if (query && !hasVisible) {
          group.style.display = 'none';
        } else {
          group.style.display = '';
          if (query && group.classList.contains('collapsed')) {
            group.classList.remove('collapsed');
            var hdr = group.querySelector('.sidebar-group-header');
            if (hdr) hdr.setAttribute('aria-expanded', 'true');
            if (itemsContainer) itemsContainer.style.maxHeight = itemsContainer.scrollHeight + 'px';
          }
        }
      });
      if (noResults) {
        noResults.style.display = (query && visibleCount === 0) ? 'block' : 'none';
      }
    }
    searchInput.addEventListener('input', function() {
      doSearch(this.value);
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchInput.focus();
        doSearch('');
      });
    }
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        this.value = '';
        doSearch('');
        this.blur();
      }
    });
  }
  initSidebarSearch();
  function showToast(msg) {
    if (!copyToast) return;
    copyToast.textContent = msg || 'Copied!';
    copyToast.classList.add('show');
    setTimeout(() => copyToast.classList.remove('show'), 1800);
  }
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const text = btn.getAttribute('data-copy');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast());
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast();
    }
  });
  function initCustomDropdowns() {
    document.querySelectorAll('.custom-dropdown').forEach(dd => {
      const trigger = dd.querySelector('.custom-dropdown-trigger');
      const menu = dd.querySelector('.custom-dropdown-menu');
      const options = dd.querySelectorAll('.custom-dropdown-option');
      const select = dd.querySelector('select') || dd.querySelector('input[type="hidden"]');
      if (!trigger || !menu) return;
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.custom-dropdown-menu.open').forEach(m => {
          if (m !== menu) m.classList.remove('open');
        });
        menu.classList.toggle('open');
      });
      options.forEach(opt => {
        opt.addEventListener('click', function(e) {
          e.stopPropagation();
          const val = this.dataset.value;
          const label = this.textContent.trim();
          trigger.querySelector('.dd-label').textContent = label;
          options.forEach(o => o.classList.remove('selected'));
          this.classList.add('selected');
          menu.classList.remove('open');
          if (select) {
            select.value = val;
            select.dispatchEvent(new Event('change'));
          }
        });
      });
      trigger.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger.click();
        }
        if (e.key === 'Escape') menu.classList.remove('open');
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-dropdown-menu.open').forEach(m => m.classList.remove('open'));
    });
  }
  initCustomDropdowns();
  function checkBackdropVideos() {
    const videos = document.querySelectorAll('.media-backdrop__media--video');
    const rm = root.getAttribute('data-reduce-motion') === 'true';
    videos.forEach(function(v) {
      if (rm) v.pause();
      else if (v.autoplay) v.play().catch(function(){});
    });
  }
  checkBackdropVideos();
  root.addEventListener('childlens:settings-changed', checkBackdropVideos);
  var LIQUID_DURATION = 500;
  var LIQUID_REDUCE = 150; // duration when reduce-motion is on
  function liquidMorph(indicator, fromX, fromW, toX, toW) {
    if (root.getAttribute('data-reduce-motion') === 'true') {
      indicator.style.width = toW + 'px';
      indicator.style.transform = 'translateX(' + toX + 'px)';
      return;
    }
    var direction = toX > fromX ? 1 : -1;
    var distance = Math.abs(toX - fromX);
    var stretch = Math.min(distance * 0.12, 16);
    var midX = (fromX + toX) / 2;
    var midW = Math.max(fromW, toW) + stretch * 2;
    var overshoot = Math.min(distance * 0.04, 4) * direction;
    var keyframes = [
      { transform: 'translateX(' + fromX + 'px) scaleY(1)', width: fromW + 'px', offset: 0 },
      { transform: 'translateX(' + fromX + 'px) scaleY(0.82)', width: fromW + 'px', offset: 0.18 },
      { transform: 'translateX(' + (midX - (midW - toW) / 2) + 'px) scaleY(0.78)', width: midW + 'px', offset: 0.50 },
      { transform: 'translateX(' + (toX + overshoot) + 'px) scaleY(1.06)', width: toW + 'px', offset: 0.75 },
      { transform: 'translateX(' + (toX - overshoot * 0.3) + 'px) scaleY(0.97)', width: toW + 'px', offset: 0.88 },
      { transform: 'translateX(' + toX + 'px) scaleY(1)', width: toW + 'px', offset: 1 }
    ];
    if (indicator._liquidAnim) {
      indicator._liquidAnim.cancel();
    }
    var anim = indicator.animate(keyframes, {
      duration: LIQUID_DURATION,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'none'
    });
    indicator.style.width = toW + 'px';
    indicator.style.transform = 'translateX(' + toX + 'px)';
    indicator._liquidAnim = anim;
    anim.finished.then(function() {
      indicator._liquidAnim = null;
    }).catch(function() {
    });
  }
  function initPillIndicator(container, itemSel, indicatorClass) {
    if (!container || container._pillInit) return;
    container._pillInit = true;
    var indicator = container.querySelector('.' + indicatorClass);
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = indicatorClass;
      container.appendChild(indicator);
    }
    indicator.style.display = 'block';
    function readPos() {
      var w = parseFloat(indicator.style.width) || 0;
      var m = (indicator.style.transform || '').match(/translateX\(([^)]+)px\)/);
      var x = m ? parseFloat(m[1]) : 0;
      return { x: x, w: w };
    }
    function snapTo(target) {
      if (!target) { indicator.style.opacity = '0'; return; }
      var cRect = container.getBoundingClientRect();
      var iRect = target.getBoundingClientRect();
      var x = iRect.left - cRect.left;
      var w = iRect.width;
      if (indicator._liquidAnim) { indicator._liquidAnim.cancel(); indicator._liquidAnim = null; }
      indicator.style.width = w + 'px';
      indicator.style.transform = 'translateX(' + x + 'px)';
      indicator.style.opacity = '1';
    }
    function animateTo(target) {
      if (!target) { indicator.style.opacity = '0'; return; }
      var from = readPos();
      var cRect = container.getBoundingClientRect();
      var iRect = target.getBoundingClientRect();
      var toX = iRect.left - cRect.left;
      var toW = iRect.width;
      indicator.style.opacity = '1';
      if (from.w === 0 || (Math.abs(from.x - toX) < 1 && Math.abs(from.w - toW) < 1)) {
        snapTo(target);
        return;
      }
      liquidMorph(indicator, from.x, from.w, toX, toW);
    }
    var positioned = false;
    function ensurePositioned() {
      if (positioned) return;
      var active = container.querySelector(itemSel + '.active');
      if (!active) return;
      var r = container.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        snapTo(active);
        positioned = true;
      }
    }
    container._ensurePositioned = ensurePositioned;
    requestAnimationFrame(ensurePositioned);
    container.addEventListener('click', function(e) {
      var item = e.target.closest(itemSel);
      if (!item || item.classList.contains('active')) return;
      var allItems = container.querySelectorAll(itemSel);
      allItems.forEach(function(el) { el.style.transition = 'none'; });
      allItems.forEach(function(el) { el.classList.remove('active'); });
      item.classList.add('active');
      container.offsetHeight; // force layout
      animateTo(item);
      requestAnimationFrame(function() {
        allItems.forEach(function(el) { el.style.transition = ''; });
      });
    });
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        snapTo(container.querySelector(itemSel + '.active'));
      }, 100);
    });
    root.addEventListener('childlens:settings-changed', function() {
      requestAnimationFrame(function() {
        snapTo(container.querySelector(itemSel + '.active'));
      });
    });
  }
  function initLiquidNav(navContainer) {
    if (!navContainer || navContainer._liquidNavInit) return;
    navContainer._liquidNavInit = true;
    var isPatternNav = navContainer.classList.contains('pattern-phone-nav');
    var itemSel = isPatternNav ? '.pattern-phone-nav-item' : '.nav-bottom-item';
    var indicatorClass = isPatternNav ? 'pattern-phone-nav-indicator' : 'nav-bottom-indicator';
    initPillIndicator(navContainer, itemSel, indicatorClass);
  }
  function initSegmentedControl(container) {
    if (!container || container._segmentedInit) return;
    container._segmentedInit = true;
    container.classList.add('has-indicator');
    initPillIndicator(container, '.segmented-item', 'segmented-indicator');
  }
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarToggle && sidebar && sidebarOverlay) {
    sidebarToggle.addEventListener('click', function() {
      const isOpen = sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('visible', isOpen);
    });
    sidebarOverlay.addEventListener('click', function() {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('visible');
    });
    sidebar.addEventListener('click', function(e) {
      if (e.target.classList.contains('sidebar-link') && window.innerWidth <= 960) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('visible');
      }
    });
  }
  var pendingIndicators = [];
  document.querySelectorAll('.nav-bottom, .pattern-phone-nav').forEach(function(nav) {
    initLiquidNav(nav);
    pendingIndicators.push(nav);
  });
  document.querySelectorAll('.segmented').forEach(function(seg) {
    initSegmentedControl(seg);
    pendingIndicators.push(seg);
  });
  function positionPendingIndicators() {
    pendingIndicators = pendingIndicators.filter(function(el) {
      if (el._ensurePositioned) {
        el._ensurePositioned();
        var ind = el.querySelector('.nav-bottom-indicator, .pattern-phone-nav-indicator, .segmented-indicator');
        return ind && !ind.style.width; // keep if still not positioned
      }
      return false;
    });
    if (pendingIndicators.length) {
      setTimeout(positionPendingIndicators, 500);
    }
  }
  setTimeout(positionPendingIndicators, 200);
  window.childLensShared = {
    showToast: showToast,
    root: root,
    persistSetting: persistSetting,
    loadSetting: loadSetting,
    LS_KEYS: LS_KEYS,
    checkBackdropVideos: checkBackdropVideos,
    initLiquidNav: initLiquidNav,
    initSegmentedControl: initSegmentedControl
  };
})();