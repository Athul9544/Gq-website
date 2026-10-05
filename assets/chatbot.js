// Golden Qube chat widget: round logo button -> Q&A panel with suggested questions,
// a message box (simple keyword bot with canned answers) and a WhatsApp handoff.
(function () {
  var rel = (document.currentScript && document.currentScript.src.replace(/chatbot\.js.*$/, '')) || 'assets/';
  var WA = 'https://wa.me/916235502722?text=' + encodeURIComponent("Hi Golden Qube, I'd like to know more about your services and training.");

  var SUGGEST = ['What does the course cost?', 'What is the syllabus?', 'What jobs can I get?', 'Where are you located?'];
  var KB = [
    { k: ['cost', 'fee', 'fees', 'price', 'pricing', 'charge', 'how much'],
      a: 'Fees depend on the program you choose. Our AI-driven digital marketing training is offered in short and full-course formats — tap "Chat on WhatsApp" and we\'ll send you the current fee structure and offers.' },
    { k: ['syllabus', 'curriculum', 'course', 'module', 'learn', 'training', 'topics', 'class'],
      a: 'The training covers: digital marketing strategy, SEO, Meta & Google Ads, content creation, social media, analytics & reporting, marketing automation, AI tools for marketers and live campaign management — with hands-on projects.' },
    { k: ['job', 'jobs', 'career', 'placement', 'salary', 'hire', 'work'],
      a: 'After the course you can work as a Digital Marketing Executive, SEO Specialist, Performance/Ads Manager, Social Media Manager, Content Strategist or start freelancing. We also guide you with portfolio building and interview prep.' },
    { k: ['located', 'location', 'where', 'address', 'office', 'kochi', 'cochin', 'map', 'direction'],
      a: 'We\'re in Kochi: Thoms Heritage, Vakkattu Road, Near Holiday Inn, Chakkaraparambu, Thammanam PO, Cochin - 682032. Open Monday – Saturday, 10.00 AM – 6.30 PM.' },
    { k: ['timing', 'timings', 'time', 'hours', 'open', 'when', 'schedule', 'batch', 'weekend'],
      a: 'We\'re open Monday – Saturday, 10.00 AM – 6.30 PM. Training batches run on weekdays and weekends — message us on WhatsApp for the next batch dates.' },
    { k: ['service', 'services', 'marketing', 'seo', 'ads', 'social', 'website', 'branding', 'audit', 'grow', 'business'],
      a: 'Golden Qube offers goal-based digital marketing services: strategy & planning, SEO, Meta & Google Ads, social media, content creation, website design, branding and marketing audits — all focused on measurable growth.' },
    { k: ['contact', 'phone', 'call', 'number', 'email', 'mail', 'whatsapp', 'reach'],
      a: 'You can call us at +91 62355 02722, email info@goldenqube.com, or tap "Chat on WhatsApp" below to talk to the team right away.' },
    { k: ['hi', 'hello', 'hey', 'good morning', 'good evening'],
      a: 'Hello! 👋 Ask me about our courses, fees, timings, services or location.' },
    { k: ['thank', 'thanks'], a: 'You\'re welcome! Anything else you\'d like to know?' }
  ];
  function answer(q) {
    var t = q.toLowerCase();
    for (var i = 0; i < KB.length; i++) {
      for (var j = 0; j < KB[i].k.length; j++) { if (t.indexOf(KB[i].k[j]) !== -1) return KB[i].a; }
    }
    return 'I\'m not sure about that one — our team can help you directly. Tap "Chat on WhatsApp" below or call +91 62355 02722.';
  }

  var wrap = document.createElement('div');
  wrap.className = 'gq-chat';
  wrap.innerHTML =
    '<div class="gq-chat-panel" role="dialog" aria-label="Chat with Golden Qube">' +
      '<div class="gq-chat-head"><img src="' + rel + 'apple-touch-icon.png" alt=""/>' +
        '<div><div class="gq-chat-title">Golden Qube</div><div class="gq-chat-sub"><span class="gq-dot"></span>Online &middot; Ask us anything</div></div></div>' +
      '<div class="gq-chat-msgs"></div>' +
      '<div class="gq-chat-suggest">' + SUGGEST.map(function (s) { return '<button type="button" class="gq-chip">' + s + '</button>'; }).join('') + '</div>' +
      '<form class="gq-chat-form"><input type="text" placeholder="Ask about courses, fees, timings..." autocomplete="off"/>' +
        '<button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg></button></form>' +
      '<a class="gq-chat-wa" href="' + WA + '" target="_blank" rel="noopener">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>Chat on WhatsApp</a>' +
    '</div>' +
    '<a class="gq-chat-btn gq-chat-wa-btn" href="' + WA + '" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp" title="Chat on WhatsApp"><svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.55 4.19 1.6 6.02L4 29l8.14-1.55a12 12 0 0 0 3.9.65h.01C22.69 28.1 28.1 22.7 28.1 16.05 28.1 8.4 22.69 3 16.04 3zm0 22.85h-.01a10 10 0 0 1-5.09-1.39l-.36-.22-4.83.92.93-4.71-.24-.38a9.96 9.96 0 0 1-1.53-5.32c0-5.52 4.5-10.01 10.03-10.01 2.68 0 5.19 1.05 7.08 2.94a9.93 9.93 0 0 1 2.93 7.08c0 5.52-4.5 10.09-9.91 10.09zm5.5-7.55c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.79-1.68-2.09-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.24-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.71.63.72.23 1.37.2 1.89.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35z"/></svg></a>';
  document.body.appendChild(wrap);

  var msgs = wrap.querySelector('.gq-chat-msgs'), form = wrap.querySelector('.gq-chat-form'), input = form.querySelector('input');
  function add(text, who) {
    var d = document.createElement('div'); d.className = 'gq-msg ' + who; d.textContent = text;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
  }
  function ask(q) {
    q = q.trim(); if (!q) return;
    add(q, 'user'); input.value = '';
    var typing = document.createElement('div'); typing.className = 'gq-msg bot typing'; typing.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(typing); msgs.scrollTop = msgs.scrollHeight;
    setTimeout(function () { typing.remove(); add(answer(q), 'bot'); }, 600);
  }
  add('Hi! 👋 Welcome to Golden Qube. How can we help you today?', 'bot');
  wrap.querySelectorAll('.gq-chip').forEach(function (c) { c.addEventListener('click', function () { ask(c.textContent); }); });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });

  // The floating button now opens WhatsApp directly; the Q&A panel stays in the file
  // (set SHOW_PANEL to true to bring it back as a launcher-driven widget).
  var SHOW_PANEL = false;
  var panel = wrap.querySelector('.gq-chat-panel');
  if (!SHOW_PANEL && panel) panel.remove();
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') wrap.classList.remove('open'); });
})();
