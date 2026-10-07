/* Golden Qube blog: renders posts from /api/posts (managed at /admin) */
(function () {
  var ARROW = '<div class="blog-top-content"><div class="arrow-blog w-embed"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.07506 1.33529L4.08927 0.155563L12.8875 0.141348L12.8733 8.93958L11.6793 8.93958L11.6793 2.1739L1.55925 12.294L0.720646 11.4554L10.8407 1.33529L4.07506 1.33529Z" fill="currentColor"/></svg></div></div>';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function inline(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>'); }
  function toHtml(text) {
    var blocks = String(text || '').replace(/\r/g, '').split(/\n{2,}/), out = [];
    blocks.forEach(function (b) {
      b = b.trim(); if (!b) return;
      if (/^###\s/.test(b)) return out.push('<h4>' + inline(b.replace(/^###\s+/, '')) + '</h4>');
      if (/^##\s/.test(b)) return out.push('<h3>' + inline(b.replace(/^##\s+/, '')) + '</h3>');
      if (/^#\s/.test(b)) return out.push('<h2>' + inline(b.replace(/^#\s+/, '')) + '</h2>');
      if (/^(?:[-*]\s.*(?:\n|$))+$/.test(b)) return out.push('<ul>' + b.split('\n').map(function (l) { return '<li>' + inline(l.replace(/^[-*]\s+/, '')) + '</li>'; }).join('') + '</ul>');
      if (/^(?:\d+[.)]\s.*(?:\n|$))+$/.test(b)) return out.push('<ol>' + b.split('\n').map(function (l) { return '<li>' + inline(l.replace(/^\d+[.)]\s+/, '')) + '</li>'; }).join('') + '</ol>');
      if (/^>\s/.test(b)) return out.push('<blockquote>' + inline(b.replace(/^>\s?/gm, '')).replace(/\n/g, '<br>') + '</blockquote>');
      out.push('<p>' + inline(b).replace(/\n/g, '<br>') + '</p>');
    });
    return out.join('');
  }
  function fmtDate(d) { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  function href(p) { return p.link || ('/our-campaigns/' + p.slug); }
  /* Hostinger serves PHP, so posts come from /api/posts.php; a 404 falls back
     to the extensionless route in case the host provides that instead. */
  function getPosts(qs) {
    var url = '/api/posts.php' + qs;
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      return r.status === 404 ? fetch('/api/posts' + qs, { cache: 'no-store' }) : r;
    });
  }

  var grid = document.getElementById('blogGrid');
  if (grid) {
    getPosts('?_=' + Date.now()).then(function (r) { return r.json(); }).then(function (posts) {
      if (!Array.isArray(posts) || !posts.length) return;
      grid.innerHTML = posts.map(function (p) {
        return '<div role="listitem" class="works-item w-dyn-item"><a href="' + esc(href(p)) + '" class="blog-card w-inline-block">' + ARROW +
          '<div class="padding-right"><h2 class="text-size-xlarge text-weight-medium line-height-125">' + esc(p.title) + '</h2><p class="short-description">' + esc(p.excerpt) + '</p></div>' +
          '<div class="background-image"><div class="blog-overlay"></div><img alt="' + esc(p.title) + '" loading="lazy" src="' + esc(p.image) + '" class="image"/></div></a></div>';
      }).join('');
      // reveal cards as they enter the viewport (Webflow's IX2 only binds to the original DOM)
      var cards = grid.querySelectorAll('.blog-card');
      cards.forEach(function (c) { c.classList.add('gq-dyn'); });
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('gq-dyn-in'); io.unobserve(en.target); } });
        }, { rootMargin: '0px 0px -8% 0px' });
        cards.forEach(function (c) { io.observe(c); });
      } else { cards.forEach(function (c) { c.classList.add('gq-dyn-in'); }); }
    }).catch(function () { });
  }

  var art = document.getElementById('blogPost');
  if (art) {
    var cover = document.getElementById('postCover');
    var slug = decodeURIComponent(location.pathname.replace(/\/+$/, '').split('/').pop() || '');
    function sections(text) {
      // split content on "## Heading" lines into [{h, body}] ; text before the first heading becomes "Overview"
      var lines = String(text || '').replace(/\r/g, '').split('\n'), out = [], cur = { h: '', body: [] };
      lines.forEach(function (l) {
        var m = /^#{1,3}\s+(.+)$/.exec(l.trim());
        if (m) { if (cur.body.join('').trim() || cur.h) out.push(cur); cur = { h: m[1], body: [] }; }
        else cur.body.push(l);
      });
      if (cur.body.join('').trim() || cur.h) out.push(cur);
      return out.filter(function (s) { return s.body.join('').trim(); }).map(function (s) { return { h: s.h || 'Overview', html: toHtml(s.body.join('\n')) }; });
    }
    getPosts('?slug=' + encodeURIComponent(slug) + '&_=' + Date.now()).then(function (r) { return r.ok ? r.json() : null; }).then(function (p) {
      if (!p) { art.innerHTML = '<div class="gq-post-missing"><h1>Post not found</h1><p>This post may have been removed.</p><a href="/our-campaigns" class="gs-cta-btn">Back to Insights<span>&larr;</span></a></div>'; return; }
      document.title = p.title + ' | Golden Qube';
      var m = document.querySelector('meta[name="description"]'); if (m && p.excerpt) m.setAttribute('content', p.excerpt);
      if (cover) { if (p.image) cover.innerHTML = '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" class="project-image">'; else cover.parentNode.parentNode.parentNode.style.display = 'none'; }
      var meta = '';
      function block(label, items) { return '<div class="works-info-content"><div class="opacity-80"><div class="text-size-tiny caps">' + label + '</div></div>' + items.map(function (t) { return '<div class="text-size-regular santoshi">' + esc(t) + '</div>'; }).join('') + '</div>'; }
      if (p.industry) meta += block('Industry', [p.industry]);
      if (p.services && p.services.length) meta += block('Services', p.services);
      meta += block('Published', [fmtDate(p.date)]);
      var secs = sections(p.content);
      if (!secs.length && p.excerpt) secs = [{ h: 'Overview', html: '<p>' + esc(p.excerpt) + '</p>' }];
      var right = secs.map(function (s) { return '<div class="works-info-right"><h1 class="heading-5">' + esc(s.h) + '</h1><div class="rich-text w-richtext">' + s.html + '</div></div>'; }).join('');
      art.innerHTML = '<div class="works-info-content title"><div class="opacity-80"><div class="tag secondary"><div class="elipse blue"></div><div class="text-size-tiny caps text-weight-bold">' + esc(p.category || 'Insight') + '</div><div class="elipse blue"></div></div></div><div class="text-size-regular title">' + esc(p.title) + '</div></div>' +
        '<div class="gap-works"><div class="works-info gq-works-info"><div class="works-info-left">' + meta + '</div><div>' + right + '</div></div></div>' +
        '<div class="gq-post-back-wrap"><a href="/our-campaigns" class="gs-cta-btn">All Insights<span>&larr;</span></a></div>';
    }).catch(function () { art.innerHTML = '<div class="gq-post-missing"><h1>Could not load this post</h1></div>'; });
  }
})();
