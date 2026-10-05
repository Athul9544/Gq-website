// Performance helpers:
//  - pause the hero brand-card animations while the hero is off-screen
//  - pause looping background videos that are out of view, resume when visible
//  - respect prefers-reduced-motion
(function () {
  if (!('IntersectionObserver' in window)) return;

  // 1) hero cards: only animate while visible
  var hero = document.querySelector('.hero');
  if (hero) {
    var io = new IntersectionObserver(function (e) {
      hero.classList.toggle('is-offscreen', !e[0].isIntersecting);
    }, { threshold: 0.05 });
    io.observe(hero);
  }

  // 2) background videos: play only when near the viewport
  var vids = document.querySelectorAll('video');
  if (vids.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (!v.paused) { v.pause(); }
      });
    }, { rootMargin: '200px 0px' });
    vids.forEach(function (v) { v.setAttribute('preload', 'metadata'); vio.observe(v); });
  }
})();
