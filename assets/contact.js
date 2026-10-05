// Contact form: validation; opens the visitor's mail app with the enquiry pre-filled
// (no backend needed). Swap the mailto for a fetch() to your form endpoint when you have one.
(function () {
  var form = document.getElementById('gc-form');
  if (!form) return;
  var note = document.getElementById('gc-note');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var name = f.name.value.trim(), phone = f.phone.value.trim(), email = f.email.value.trim(), msg = f.message.value.trim();
    if (!name || !phone || !email) {
      note.textContent = 'Please enter your name, number and email.'; note.className = 'gc-note dc-note is-error'; return;
    }
    var body = 'Name: ' + name + '\nNumber: ' + phone + '\nEmail: ' + email + '\n\n' + msg;
    window.location.href = 'mailto:info@goldenqube.com?subject=' + encodeURIComponent('Website enquiry - ' + name) +
      '&body=' + encodeURIComponent(body);
    note.textContent = 'Opening your mail app… If nothing happens, email us at info@goldenqube.com.'; note.className = 'gc-note dc-note is-ok';
  });
})();
