// About page: staggered reveal-on-scroll
(function () {
  var els = document.querySelectorAll('.rv');
  if (!els.length || !('IntersectionObserver' in window)) { els.forEach && els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, sib = Array.prototype.slice.call(el.parentNode.querySelectorAll(':scope > .rv'));
      el.style.transitionDelay = (Math.max(0, sib.indexOf(el)) * 90) + 'ms';
      el.classList.add('in'); io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (e) { io.observe(e); });
})();

// count-up for the 100+ stat
(function () {
  var el = document.querySelector('[data-count]'); if (!el || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (e) {
    if (!e[0].isIntersecting) return; io.disconnect();
    var target = +el.getAttribute('data-count'), t0 = null;
    function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1400); k = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(target * k); if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }, { threshold: .5 });
  io.observe(el);
})();
