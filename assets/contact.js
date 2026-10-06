// Contact form: validates, then sends the enquiry to the server, which emails it via Resend.
// Tries the PHP endpoint (Hostinger) first, then the serverless one (Vercel),
// and finally falls back to opening the visitor's mail app.
(function () {
  var form = document.getElementById('gc-form');
  if (!form) return;
  var note = document.getElementById('gc-note');
  var btn = form.querySelector('button[type="submit"], .dc-submit, button');
  var ENDPOINTS = ['/api/contact.php', '/api/contact'];

  function say(text, ok) {
    if (!note) return;
    note.textContent = text;
    note.className = 'gc-note dc-note ' + (ok ? 'is-ok' : 'is-error');
  }

  function post(url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        return { status: r.status, ok: r.ok, body: j };
      });
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var name = f.name.value.trim(), phone = f.phone.value.trim(),
        email = f.email.value.trim(), msg = f.message.value.trim();

    if (!name || !phone || !email) { say('Please enter your name, number and email.', false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say('Please enter a valid email address.', false); return; }

    var payload = { name: name, phone: phone, email: email, message: msg };
    var mailBody = 'Name: ' + name + '\nNumber: ' + phone + '\nEmail: ' + email + '\n\n' + msg;
    var label = btn ? btn.innerHTML : null;
    if (btn) { btn.disabled = true; btn.style.opacity = '.7'; }
    say('Sending…', true);

    function done() { if (btn) { btn.disabled = false; btn.style.opacity = ''; if (label) btn.innerHTML = label; } }

    function attempt(i) {
      if (i >= ENDPOINTS.length) {
        done();
        say('Could not send right now — opening your mail app…', false);
        setTimeout(function () {
          window.location.href = 'mailto:info@goldenqube.com?subject=' +
            encodeURIComponent('Website enquiry - ' + name) + '&body=' + encodeURIComponent(mailBody);
        }, 900);
        return;
      }
      post(ENDPOINTS[i], payload).then(function (out) {
        if (out.ok && out.body && out.body.ok) {
          done(); form.reset();
          say('Thanks! Your message is on its way — we’ll get back to you within 24 hours.', true);
          return;
        }
        // 404/405 means this endpoint doesn't exist on this host: try the next one.
        if (out.status === 404 || out.status === 405) { attempt(i + 1); return; }
        done();
        say((out.body && out.body.error) || 'Could not send the message. Please try again.', false);
      }).catch(function () { attempt(i + 1); });
    }
    attempt(0);
  });
})();
