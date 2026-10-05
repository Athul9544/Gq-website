// Defer heavy media so phones don't download every video before the page is usable.
// Video sources are parked in data-src by the build; this restores them:
//   - phones: when the video is about to scroll into view
//   - larger screens: right after the page has loaded (same behaviour as before, just later)
(function () {
  var vids = document.querySelectorAll('video[data-gq-defer]');
  if (!vids.length) return;

  var isPhone = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;

  function restore(v) {
    if (v.dataset.gqLoaded) return;
    v.dataset.gqLoaded = '1';
    // phones get a lighter, phone-sized encode of the same clip
    if (isPhone && v.getAttribute('data-src-m')) {
      var srcEls = v.querySelectorAll('source');
      for (var s = 0; s < srcEls.length; s++) srcEls[s].remove();
      v.setAttribute('src', v.getAttribute('data-src-m'));
      v.preload = 'auto';
      v.load();
      var pm = v.play();
      if (pm && pm.catch) pm.catch(function () { });
      return;
    }
    var srcs = v.querySelectorAll('source[data-src]');
    for (var i = 0; i < srcs.length; i++) {
      srcs[i].setAttribute('src', srcs[i].getAttribute('data-src'));
      srcs[i].removeAttribute('data-src');
    }
    if (v.getAttribute('data-src')) {
      v.setAttribute('src', v.getAttribute('data-src'));
      v.removeAttribute('data-src');
    }
    v.preload = 'auto';
    v.load();
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay may be blocked; poster stays */ });
  }

  if (!isPhone) {
    if (document.readyState === 'complete') setTimeout(all, 0);
    else window.addEventListener('load', function () { setTimeout(all, 0); });
    function all() { for (var i = 0; i < vids.length; i++) restore(vids[i]); }
    return;
  }

  // on phones, cards that fall back to a poster frame never need their clip fetched
  var queue = [];
  for (var q = 0; q < vids.length; q++) {
    if (isPhone && vids[q].parentElement && vids[q].parentElement.hasAttribute('data-gq-poster')) continue;
    queue.push(vids[q]);
  }
  vids = queue;

  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < vids.length; i++) restore(vids[i]);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { restore(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: '150% 0px' });   // start fetching one and a half screens early
  for (var k = 0; k < vids.length; k++) io.observe(vids[k]);
})();
