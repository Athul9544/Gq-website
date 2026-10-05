// Scroll-driven "how it works" card stack: each card rotates and flies off up-right
// as the user scrolls, revealing the next one beneath it.
(function () {
  var section = document.querySelector('.hiw-section');
  if (!section) return;
  var cards = Array.prototype.slice.call(section.querySelectorAll('.hiw-card'));
  var n = cards.length;
  var ease = function (t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); };

  var forced = null; // optional override, used for previews/debugging
  window.hiwSetProgress = function (v) { forced = v; render(); };

  function render() {
    var rect = section.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = section.offsetHeight - vh;          // scrollable distance inside the section
    var p = total > 0 ? -rect.top / total : 0;      // 0..1 overall progress
    if (forced !== null) p = forced;
    p = p < 0 ? 0 : p > 1 ? 1 : p;

    // leave a little settle time at start and end
    var start = 0.08, end = 0.92;
    var span = (end - start) / n;

    cards.forEach(function (card, i) {
      var t = ease((p - (start + i * span)) / span); // 0 = resting, 1 = fully gone
      var depth = 0;                                 // how many cards still sit on top of this one
      for (var j = 0; j < i; j++) { if (ease((p - (start + j * span)) / span) < 1) depth++; }
      var d = Math.min(depth, 3);                    // only the nearest 3 cards peek out
      var restX = -11 * d, restScale = 1 - d * 0.015; // px offset to the left, slightly smaller
      var fx = t * 140, fy = -t * 150, rot = t * 28, sc = restScale + t * 0.08;
      card.style.transform = 'translate3d(' + restX + 'px,0,0) translate3d(' + fx + '%,' + fy + '%,0) rotate(' + rot + 'deg) scale(' + sc + ')';
      card.style.opacity = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
      card.style.zIndex = n - i;
      card.style.visibility = t >= 1 ? 'hidden' : 'visible';
    });
  }

  var ticking = false;
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { render(); ticking = false; }); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  render();
})();

// On pages without the services detail (e.g. home), every card links to its panel on the Services page.
(function () {
  if (document.getElementById('services-detail')) return;
  var slugs = ['seo','performance-marketing','influencer-marketing','social-impact-marketing','web-development','lead-generation','designing','video-editing','ai-ad-videos','ai-automation','mobile-app-development'];
  slugs.forEach(function (slug, i) {
    var card = document.querySelector('.hiw-card[data-i="' + i + '"]');
    if (!card) return;
    card.classList.add('is-link'); card.setAttribute('role', 'link'); card.setAttribute('tabindex', '0');
    function go() { window.location.href = '/brand-solutions#svc-' + slug; }
    card.addEventListener('click', go);
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
})();
