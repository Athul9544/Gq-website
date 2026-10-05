// Ported from goldenqube-local: pinned horizontal hand-off with zooming photos, blade + wipe point cards.
(function () {
  var frameJobs = [], queued = false;
  function runFrame() { queued = false; for (var i = 0; i < frameJobs.length; i++) frameJobs[i](); }
  function scheduleFrame() { if (!queued) { queued = true; requestAnimationFrame(runFrame); } }
  function onScrollFrame(job) { frameJobs.push(job); job(); }
  window.addEventListener('scroll', scheduleFrame, { passive: true });
  window.addEventListener('resize', scheduleFrame, { passive: true });
  window.addEventListener('orientationchange', scheduleFrame, { passive: true });

  var STAGES = { '': { h: [.08, .40], p: [.42, .78] }, 'zoom-first': { p: [.04, .26], h: [.34, .55], p2: [.60, .84] } };
  function ease(v) { return 1 - Math.pow(1 - v, 2.2); }
  function stage(raw, from, to) { var v = (raw - from) / (to - from); return v < 0 ? 0 : v > 1 ? 1 : v; }

  function initHorizontalSlide() {
    var tracks = document.querySelectorAll('[data-hslide]');
    if (!tracks.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    function update() {
      for (var i = 0; i < tracks.length; i++) {
        var el = tracks[i], rect = el.getBoundingClientRect();
        var travel = rect.height - window.innerHeight;
        var raw = travel > 0 ? -rect.top / travel : 0;
        var s = STAGES[el.getAttribute('data-hslide')] || STAGES[''];
        el.style.setProperty('--h', stage(raw, s.h[0], s.h[1]).toFixed(4));
        el.style.setProperty('--p', ease(stage(raw, s.p[0], s.p[1])).toFixed(4));
        if (s.p2) el.style.setProperty('--p2', ease(stage(raw, s.p2[0], s.p2[1])).toFixed(4));
      }
    }
    onScrollFrame(update);
  }

  function initBlades() {
    var groups = document.querySelectorAll('[data-points]');
    for (var g = 0; g < groups.length; g++) (function (group) {
      var cards = group.querySelectorAll('.blade'); if (cards.length < 2) return;
      var hoverable = window.matchMedia('(hover: hover) and (pointer: fine)');
      function open(card) {
        if (card.classList.contains('is-active')) return;
        for (var i = 0; i < cards.length; i++) { var on = cards[i] === card; cards[i].classList.toggle('is-active', on); cards[i].setAttribute('aria-expanded', on ? 'true' : 'false'); }
      }
      for (var i = 0; i < cards.length; i++) (function (card) {
        card.addEventListener('click', function () { open(card); });
        card.addEventListener('focus', function () { open(card); });
        card.addEventListener('mouseenter', function () { if (hoverable.matches) open(card); });
      })(cards[i]);
    })(groups[g]);
  }

  function initTapReveals() {
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var nodes = document.querySelectorAll('.wipe');
    for (var i = 0; i < nodes.length; i++) (function (el) {
      el.addEventListener('click', function () {
        var lit = el.classList.contains('is-lit');
        for (var j = 0; j < nodes.length; j++) nodes[j].classList.remove('is-lit');
        if (!lit) el.classList.add('is-lit');
      });
    })(nodes[i]);
  }

  var ZOOM_SPAN = 70 / 110;
  function initZoomOut() {
    var tracks = document.querySelectorAll('[data-zoom]');
    if (!tracks.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    function update() {
      for (var i = 0; i < tracks.length; i++) {
        var rect = tracks[i].getBoundingClientRect();
        var travel = rect.height - window.innerHeight;
        var p = travel > 0 ? -rect.top / travel : 0;
        p = p / ZOOM_SPAN; if (p < 0) p = 0; if (p > 1) p = 1;
        tracks[i].style.setProperty('--p', (1 - Math.pow(1 - p, 2.2)).toFixed(4));
      }
    }
    onScrollFrame(update);
  }
  initHorizontalSlide(); initZoomOut(); initBlades(); initTapReveals();
})();

// Service cards -> their detail panel (two panels per pinned track: first settled at 28%, second at 86%).
(function () {
  var section = document.getElementById('services-detail');
  if (!section) return;
  var tracks = section.querySelectorAll('.hs');
  var slugs = ['seo','performance-marketing','influencer-marketing','social-impact-marketing','web-development','lead-generation','designing','video-editing','ai-ad-videos','ai-automation','mobile-app-development'];
  function targetFor(i) { return { hs: tracks[Math.floor(i / 2)], frac: (i % 2 === 0) ? 0.28 : 0.86 }; }
  function topFor(i) { var t = targetFor(i); var travel = t.hs.offsetHeight - window.innerHeight; return t.hs.getBoundingClientRect().top + window.pageYOffset + travel * t.frac; }
  function glide(i) {
    var top = topFor(i), start = window.pageYOffset, dist = top - start, dur = Math.min(1400, 500 + Math.abs(dist) * 0.15), t0 = null;
    function step(ts) { if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / dur); k = 1 - Math.pow(1 - k, 3); window.scrollTo(0, start + dist * k); if (k < 1) requestAnimationFrame(step); else window.scrollTo(0, topFor(i)); }
    requestAnimationFrame(step);
    setTimeout(function () { if (Math.abs(window.pageYOffset - topFor(i)) > 4) window.scrollTo(0, topFor(i)); }, dur + 120);
  }
  slugs.forEach(function (slug, i) {
    var card = document.querySelector('.hiw-card[data-i="' + i + '"]');
    if (card) {
      card.classList.add('is-link'); card.setAttribute('role', 'link'); card.setAttribute('tabindex', '0');
      card.addEventListener('click', function () { glide(i); });
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); glide(i); } });
    }
    if (window.location.hash === '#svc-' + slug) {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      function land() { window.scrollTo(0, topFor(i)); window.dispatchEvent(new Event('scroll')); }
      land();
      window.addEventListener('load', function () { [0, 150, 400, 900, 1600, 2500].forEach(function (t) { setTimeout(land, t); }); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(land);
    }
  });
})();

// Touch devices: light the point card nearest the middle of the screen while scrolling (same blob animation as hover).
(function () {
  if (!(window.matchMedia && window.matchMedia('(hover: none)').matches)) return;
  var cards = document.querySelectorAll('.gq-port .wipe');
  if (!cards.length) return;
  var ticking = false, manual = null;
  function pick() {
    ticking = false;
    if (manual) return;
    var mid = window.innerHeight / 2, best = null, bestD = Infinity;
    cards.forEach(function (c) {
      var b = c.getBoundingClientRect(); var d = Math.abs(b.top + b.height / 2 - mid);
      if (b.bottom > 0 && b.top < window.innerHeight && d < bestD) { bestD = d; best = c; }
    });
    cards.forEach(function (c) { c.classList.toggle('is-lit', c === best); });
  }
  cards.forEach(function (c) { c.addEventListener('click', function () { manual = c; setTimeout(function () { manual = null; }, 2500); }); });
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }, { passive: true });
  pick();
})();
