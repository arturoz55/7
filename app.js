/* Spout — app shell: preferences, router, search, wallet UI, motion. */

'use strict';

const Prefs = {
  consent() { try { return localStorage.getItem('spout:consent') || sessionStorage.getItem('spout:consent'); } catch (e) { return null; } },
  allowed() { return this.consent() === 'all'; },
  set(k, v) { if (!this.allowed()) return; try { localStorage.setItem('spout:' + k, v); } catch (e) {} }
};

const App = (() => {
  const root = document.documentElement;
  const main = document.getElementById('main');
  let cleanup = [];

  /* ---- toast ---- */
  let toastT;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---- consent ---- */
  function initConsent() {
    const choose = (v) => {
      try {
        if (v === 'all') { localStorage.setItem('spout:consent', 'all'); sessionStorage.removeItem('spout:consent'); }
        else {
          sessionStorage.setItem('spout:consent', 'essential');
          ['consent', 'theme', 'sidebar', 'wallet'].forEach(k => localStorage.removeItem('spout:' + k));
        }
      } catch (e) {}
      if (v === 'all') {
        Prefs.set('theme', root.classList.contains('light') ? 'light' : 'dark');
        Prefs.set('sidebar', root.classList.contains('sb-collapsed') ? 'collapsed' : 'open');
      }
      root.classList.remove('needs-consent');
      main.focus({ preventScroll: true });
    };
    document.getElementById('consent-all').addEventListener('click', () => choose('all'));
    document.getElementById('consent-min').addEventListener('click', () => choose('essential'));
    document.getElementById('privacy-btn').addEventListener('click', () => {
      try { localStorage.removeItem('spout:consent'); sessionStorage.removeItem('spout:consent'); } catch (e) {}
      root.classList.add('needs-consent');
      document.getElementById('consent-all').focus();
    });
    if (root.classList.contains('needs-consent')) setTimeout(() => document.getElementById('consent-all').focus(), 50);
  }

  /* ---- theme ---- */
  function toggleTheme() {
    const next = root.classList.contains('light') ? 'dark' : 'light';
    root.classList.remove('light', 'dark'); root.classList.add(next);
    Prefs.set('theme', next);
  }

  /* ---- sidebar ---- */
  function initSidebar() {
    const nav = document.getElementById('nav');
    nav.innerHTML = NAV.map(n => `<a href="${n.href}" class="${n.cta ? 'cta' : ''}" data-route="${n.href}" title="${n.label}"><span class="nav-ic">${icon(n.icon)}</span><span class="nav-label">${n.label}</span></a>`).join('');
    const tog = document.getElementById('sb-toggle');
    const sync = () => tog.setAttribute('aria-label', root.classList.contains('sb-collapsed') ? 'Expand sidebar' : 'Collapse sidebar');
    tog.addEventListener('click', () => { root.classList.toggle('sb-collapsed'); Prefs.set('sidebar', root.classList.contains('sb-collapsed') ? 'collapsed' : 'open'); sync(); });
    sync();
    const scrim = document.getElementById('drawer-scrim');
    const close = () => { root.classList.remove('drawer-open'); scrim.hidden = true; };
    document.getElementById('menu-btn').addEventListener('click', () => { root.classList.add('drawer-open'); scrim.hidden = false; });
    scrim.addEventListener('click', close);
    nav.addEventListener('click', close);
    return close;
  }

  /* ---- search ---- */
  function initSearch() {
    const input = document.getElementById('search-input'), box = document.getElementById('search-results');
    let items = [], sel = -1;
    const open = (v) => { box.hidden = !v; input.setAttribute('aria-expanded', String(v)); };
    const render = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { open(false); return; }
      const toks = [...localTokens(), ...TOKENS].filter(t => [t.name, t.ticker, t.site, t.address].some(x => x.toLowerCase().includes(q))).slice(0, 6);
      const sites = SITES.filter(s => [s.name, s.domain].some(x => x.toLowerCase().includes(q))).slice(0, 5);
      const pages = NAV.filter(n => n.label.toLowerCase().includes(q));
      items = [...toks.map(t => ({ href: '#/token/' + t.address, html: `<span class="mini" style="background:${color(t.hue)}">${t.logoImg ? `<img src="${esc(t.logoImg)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">` : t.logo && MARKS[t.logo] ? mark(t.logo) : esc(t.ticker[0])}</span>${esc(t.name)}<small class="mono">${esc(t.ticker)}</small>`, g: 'Tokens' })),
        ...sites.map(s => ({ href: '#/site/' + s.domain, html: `<span class="mini" style="background:${color(s.hue)}">${s.logoImg ? `<img src="${esc(s.logoImg)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">` : s.logo && MARKS[s.logo] ? mark(s.logo) : esc(s.name[0])}</span>${esc(s.name)}<small>${esc(s.domain)}</small>`, g: 'Websites' })),
        ...pages.map(n => ({ href: n.href, html: `<span class="mini" style="background:rgb(var(--fg)/.08);color:rgb(var(--fg))">${icon(n.icon, 'ic" style="width:14px;height:14px')}</span>${n.label}<small>Page</small>`, g: 'Pages' }))];
      if (/^0x[0-9a-f]{40}$/i.test(q) && !toks.length) items.push({ href: '#/token/' + q, html: `<span class="mini" style="background:rgb(var(--fg)/.08)">?</span>Look up address<small class="mono">${short(q)}</small>`, g: 'Address' });
      sel = items.length ? 0 : -1;
      let g = '';
      box.innerHTML = items.length ? items.map((it, i) => (it.g !== g ? `<div class="sr-group">${g = it.g}</div>` : '') +
        `<div class="sr-item" role="option" id="sr-${i}" data-i="${i}" aria-selected="${i === sel}">${it.html}</div>`).join('')
        : `<div class="sr-none">Nothing matches “${esc(input.value.trim())}”</div>`;
      input.setAttribute('aria-activedescendant', sel >= 0 ? 'sr-0' : '');
      open(true);
    };
    const go = (i) => { const it = items[i]; if (!it) return; location.hash = it.href; input.value = ''; open(false); input.blur(); };
    input.addEventListener('input', render);
    input.addEventListener('focus', () => { if (input.value.trim()) render(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!items.length) return; e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        box.querySelectorAll('.sr-item').forEach((el, i) => el.setAttribute('aria-selected', String(i === sel)));
        const cur = box.querySelector(`#sr-${sel}`); if (cur) { cur.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', cur.id); }
      } else if (e.key === 'Enter') { e.preventDefault(); if (sel >= 0) go(sel); else if (input.value.trim()) { location.hash = '#/explore?q=' + encodeURIComponent(input.value.trim()); open(false); input.blur(); } }
      else if (e.key === 'Escape') { input.value = ''; open(false); input.blur(); }
    });
    box.addEventListener('mousedown', (e) => { const it = e.target.closest('.sr-item'); if (it) { e.preventDefault(); go(+it.dataset.i); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('#search')) open(false); });
    return input;
  }

  /* ---- wallet UI ---- */
  const modal = document.getElementById('wallet-modal');
  let lastFocus = null;
  function walletGlyph(name, color) { return `<span class="wl-glyph" style="background:${color}">${esc(name[0])}</span>`; }
  function renderWalletList() {
    const q = document.getElementById('wm-search').value.trim().toLowerCase();
    const found = Wallet.list().filter(e => e.info.name.toLowerCase().includes(q));
    const names = new Set(Wallet.list().map(e => e.info.name.toLowerCase()));
    const cat = WALLET_CATALOGUE.filter(w => !names.has(w.name.toLowerCase()) && w.name.toLowerCase().includes(q));
    const list = document.getElementById('wm-list');
    list.innerHTML = (found.length ? `<div class="wl-label">Installed</div>` + found.map((e, i) =>
      `<button class="wl-item" role="listitem" data-i="${i}">${e.info.icon && /^data:image\//.test(e.info.icon) ? `<img src="${esc(e.info.icon)}" alt="">` : walletGlyph(e.info.name, '#6D5BFF')}<span>${esc(e.info.name)}</span><small class="on">Detected</small></button>`).join('') : '') +
      (cat.length ? `<div class="wl-label">${found.length ? 'More wallets' : 'No wallet detected · get one'}</div>` + cat.map(w =>
      `<a class="wl-item" role="listitem" href="${w.url}" target="_blank" rel="noopener noreferrer">${w.logo ? `<img src="${w.logo}" alt="" width="34" height="34" loading="lazy">` : walletGlyph(w.name, w.color)}<span>${esc(w.name)}</span><small>Install ${icon('ext', 'ic" style="width:11px;height:11px;vertical-align:-1px')}</small></a>`).join('') : '');
    document.getElementById('wm-empty').hidden = !!(found.length || cat.length);
    list._found = found;
  }
  function openWallet() {
    if (Wallet.state.address) { togglePanel(true); return; }
    lastFocus = document.activeElement;
    Wallet.discover();
    modal.hidden = false;
    document.getElementById('wm-search').value = '';
    renderWalletList();
    setTimeout(() => (modal.querySelector('.wl-item') || document.getElementById('wm-close')).focus(), 30);
  }
  function closeWallet() { modal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function togglePanel(force) {
    const p = document.getElementById('wallet-panel'), btn = document.getElementById('wallet-btn');
    const show = force !== undefined ? force : p.hidden;
    p.hidden = !show; btn.setAttribute('aria-expanded', String(show));
    if (show) paintPanel();
  }
  async function paintPanel() {
    const p = document.getElementById('wallet-panel'), s = Wallet.state;
    if (!s.address) { p.hidden = true; return; }
    const chain = s.chainId ? (CHAINS[s.chainId] || 'Chain ' + s.chainId) : 'Unknown';
    p.innerHTML = `<div class="wp-addr"><span class="mini" style="background:${color(parseInt(s.address.slice(2, 6), 16) % 360)}">${esc(s.address.slice(2, 3).toUpperCase())}</span>
      <div><b class="mono" style="font-size:13px">${short(s.address)}</b><div class="muted" style="font-size:12px">${esc(s.info ? s.info.name : 'Wallet')}</div></div></div>
      <div class="wp-row"><span>Network</span><span>${esc(chain)}</span></div><div class="wp-row"><span>Balance</span><span class="num" id="wp-bal">…</span></div>
      <div class="wp-actions"><button class="btn btn-line sm grow" data-copy="${s.address}">Copy</button><button class="btn btn-line sm grow" id="wp-off">Disconnect</button></div>`;
    p.querySelector('#wp-off').addEventListener('click', () => { Wallet.disconnect(); togglePanel(false); toast('Disconnected.'); });
    try { const b = await Wallet.balance(); const el = p.querySelector('#wp-bal'); if (el) el.textContent = b === null ? '—' : b.toFixed(4) + ' ETH'; }
    catch (e) { const el = p.querySelector('#wp-bal'); if (el) el.textContent = '—'; }
  }
  function initWallet() {
    document.getElementById('wallet-btn').addEventListener('click', (e) => { e.stopPropagation(); Wallet.state.address ? togglePanel() : openWallet(); });
    document.getElementById('wm-close').addEventListener('click', closeWallet);
    modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeWallet(); });
    document.getElementById('wm-search').addEventListener('input', renderWalletList);
    const help = document.getElementById('wm-help');
    help.addEventListener('click', () => { const t = document.getElementById('wm-help-text'); t.hidden = !t.hidden; help.setAttribute('aria-expanded', String(!t.hidden)); });
    document.getElementById('wm-list').addEventListener('click', async (e) => {
      const b = e.target.closest('button.wl-item'); if (!b) return;
      const entry = document.getElementById('wm-list')._found[+b.dataset.i];
      const small = b.querySelector('small'); b.classList.add('busy'); small.textContent = 'Approve in wallet…';
      try { await Wallet.connect(entry); closeWallet(); toast('Connected ' + short(Wallet.state.address)); }
      catch (err) { b.classList.remove('busy'); small.textContent = 'Detected'; toast(err && err.code === 4001 ? 'Request declined.' : err && err.code === -32002 ? 'A request is already open in your wallet.' : (err && err.message) || 'Could not connect.'); }
    });
    /* trap focus inside the modal */
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeWallet(); return; }
      if (e.key !== 'Tab') return;
      const f = [...modal.querySelectorAll('button, a[href], input')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.wallet-wrap')) togglePanel(false); });
    Wallet.on((s) => {
      document.getElementById('wallet-label').textContent = s.address ? short(s.address) : 'Connect';
      document.querySelector('#wallet-btn .status-dot').classList.toggle('on', !!s.address);
      if (!document.getElementById('wallet-panel').hidden) paintPanel();
      if (!modal.hidden && !s.address) renderWalletList();
    });
    Wallet.discover();
    if (Prefs.allowed()) Wallet.restore();
  }

  /* ---- motion helpers ---- */
  function fillMeters(scope) { requestAnimationFrame(() => requestAnimationFrame(() => scope.querySelectorAll('.meter i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; }))); }
  function countUp(el) {
    const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, pre = el.dataset.prefix || '', t0 = performance.now(), dur = 1400;
    const fmt = (v) => pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(end); return; }
    const step = (now) => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(end * e); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  let io;
  function observe(scope) {
    if (io) io.disconnect();
    io = new IntersectionObserver((ents) => ents.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(en.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    scope.querySelectorAll('.rv').forEach(el => io.observe(el));
  }

  /* ---- router ---- */
  function parse() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
    return { parts, q: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  function render() {
    cleanup.forEach(fn => { try { fn(); } catch (e) {} }); cleanup = [];
    const { parts, q } = parse();
    const name = ROUTES[parts[0] || ''];
    const view = name ? VIEWS[name](q, parts.slice(1).join('/')) : VIEWS.missing();
    document.title = view.title;
    main.innerHTML = view.html;
    const ctx = {
      every: (ms, fn) => { const id = setInterval(fn, ms); cleanup.push(() => clearInterval(id)); },
      after: (ms, fn) => { const id = setTimeout(fn, ms); cleanup.push(() => clearTimeout(id)); },
      on: (off) => cleanup.push(off)
    };
    if (view.mount) view.mount(main, ctx);
    fillMeters(main); observe(main);
    const base = '#/' + (parts[0] || '');
    document.querySelectorAll('#nav a').forEach(a => {
      const on = a.dataset.route === (base === '#/' ? '#/' : base);
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
  }

  function init() {
    document.getElementById('year').textContent = new Date().getFullYear();
    initConsent();
    const closeDrawer = initSidebar();
    const search = initSearch();
    initWallet();
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
    /* table rows that link; copy buttons anywhere */
    document.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-copy]');
      if (c) {
        e.preventDefault(); e.stopPropagation();
        try { await navigator.clipboard.writeText(c.dataset.copy); toast('Copied to clipboard'); }
        catch (err) { toast('Copy failed: ' + c.dataset.copy.slice(0, 20) + '…'); }
        return;
      }
      const r = e.target.closest('tr[data-href]');
      if (r && !e.target.closest('a,button')) location.hash = r.dataset.href;
    });
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if (e.metaKey || e.ctrlKey || e.altKey || typing || root.classList.contains('needs-consent') || !modal.hidden) return;
      if (e.key === '/') { e.preventDefault(); search.focus(); }
      else if (e.key === 'd' || e.key === 'D') toggleTheme();
      else if (e.key === 'Escape') { closeDrawer(); togglePanel(false); }
    });
    /* follow the OS theme until the user picks one */
    matchMedia('(prefers-color-scheme: light)').addEventListener('change', (ev) => {
      let saved = null; try { saved = localStorage.getItem('spout:theme'); } catch (e) {}
      if (saved) return;
      root.classList.remove('light', 'dark'); root.classList.add(ev.matches ? 'light' : 'dark');
    });
    /* live market: update every visible card and price for the token that moved */
    Market.on((ev) => {
      const t = ev.t;
      document.querySelectorAll(`[data-tok="${CSS.escape(t.ticker)}"]`).forEach(el => {
        const cap = el.querySelector('.cap-v'), chg = el.querySelector('.chg');
        if (cap) cap.textContent = el.classList.contains('tk-price') ? fmtPrice(Market.price(t)) : '$' + compact(t.mcap);
        if (chg) { chg.textContent = fmtChg(t.change); chg.classList.toggle('neg', t.change < 0); }
        const m = el.querySelector('.meter i'); if (m && t.stage !== 'bonded') { m.style.width = t.curve + '%'; const c = el.querySelector('.curve span:last-child'); if (c) c.textContent = t.curve + '%'; }
        el.classList.remove('flash-up', 'flash-down'); void el.offsetWidth; el.classList.add(ev.up ? 'flash-up' : 'flash-down');
      });
    });
    Market.start();
    /* ages and "x ago" labels keep counting */
    setInterval(() => {
      document.querySelectorAll('[data-age]').forEach(el => { el.textContent = ageOf(+el.dataset.age); });
      document.querySelectorAll('[data-ago]').forEach(el => { el.textContent = ago(+el.dataset.ago); });
    }, 10000);
    /* preview pill */
    const pv = document.getElementById('preview-btn'), pop = document.getElementById('preview-pop');
    pv.addEventListener('click', (e) => { e.stopPropagation(); pop.hidden = !pop.hidden; pv.setAttribute('aria-expanded', String(!pop.hidden)); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.preview-wrap')) { pop.hidden = true; pv.setAttribute('aria-expanded', 'false'); } });
    FX.initTilt();
    Alerts.init();
    /* watchlist stars (inside links, so stop navigation) */
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-star]'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      const on = Watch.toggle(b.dataset.star);
      document.querySelectorAll(`[data-star="${CSS.escape(b.dataset.star)}"]`).forEach(x => { x.setAttribute('aria-pressed', String(on)); x.textContent = on ? '★' : '☆'; });
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      toast(on ? `Watching ${b.dataset.star}` : `Removed ${b.dataset.star} from watchlist`);
      main.dispatchEvent(new CustomEvent('watchchange'));
    }, true);
    window.addEventListener('hashchange', render);
    render();
  }

  return { init, toast, openWallet, fillMeters };
})();

App.init();
