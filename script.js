/* ==========================================================
   VARSA – interactions (vanilla JS, no dependencies)
   ALL station data and QR/login behaviour here is SIMULATED.
   ========================================================== */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- DEMO STATION DATA (made up for illustration) ---------- */
  const STATIONS = [
    { id: 1, name: 'Rabindra Sadan Metro', area: 'Kolkata, West Bengal', type: 'Metro', free: 8, cap: 12 },
    { id: 2, name: 'Jadavpur University Gate 4', area: 'Kolkata, West Bengal', type: 'Campus', free: 2, cap: 10 },
    { id: 3, name: 'Churchgate Station Exit', area: 'Mumbai, Maharashtra', type: 'Metro', free: 11, cap: 15 },
    { id: 4, name: 'Bandra Kurla Complex Plaza', area: 'Mumbai, Maharashtra', type: 'Office', free: 0, cap: 12 },
    { id: 5, name: 'Rajiv Chowk Metro', area: 'New Delhi, Delhi', type: 'Metro', free: 6, cap: 14 },
    { id: 6, name: 'India Gate Lawns', area: 'New Delhi, Delhi', type: 'Tourist', free: 9, cap: 10 },
    { id: 7, name: 'Cyber Hub Tech Park', area: 'Gurugram, Haryana', type: 'Office', free: 3, cap: 12 },
    { id: 8, name: 'IISc Main Gate', area: 'Bengaluru, Karnataka', type: 'Campus', free: 7, cap: 10 },
    { id: 9, name: 'Marina Beach Promenade', area: 'Chennai, Tamil Nadu', type: 'Tourist', free: 1, cap: 10 }
  ];

  /* ---------- Navigation: mobile menu, solid bar on scroll, active link ---------- */
  const nav = $('#nav'), menu = $('#menu'), burger = $('#burger');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && $(id)) {            // smooth scroll (offset handled below)
      e.preventDefault();
      const top = $(id).getBoundingClientRect().top + scrollY - (id === '#home' ? 0 : 68);
      scrollTo({ top, behavior: 'smooth' });
      setMenu(false);
    }
  }));
  const links = $$('.menu > a');
  const onScroll = () => {
    nav.classList.toggle('solid', scrollY > 30);
    let cur = '#home';
    ['#home', '#how', '#stations', '#about'].forEach(id => { if ($(id).getBoundingClientRect().top < innerHeight * 0.4) cur = id; });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === cur));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Hero rain ---------- */
  const rain = $('#rain');
  for (let i = 0; i < 45; i++) {
    const d = document.createElement('span');
    d.className = 'drop';
    d.style.cssText = `left:${Math.random() * 100}%;height:${20 + Math.random() * 40}px;animation-duration:${0.9 + Math.random() * 1.2}s;animation-delay:${-Math.random() * 2}s;opacity:${0.3 + Math.random() * 0.5}`;
    rain.appendChild(d);
  }

  /* ---------- Station finder: search + filter + render ---------- */
  const grid = $('#grid'), empty = $('#empty'), count = $('#count'), q = $('#q');
  let filter = 'all';
  const status = s => s.free === 0 ? ['none', 'No umbrellas right now'] : s.free <= 2 ? ['low', `Low: ${s.free} of ${s.cap} umbrellas`] : ['ok', `${s.free} of ${s.cap} umbrellas available`];
  const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function render() {
    const term = q.value.trim().toLowerCase();
    const list = STATIONS.filter(s =>
      (!term || (s.name + ' ' + s.area + ' ' + s.type).toLowerCase().includes(term)) &&
      (filter === 'all' || (filter === 'avail' ? s.free > 0 : s.type === filter)));
    grid.innerHTML = list.map(s => {
      const [cls, label] = status(s);
      return `<article class="card st ${cls}">
        <span class="tag">${s.type === 'Office' ? 'Office hub' : s.type === 'Tourist' ? 'Tourist spot' : s.type} · Demo</span>
        <h3>${esc(s.name)}</h3><p class="place">${esc(s.area)}</p>
        <div class="avail"><span class="dot"></span>${label}</div>
        <div class="bar"><i style="width:${(s.free / s.cap) * 100}%"></i></div>
        <button class="btn" data-borrow="${s.id}" ${s.free ? '' : 'disabled'}>${s.free ? 'Try demo borrow' : 'Unavailable'}</button>
      </article>`;
    }).join('');
    empty.hidden = list.length > 0;
    count.textContent = `${list.length} demo station${list.length === 1 ? '' : 's'} shown`;
  }
  q.addEventListener('input', render);
  $('#chips').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    $$('.chip').forEach(x => x.classList.toggle('on', x === c));
    filter = c.dataset.f; render();
  });
  $('#reset').addEventListener('click', () => {
    q.value = ''; filter = 'all';
    $$('.chip').forEach(x => x.classList.toggle('on', x.dataset.f === 'all'));
    render(); q.focus();
  });
  render();

  /* ---------- Modal helpers (open/close, Escape, backdrop, focus return) ---------- */
  let lastFocus = null;
  const openModal = m => { lastFocus = document.activeElement; m.hidden = false; document.body.style.overflow = 'hidden'; (m.querySelector('input,button.btn') || m).focus(); };
  const closeModal = m => { m.hidden = true; document.body.style.overflow = ''; stopScan(); lastFocus && lastFocus.focus(); };
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); }));
  addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal').forEach(m => !m.hidden && closeModal(m)); });

  /* ---------- Demo QR scan (simulation only: no camera, no payment) ---------- */
  const qrModal = $('#qrModal'), qrMsg = $('#qrMsg'), scanBtn = $('#scanBtn');
  let scanTimer = null, current = null;

  // Draw a decorative, seeded QR-LOOKING pattern. It encodes nothing.
  function drawPattern(seed) {
    const cv = $('#qrCanvas'), x = cv.getContext('2d'), n = 21, u = cv.width / n;
    x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
    x.fillStyle = '#08183a';
    let r = seed * 9301 + 49297;
    const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    const finder = (ox, oy) => { x.fillRect(ox * u, oy * u, 7 * u, 7 * u); x.fillStyle = '#fff'; x.fillRect((ox + 1) * u, (oy + 1) * u, 5 * u, 5 * u); x.fillStyle = '#5cc8ff'; x.fillRect((ox + 2) * u, (oy + 2) * u, 3 * u, 3 * u); x.fillStyle = '#08183a'; };
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const inFinder = (i < 8 && j < 8) || (i > 12 && j < 8) || (i < 8 && j > 12);
      if (!inFinder && rnd() > 0.52) x.fillRect(i * u, j * u, u, u);
    }
    finder(0, 0); finder(14, 0); finder(0, 14);
  }
  function stopScan() { clearTimeout(scanTimer); $('.qr').classList.remove('scanning'); scanBtn.disabled = false; }

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-borrow]'); if (!b) return;
    current = STATIONS.find(s => s.id === +b.dataset.borrow);
    $('#qrStation').textContent = `${current.name}, ${current.area} (demo station)`;
    drawPattern(current.id); scanBtn.textContent = 'Simulate scan';
    qrMsg.className = 'fine'; qrMsg.textContent = 'This is a demo. No umbrella is released, no payment is taken and no camera is used.';
    openModal(qrModal);
  });
  scanBtn.addEventListener('click', () => {
    scanBtn.disabled = true; $('.qr').classList.add('scanning');
    qrMsg.className = 'fine'; qrMsg.textContent = 'Scanning…';
    scanTimer = setTimeout(() => {
      stopScan();
      qrMsg.className = 'fine good';
      qrMsg.textContent = 'Simulated scan complete. In the real service, a slot would unlock here. Nothing was borrowed or charged.';
      scanBtn.textContent = 'Scan again';
    }, 2200);
  });

  /* ---------- Login / signup modal (frontend validation only) ---------- */
  const authModal = $('#authModal'), form = $('#authForm'), msg = $('#authMsg');
  let mode = 'login';
  function setMode(m) {
    mode = m;
    $$('[data-tab]').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === m));
    $$('[data-for="signup"]').forEach(f => f.hidden = m !== 'signup');
    $('#authSubmit').textContent = m === 'signup' ? 'Create account' : 'Login';
    $('#fPass').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
    clearErrors(); msg.className = 'fine'; msg.textContent = 'Demo only: nothing is sent or saved anywhere.';
  }
  const clearErrors = () => $$('.field', form).forEach(f => { f.classList.remove('bad'); $('.err', f).textContent = ''; });
  const fail = (id, text) => { const f = $('#' + id).closest('.field'); f.classList.add('bad'); $('.err', f).textContent = text; return false; };

  $$('[data-auth]').forEach(b => b.addEventListener('click', () => { setMenu(false); setMode(b.dataset.auth); openModal(authModal); }));
  $$('[data-tab]').forEach(t => t.addEventListener('click', () => setMode(t.dataset.tab)));

  form.addEventListener('submit', e => {
    e.preventDefault(); clearErrors();
    const name = $('#fName').value.trim(), email = $('#fEmail').value.trim(), p = $('#fPass').value, p2 = $('#fPass2').value;
    let ok = true;
    if (mode === 'signup' && name.length < 2) ok = fail('fName', 'Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) ok = fail('fEmail', 'Enter a valid email address.');
    if (p.length < 8) ok = fail('fPass', 'Use at least 8 characters.');
    else if (mode === 'signup' && !(/\d/.test(p) && /[a-zA-Z]/.test(p))) ok = fail('fPass', 'Include both letters and numbers.');
    if (mode === 'signup' && p2 !== p) ok = fail('fPass2', 'Passwords do not match.');
    if (!ok) { msg.className = 'fine'; msg.textContent = 'Please fix the highlighted fields.'; return; }
    msg.className = 'fine good';
    msg.textContent = mode === 'signup' ? 'Demo sign-up looks valid. No account was created.' : 'Demo login looks valid. No one was signed in.';
    form.reset();
  });

  /* ---------- Placeholder social links ---------- */
  $$('[data-soon]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); a.textContent = a.textContent.replace(' (coming soon)', '') + ' (coming soon)'; }));

  /* ---------- Scroll reveal ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: 0.15 }) : null;
  $$('.reveal').forEach((el, i) => { if (io) { el.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(el); } else el.classList.add('in'); });

  $('#yr').textContent = new Date().getFullYear();
})();
