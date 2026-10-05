// Team list: hover reveals the portrait (CSS). On touch devices, tap toggles a row open.
(function () {
  var rows = document.querySelectorAll('.team-row');
  if (!rows.length) return;
  var touch = window.matchMedia('(hover: none)').matches;
  if (!touch) return;
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      var open = row.classList.contains('open');
      rows.forEach(function (r) { r.classList.remove('open'); });
      if (!open) row.classList.add('open');
    });
  });
})();


// On touch devices, automatically open the team row nearest the middle of the screen while scrolling.
(function autoReveal() {
  var rows = document.querySelectorAll('.team-row');
  if (!rows.length) return;
  if (!(window.matchMedia && window.matchMedia('(hover: none)').matches)) return;
  var ticking = false;
  function pick() {
    ticking = false;
    var mid = window.innerHeight / 2, best = null, bestD = Infinity;
    rows.forEach(function (r) {
      var b = r.getBoundingClientRect(); var c = b.top + b.height / 2; var d = Math.abs(c - mid);
      if (b.bottom > 0 && b.top < window.innerHeight && d < bestD) { bestD = d; best = r; }
    });
    rows.forEach(function (r) { r.classList.toggle('open', r === best); });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  pick();
})();
