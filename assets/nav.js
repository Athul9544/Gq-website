// Keep the gold underline on the navigation link for the page you're on.
// (Webflow's own "current" class can be dropped when the URL has a trailing slash, so we mark it ourselves.)
(function () {
  function mark() {
    var path = location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
    var links = document.querySelectorAll('.navbar-2 .nav-menu a.text-weight-medium');
    var found = false;
    links.forEach(function (a) {
      var href = (a.getAttribute('href') || '').replace(/\/+$/, '') || '/';
      var active = href === path || (href !== '/' && path.indexOf(href + '/') === 0);
      a.classList.toggle('gq-active', active);
      if (active) found = true;
    });
    // work detail pages live under /works/ -> treat as Blog
    if (!found && path.indexOf('/works') === 0) {
      var blog = document.querySelector('.navbar-2 .nav-menu a[href="/our-campaigns"]');
      if (blog) blog.classList.add('gq-active');
    }
  }
  mark();
  window.addEventListener('load', mark);
  setTimeout(mark, 800); // after Webflow's own link handling runs
})();

// Footer social icons: align to the right edge of the page (24px in), whatever the container width.
(function () {
  var s = document.querySelector('.footer-bottom-content .team-social');
  var w = document.querySelector('.footer-wrapper');
  if (!s || !w) return;
  function place() {
    if (window.innerWidth <= 991) { s.style.right = ''; return; }
    var r = w.getBoundingClientRect();
    s.style.right = (-(window.innerWidth - r.right) + 24 + 96) + 'px';  // 24px from the edge, then 6 steps (96px) back in
  }
  place(); window.addEventListener('resize', place); window.addEventListener('load', place); setTimeout(place, 800);
})();

// Our Expertise cards: 3D tilt following the cursor.
(function () {
  var cards = document.querySelectorAll('.gq-card-link .card.is-first');
  if (!cards.length || !(window.matchMedia && window.matchMedia('(hover: hover)').matches)) return;
  cards.forEach(function (card) {
    var link = card.parentNode;
    link.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg');
    });
    link.addEventListener('mouseleave', function () { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });
})();
