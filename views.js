/* Conduit — views. Each view returns { title, html, mount? }. */

'use strict';

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, cls = 'ic') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const usd = (n, d = 2) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const compact = (n) => {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.round(n * 100) / 100);
};
const short = (a) => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';
const ago = (ts) => {
  const m = Math.max(1, Math.round((Date.UTC(2026, 8, 30, 20, 0) - ts) / 60000));
  if (m < 60) return m + 'm ago';
  if (m < 1440) return Math.round(m / 60) + 'h ago';
  return Math.round(m / 1440) + 'd ago';
};
const color = (h, l = 46) => `hsl(${h} 62% ${l}%)`;
const findSite = (d) => SITES.find(s => s.domain === d);
const findToken = (a) => TOKENS.find(t => t.address.toLowerCase() === String(a).toLowerCase() || t.ticker.toLowerCase() === String(a).toLowerCase());
const localTokens = () => { try { return JSON.parse(sessionStorage.getItem('conduit:launched') || '[]'); } catch (e) { return []; } };

/* Generated cover art: a gradient with one of three patterns picked by a seed. */
function art(hue, seed = '') {
  let n = 0; for (const c of seed) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  const id = 'p' + n.toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  const kind = n % 3, a = color(hue, 30), b = color((hue + 40) % 360, 52);
  const pat = kind === 0
    ? `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.6" fill="rgba(255,255,255,.22)"/></pattern>`
    : kind === 1
      ? `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="14" fill="rgba(255,255,255,.12)"/></pattern>`
      : `<pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="5"/></pattern>`;
  return `<svg class="bgpat" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>${pat}</defs>
    <rect width="200" height="120" fill="url(#g${id})"/><rect width="200" height="120" fill="url(#${id})"/></svg>`;
}
const avatar = (name, hue, cls = 'av') => `<span class="${cls}" style="background:${color(hue)}">${esc(name[0])}</span>`;

function tokenCard(t, i = 0) {
  const s = findSite(t.site);
  const claimed = s && s.claimed;
  return `<a class="tok" href="#/token/${t.address}" style="animation-delay:${i * 40}ms">
    <div class="tok-art">${t.image ? `<img src="${esc(t.image)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : art(t.hue, t.ticker)}
      <span class="badge tl"><i></i>${esc(t.pair)}</span><span class="badge tr">${esc(t.age)}</span>
      ${t.image ? '' : `<span class="letter">${esc(t.ticker[0])}</span>`}
      <span class="badge bl">${icon('globe', 'ic" style="width:10px;height:10px')}${esc(s ? s.name : t.site)}</span></div>
    <div class="tok-body">
      <div class="tok-name">${esc(t.name)} <small>${esc(t.ticker)}</small></div>
      <div class="tok-cap num">$${compact(t.mcap)} <small>MC</small><span class="chg ${t.change < 0 ? 'neg' : ''}">${t.change > 0 ? '+' : ''}${t.change.toFixed(1)}%</span></div>
      <div class="curve"><span>${t.stage === 'bonded' ? 'Bonded' : 'Bonding curve'}</span><span>${t.curve}%</span></div>
      <div class="meter"><i data-w="${t.curve}"></i></div>
      <div class="tok-foot"><i class="g"></i><span class="num">${compact(t.holders)}</span><span class="sep"></span><span class="num muted">${t.paid ? usd(t.paid, 0) : '$0'}</span></div>
      <div class="claim ${claimed ? 'ok' : ''}">${icon(claimed ? 'check' : 'lock', 'ic" style="width:11px;height:11px')}${claimed ? 'Paid to site' : 'Unclaimed'}</div>
    </div></a>`;
}

function merchantCard(s) {
  const owed = s.owed || 0;
  return `<a class="mcard" href="#/site/${s.domain}"><div class="art" style="position:relative">${art(s.hue, s.domain)}</div>
    <div class="body">${avatar(s.name, s.hue)}<b>${esc(s.name)}</b><div class="dom">${esc(s.domain)}</div>
    <span class="st ${s.claimed ? 'ok' : ''}">${s.claimed ? '● Claimed' : '○ Not claimed'}</span>
    <div class="nums"><span><b>${s.tokens}</b> Tokens</span><span><b class="num">${s.claimed ? usd(s.received, 0) : usd(owed, 0)}</b> ${s.claimed ? 'Received' : 'Owed'}</span></div></div></a>`;
}

const sortTokens = (list, key) => [...list].sort((a, b) => key === 'paid' ? b.paid - a.paid : key === 'new' ? parseAge(a.age) - parseAge(b.age) : b.mcap - a.mcap);
function parseAge(a) { const n = parseFloat(a); return a.endsWith('d') ? n * 1440 : a.endsWith('h') ? n * 60 : n; }

function paymentRows(list) {
  return list.map(p => {
    const s = findSite(p.site);
    return `<tr class="rowlink" data-href="#/site/${p.site}"><td><div class="cell-tok">${avatar(s.name, s.hue, 'mini')}<div>${esc(s.name)}<div class="muted" style="font-size:12px">${esc(p.site)}</div></div></div></td>
      <td class="mono" style="font-size:12px">${esc(p.token)}</td><td class="num">${usd(p.amount)}</td><td>${esc(p.rail)}</td>
      <td class="muted">${ago(p.at)}</td><td><button class="copy" data-copy="${p.tx}">${short(p.tx)} ${icon('copy', 'ic" style="width:12px;height:12px')}</button></td></tr>`;
  }).join('');
}

/* ---------------------------------------------------------------- views */

const VIEWS = {};

VIEWS.home = () => {
  const words = ['website', 'newsletter', 'web store', 'podcast', 'indie app'];
  const graduating = sortTokens(TOKENS.filter(t => t.stage === 'graduating'), 'mcap').slice(0, 8);
  const topSites = [...SITES].sort((a, b) => (b.received + (b.owed || 0)) - (a.received + (a.owed || 0))).slice(0, 2);
  const mostPaid = SITES.filter(s => s.claimed).sort((a, b) => b.received - a.received).slice(0, 5);
  const cols = [0, 1, 2].map(c => SITES.filter((_, i) => i % 3 === c));
  const wallCol = (list) => { const tiles = list.map(s => `<div class="mtile"><div class="art" style="position:relative;height:52px">${art(s.hue, s.domain)}</div>
    <div class="who">${avatar(s.name, s.hue)}<b>${esc(s.name)}</b><small>${esc(s.domain)}</small></div></div>`).join(''); return tiles + tiles; };
  const pts = DAILY.map((v, i) => [i / (DAILY.length - 1) * 300, 100 - (v - 500) / 3200 * 90]);
  const line = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  let w = 0; const W = (txt) => txt.split(' ').map(x => `<span class="w" style="animation-delay:${(w++) * 70 + 100}ms">${x}</span>`).join(' ');

  return {
    title: 'Conduit — Point token fees at any website',
    html: `<div class="page">
      <section class="hero">
        <span class="pill"><span class="pill-swap" id="hero-pill">${avatar(SITES[0].name, SITES[0].hue, 'pill-av')}<b style="font-weight:500">${esc(SITES[0].name)}</b><span class="logo-mark logo-inline" style="--s:14px"></span><span class="muted">earns from fees</span></span></span>
        <h1 class="display">${W('Point token fees')} <br>${W('at any')} <span class="w" style="animation-delay:${(w++) * 70 + 100}ms"><span class="logo-mark logo-inline"></span></span> <span class="w rot" style="animation-delay:${(w++) * 70 + 100}ms" id="rot">${words.map((x, i) => `<span class="${i ? 'down' : ''}">${x}</span>`).join('')}</span></h1>
        <p class="hero-sub">Every trade on a Conduit token pays a small creator fee. Instead of a wallet, that fee is pointed at a real website, converted to dollars and paid out to its bank, card account or USDC wallet.
          Built for <a class="chip" href="#/docs/how"><i></i>EVM chains</a> with <a class="chip" href="#/flow"><i style="background:rgb(var(--accent))"></i>open payouts</a></p>
        <div class="hero-cta"><a class="btn btn-solid shine" href="#/launch">Launch a token</a><a class="btn btn-line" href="#/docs">Read the docs</a></div>
      </section>

      <section class="rv">
        <h2 class="sec-title display">Why send fees to <span class="logo-mark logo-inline"></span> websites?</h2>
        <p class="sec-sub">A website is something people already pay for. Fees arrive as ordinary income.</p>
        <div class="stats">${STATS.map((s, i) => `<div class="stat"><span class="idx">0${i + 1}</span>${s.delta ? `<span class="delta">${s.delta}</span>` : ''}
          <div class="big num"><span data-count="${s.value}" data-dec="${s.decimals || 0}" data-prefix="${s.prefix || ''}">${s.prefix || ''}0</span><small>${s.unit || ''}${s.suffix ? ' ' + s.suffix : ''}</small></div>
          <div class="lab">${s.label}</div><div class="note">${s.note}</div></div>`).join('')}</div>
        <p class="footnote">Figures are sample data for this demo build. Conduit is not affiliated with any payment processor. <a href="#/docs/disclosures">Disclosures</a>.</p>
      </section>

      <section class="bento rv">
        <a class="tile w3" href="#/merchants"><div class="wall">${cols.map(c => `<div class="wall-col">${wallCol(c)}</div>`).join('')}</div><div class="tile-foot"><span>Merchants</span><span>Open →</span></div></a>
        <a class="tile w3" href="#/payments"><div class="tile-center"><div class="flowdots"><span class="logo-mark"></span><span class="track"></span>${avatar('L', 262, 'pill-av')}</div>
          <b style="font-weight:500">${PAYMENTS.length} payouts settled</b><p class="muted" style="font-size:12px;margin-top:6px;max-width:260px">Latest: ${usd(PAYMENTS[0].amount)} to ${esc(PAYMENTS[0].site)}, ${ago(PAYMENTS[0].at)}</p></div><div class="tile-foot"><span>Payments</span><span>Open →</span></div></a>
        <a class="tile w2" href="#/analytics"><div class="tile-pad"><div class="k"><span>Fees routed</span><span>30D</span></div><div class="v num">${usd(DAILY.reduce((a, b) => a + b, 0), 0)}</div></div>
          <svg class="spark" viewBox="0 0 300 100" preserveAspectRatio="none"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(var(--accent))" stop-opacity=".3"/><stop offset="1" stop-color="rgb(var(--accent))" stop-opacity="0"/></linearGradient></defs>
          <path class="a" d="${line} L300 100 L0 100Z"/><path class="l" d="${line}"/></svg><div class="tile-foot"><span>Analytics</span><span>Open →</span></div></a>
        <a class="tile w2" href="#/launch"><div class="tile-pad"><div class="k"><span class="tag">● Fees go to</span><span class="tag">Example</span></div>
          <div class="typer" style="margin-top:12px">${icon('search', 'ic" style="width:14px;height:14px')}<span id="typer-text"></span><span class="caret"></span></div>
          <div class="typer-hit hidden" id="typer-hit"></div></div><div class="tile-foot"><span>Launch</span><span>Open →</span></div></a>
        <a class="tile w2" href="#/docs"><div class="tile-pad"><p class="muted" style="font-size:11.5px;margin-bottom:10px">Each token names one website. Every fee it earns is traced to that site.</p>
          <div class="spec"><span>field</span><span>value</span><span>website</span><span class="hl">lumennotes.app</span><span>vault</span><span>creator fee vault</span><span>asset</span><span>USDC</span><span>payout</span><span class="hl">bank · card · wallet</span><span>proof</span><span>DNS TXT record</span></div></div>
          <div class="tile-foot"><span>Docs</span><span>Open →</span></div></a>
      </section>

      <section class="split rv">
        <div>
          <div class="bar"><h3 class="display">Top Tokens</h3>
            <div class="tabs" id="home-stage"><button aria-pressed="true" data-v="graduating">Graduating</button><button aria-pressed="false" data-v="bonded">Bonded</button></div><span class="vr"></span>
            <div class="tabs" id="home-sort"><button aria-pressed="true" data-v="mcap">Market cap</button><button aria-pressed="false" data-v="paid">Most paid out</button></div></div>
          <div class="tok-grid" id="home-grid">${graduating.map(tokenCard).join('')}</div>
        </div>
        <aside><div class="bar"><h3 class="display">Top <span class="logo-mark logo-inline"></span> Merchants</h3></div>${topSites.map(merchantCard).join('')}</aside>
      </section>

      <section class="split rv">
        <div><div class="bar"><h3 class="display">Recent payments</h3><a class="link" href="#/payments" style="margin-left:auto">View all →</a></div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Website</th><th>Token</th><th>Amount</th><th>To</th><th>When</th><th>Tx</th></tr></thead><tbody>${paymentRows(PAYMENTS.slice(0, 5))}</tbody></table></div></div>
        <aside><div class="bar"><h3 class="display">Most paid</h3></div>
          <div class="panel" style="padding:8px">${mostPaid.map((s, i) => `<a href="#/site/${s.domain}" class="sr-item"><span class="muted mono" style="font-size:11px;width:14px">${i + 1}</span>${avatar(s.name, s.hue, 'mini')}<span>${esc(s.name)}</span><small class="num">${usd(s.received, 0)}</small></a>`).join('')}</div></aside>
      </section>
    </div>`,
    mount(root, ctx) {
      /* rotating destination word */
      const spans = [...root.querySelectorAll('#rot > span')]; let k = 0;
      ctx.every(2600, () => { const cur = spans[k]; k = (k + 1) % spans.length; const nx = spans[k];
        nx.classList.remove('up'); nx.classList.add('down'); void nx.offsetWidth; nx.classList.remove('down'); cur.classList.add('up'); });
      /* hero pill cycles through claimed sites */
      const pill = root.querySelector('#hero-pill'); const claimed = SITES.filter(s => s.claimed); let pi = 0;
      ctx.every(3200, () => { pill.classList.add('out'); ctx.after(300, () => { pi = (pi + 1) % claimed.length; const s = claimed[pi];
        pill.innerHTML = `${avatar(s.name, s.hue, 'pill-av')}<b style="font-weight:500">${esc(s.name)}</b><span class="logo-mark logo-inline" style="--s:14px"></span><span class="muted">earns from fees</span>`; pill.classList.remove('out'); }); });
      /* typing demo */
      const tt = root.querySelector('#typer-text'), hit = root.querySelector('#typer-hit'); let si = 0;
      const typeOne = () => { const s = SITES[si++ % SITES.length]; let i = 0; hit.classList.add('hidden'); tt.textContent = '';
        const step = () => { if (i <= s.domain.length) { tt.textContent = s.domain.slice(0, i++); ctx.after(70, step); }
          else { hit.innerHTML = `${avatar(s.name, s.hue, 'mini')}<div><b style="font-weight:600">${esc(s.name)}</b><div class="muted">${esc(s.domain)}</div></div>`; hit.classList.remove('hidden'); ctx.after(2200, typeOne); } };
        step(); };
      typeOne();
      /* token tabs */
      let stage = 'graduating', sort = 'mcap';
      const grid = root.querySelector('#home-grid');
      const paint = () => { grid.innerHTML = sortTokens(TOKENS.filter(t => t.stage === stage), sort).slice(0, 8).map(tokenCard).join(''); App.fillMeters(grid); };
      const tabs = (id, set) => root.querySelector(id).addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
        b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); set(b.dataset.v); paint(); });
      tabs('#home-stage', v => stage = v); tabs('#home-sort', v => sort = v);
    }
  };
};

VIEWS.explore = (q) => ({
  title: 'Explore — Conduit',
  html: `<div class="page"><div class="page-head"><h1 class="display">Explore</h1><p>Every token listed on Conduit and the website its fees are pointed at.</p></div>
    <div class="bar"><div class="seg" id="ex-stage"><button aria-pressed="true" data-v="all">All</button><button aria-pressed="false" data-v="graduating">Graduating</button><button aria-pressed="false" data-v="bonded">Bonded</button></div>
      <label class="field" style="margin:0;flex:1;max-width:280px">${icon('search')}<input id="ex-q" type="search" placeholder="Filter by name or site" value="${esc(q.q || '')}"></label>
      <select class="inp" id="ex-sort" style="width:auto;height:38px;margin-left:auto"><option value="mcap">Market cap</option><option value="paid">Most paid out</option><option value="new">Newest</option></select></div>
    <div class="tok-grid" id="ex-grid"></div><div class="empty" id="ex-empty" hidden><b>No tokens match</b><p>Try another name, ticker or website.</p></div></div>`,
  mount(root) {
    let stage = 'all';
    const grid = root.querySelector('#ex-grid'), qi = root.querySelector('#ex-q'), so = root.querySelector('#ex-sort'), empty = root.querySelector('#ex-empty');
    const paint = () => {
      const q = qi.value.trim().toLowerCase();
      const list = sortTokens([...localTokens(), ...TOKENS].filter(t => (stage === 'all' || t.stage === stage) &&
        (!q || [t.name, t.ticker, t.site].some(x => x.toLowerCase().includes(q)))), so.value);
      grid.innerHTML = list.map(tokenCard).join(''); empty.hidden = list.length > 0; App.fillMeters(grid);
    };
    root.querySelector('#ex-stage').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); stage = b.dataset.v; paint(); });
    qi.addEventListener('input', paint); so.addEventListener('change', paint); paint();
  }
});

VIEWS.merchants = () => ({
  title: 'Merchants — Conduit',
  html: `<div class="page"><div class="page-head"><h1 class="display">Merchants</h1><p>Websites that tokens point their fees at. A site claims its payouts by proving it controls the domain.</p></div>
    <div class="dir-row seg" id="m-filter"><button aria-pressed="true" data-v="all">All</button><button aria-pressed="false" data-v="claimed">Claimed</button><button aria-pressed="false" data-v="open">Not claimed</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th><button data-k="name">Website ↕</button></th><th><button data-k="tokens">Tokens ↕</button></th><th><button data-k="received">Received ↕</button></th><th><button data-k="owed">Owed ↕</button></th><th>Status</th></tr></thead><tbody id="m-body"></tbody></table></div></div>`,
  mount(root) {
    let filter = 'all', key = 'received', dir = -1;
    const body = root.querySelector('#m-body');
    const paint = () => {
      const list = SITES.filter(s => filter === 'all' || (filter === 'claimed') === s.claimed)
        .sort((a, b) => { const va = key === 'name' ? a.name : (a[key] || 0), vb = key === 'name' ? b.name : (b[key] || 0); return (va > vb ? 1 : va < vb ? -1 : 0) * dir; });
      body.innerHTML = list.map(s => `<tr class="rowlink" data-href="#/site/${s.domain}"><td><div class="cell-tok">${avatar(s.name, s.hue, 'mini')}<div>${esc(s.name)}<div class="muted" style="font-size:12px">${esc(s.domain)}</div></div></div></td>
        <td class="num">${s.tokens}</td><td class="num">${usd(s.received)}</td><td class="num">${usd(s.owed || 0)}</td><td><span class="claim ${s.claimed ? 'ok' : ''}" style="margin:0">${s.claimed ? 'Claimed' : 'Not claimed'}</span></td></tr>`).join('');
    };
    root.querySelector('#m-filter').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); filter = b.dataset.v; paint(); });
    root.querySelector('thead').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      if (key === b.dataset.k) dir = -dir; else { key = b.dataset.k; dir = key === 'name' ? 1 : -1; } paint(); });
    paint();
  }
});

VIEWS.payments = () => ({
  title: 'Payments — Conduit',
  html: `<div class="page"><div class="page-head"><h1 class="display">Payments</h1><p>Every payout from a token's fee vault to the website it names, newest first.</p></div>
    <div class="grid3" style="margin-bottom:16px">
      <div class="panel kpi"><div class="k">Paid out</div><div class="v num">${usd(PAYMENTS.reduce((a, p) => a + p.amount, 0))}</div></div>
      <div class="panel kpi"><div class="k">Payouts</div><div class="v num">${PAYMENTS.length}</div></div>
      <div class="panel kpi"><div class="k">Waiting on a claim</div><div class="v num">${usd(SITES.reduce((a, s) => a + (s.owed || 0), 0))}</div></div></div>
    <div class="bar"><div class="seg" id="p-rail"><button aria-pressed="true" data-v="">All rails</button><button aria-pressed="false" data-v="Bank">Bank</button><button aria-pressed="false" data-v="Card account">Card account</button><button aria-pressed="false" data-v="USDC wallet">USDC wallet</button></div></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Website</th><th>Token</th><th>Amount</th><th>To</th><th>When</th><th>Tx</th></tr></thead><tbody id="p-body"></tbody></table></div></div>`,
  mount(root) {
    const body = root.querySelector('#p-body');
    const paint = (r) => { body.innerHTML = paymentRows(PAYMENTS.filter(p => !r || p.rail === r)); };
    root.querySelector('#p-rail').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(b.dataset.v); });
    paint('');
  }
});

VIEWS.analytics = () => {
  const total = DAILY.reduce((a, b) => a + b, 0), max = Math.max(...DAILY);
  const bySite = SITES.filter(s => s.claimed).map(s => ({ s, v: s.received })).sort((a, b) => b.v - a.v);
  const sum = bySite.reduce((a, x) => a + x.v, 0);
  const vol = TOKENS.reduce((a, t) => a + t.mcap, 0);
  return {
    title: 'Analytics — Conduit',
    html: `<div class="page"><div class="page-head"><h1 class="display">Analytics</h1><p>Fees routed, where they went and how the listed tokens are doing.</p></div>
      <div class="grid4"><div class="panel kpi"><div class="k">Fees routed (30d)</div><div class="v num">${usd(total, 0)}</div></div>
        <div class="panel kpi"><div class="k">Daily average</div><div class="v num">${usd(total / 30, 0)}</div></div>
        <div class="panel kpi"><div class="k">Listed market cap</div><div class="v num">$${compact(vol)}</div></div>
        <div class="panel kpi"><div class="k">Tokens</div><div class="v num">${TOKENS.length}</div></div></div>
      <div class="grid2" style="margin-top:12px">
        <div class="panel"><div class="k muted" style="font-size:13px">Fees routed per day</div>
          <div class="bars">${DAILY.map((v, i) => `<div style="height:${(v / max * 100).toFixed(1)}%;animation-delay:${i * 18}ms" data-v="Day ${i + 1}: ${usd(v, 0)}"></div>`).join('')}</div>
          <div class="axis"><span>30d ago</span><span>15d</span><span>today</span></div></div>
        <div class="panel"><div class="k muted" style="font-size:13px">Share of payouts by website</div>
          <div class="share">${bySite.map(x => `<i style="width:${x.v / sum * 100}%;background:${color(x.s.hue, 55)}" title="${esc(x.s.name)}"></i>`).join('')}</div>
          <div class="legend">${bySite.map(x => `<div><i style="background:${color(x.s.hue, 55)}"></i><span>${esc(x.s.name)}</span><span>${(x.v / sum * 100).toFixed(1)}%</span></div>`).join('')}</div></div></div></div>`
  };
};

VIEWS.flow = () => ({
  title: 'Fee Flow — Conduit',
  html: `<div class="page"><div class="page-head"><h1 class="display">Fee Flow</h1><p>Follow a single trade's fee from the swap to the website that gets paid.</p></div>
    <div class="flow">${[
      ['01', 'Trade', 'Someone buys or sells a token. A 1% creator fee is taken on the swap.'],
      ['02', 'Vault', 'The fee lands in that token’s vault, tagged with the website it names.'],
      ['03', 'Convert', 'Swept on a schedule and converted to USDC.'],
      ['04', 'Claim', 'The website proves it owns its domain once, with a DNS TXT record.'],
      ['05', 'Payout', 'Paid to the site’s bank, card account or USDC wallet.']
    ].map(h => `<div class="hop rv"><span class="n">${h[0]}</span><b>${h[1]}</b><p>${h[2]}</p></div>`).join('')}</div>
    <div class="pulse-line"></div>
    <div class="grid2"><div class="panel"><h3 class="display" style="font-size:20px">Fee calculator</h3><p class="muted" style="font-size:13px;margin-top:4px">See what a website would receive for a given trading volume.</p>
      <div class="form" style="margin-top:16px"><label>Daily trading volume (USD)<input class="inp num" id="fc-vol" type="number" min="0" step="100" value="25000"></label>
        <label>Creator fee <small id="fc-fee-l">1.00%</small><input id="fc-fee" type="range" min="0.25" max="2" step="0.25" value="1"></label></div></div>
      <div class="panel"><div class="kv" id="fc-out"></div></div></div></div>`,
  mount(root) {
    const vol = root.querySelector('#fc-vol'), fee = root.querySelector('#fc-fee'), out = root.querySelector('#fc-out'), fl = root.querySelector('#fc-fee-l');
    const calc = () => {
      const v = Math.max(0, parseFloat(vol.value) || 0), f = parseFloat(fee.value) / 100;
      const gross = v * f, network = gross * 0.03, payout = gross * 0.05, net = gross - network - payout;
      fl.textContent = (f * 100).toFixed(2) + '%';
      out.innerHTML = `<span>Fees collected / day</span><span class="num">${usd(gross)}</span><span>Network + swap costs (3%)</span><span class="num">−${usd(network)}</span>
        <span>Payout costs (5%)</span><span class="num">−${usd(payout)}</span><span><b>Website receives / day</b></span><span class="num"><b>${usd(net)}</b></span>
        <span>Per month (30d)</span><span class="num accent">${usd(net * 30)}</span><span>Per year</span><span class="num">${usd(net * 365)}</span>`;
    };
    vol.addEventListener('input', calc); fee.addEventListener('input', calc); calc();
  }
});

VIEWS.launch = () => ({
  title: 'Launch — Conduit',
  html: `<div class="page"><div class="page-head"><h1 class="display">Launch a token</h1><p>Name it, point its fees at a website, and sign. This demo records the launch in your browser and asks your wallet for a signature; no contract is deployed.</p></div>
    <div class="launch-grid"><form class="panel form" id="lf" novalidate>
      <div class="grid2"><label>Name<input class="inp" name="name" maxlength="32" placeholder="Lumen" autocomplete="off"><span class="err" data-err="name"></span></label>
        <label>Ticker <small>2–8 letters</small><input class="inp mono" name="ticker" maxlength="8" placeholder="LUMEN" autocomplete="off" style="text-transform:uppercase"><span class="err" data-err="ticker"></span></label></div>
      <label>Fees go to <small>the website that will be paid</small><input class="inp" name="site" placeholder="example.com" autocomplete="off" inputmode="url"><span class="err" data-err="site"></span></label>
      <label>Description <small>optional</small><textarea class="inp" name="desc" maxlength="280" placeholder="What is this token for?"></textarea></label>
      <div><div style="font-size:13px;font-weight:500;margin-bottom:6px">Image <small class="muted" style="font-weight:400">optional, PNG/JPG/GIF/WebP under 2 MB</small></div>
        <div class="drop" id="drop" tabindex="0" role="button">Drop an image or click to choose</div><input type="file" id="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden><span class="err" data-err="image"></span></div>
      <div class="grid2"><div><div style="font-size:13px;font-weight:500;margin-bottom:6px">Paired with</div><div class="seg" id="pair"><button type="button" aria-pressed="true" data-v="USDC">USDC</button><button type="button" aria-pressed="false" data-v="ETH">ETH</button></div></div>
        <label>Creator fee <small id="fee-l">1.00%</small><input type="range" name="fee" min="0.25" max="2" step="0.25" value="1"></label></div>
      <label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input type="checkbox" name="terms" style="margin-top:4px;accent-color:rgb(var(--accent))"><span>I agree to the <a href="#/docs/terms" class="accent">terms</a> and understand this is a demo.</span></label><span class="err" data-err="terms" style="margin-top:-12px"></span>
      <button class="btn btn-accent shine" type="submit" id="lf-go">Connect wallet to launch</button>
    </form>
    <div class="sticky"><div class="tag" style="margin-bottom:8px">Preview</div><div id="lp"></div><div id="lf-done"></div></div></div></div>`,
  mount(root, ctx) {
    const f = root.querySelector('#lf'), lp = root.querySelector('#lp'), go = root.querySelector('#lf-go'), done = root.querySelector('#lf-done');
    let pair = 'USDC', image = null;
    const val = () => ({ name: f.name.value.trim(), ticker: f.ticker.value.trim().toUpperCase(), site: normSite(f.site.value), desc: f.desc.value.trim(), fee: parseFloat(f.fee.value) });
    const hue = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
    const preview = () => {
      const v = val();
      root.querySelector('#fee-l').textContent = v.fee.toFixed(2) + '%';
      lp.innerHTML = tokenCard({ name: v.name || 'Your token', ticker: v.ticker || 'TICKER', site: v.site || 'example.com', stage: 'graduating', mcap: 0, change: 0, curve: 0,
        pair, age: 'new', hue: hue(v.site || v.name || 'x'), holders: 0, paid: 0, address: '0x', image }).replace('<a class="tok" href="#/token/0x"', '<div class="tok"').replace(/<\/a>$/, '</div>');
    };
    const setErr = (k, m) => { const e = root.querySelector(`[data-err="${k}"]`); if (e) e.textContent = m || ''; const i = f[k]; if (i && i.classList) i.classList.toggle('bad', !!m); };
    const validate = () => {
      const v = val(); let ok = true;
      const chk = (k, cond, m) => { setErr(k, cond ? '' : m); if (!cond) ok = false; };
      chk('name', v.name.length >= 2, 'Give it a name of at least 2 characters.');
      chk('ticker', /^[A-Z0-9]{2,8}$/.test(v.ticker), 'Use 2–8 letters or digits.');
      chk('site', /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(v.site), 'Enter a domain like example.com.');
      chk('terms', f.terms.checked, 'Please accept the terms.');
      if (ok && [...TOKENS, ...localTokens()].some(t => t.ticker === v.ticker)) { setErr('ticker', 'That ticker is taken.'); ok = false; }
      return ok;
    };
    const syncBtn = () => { go.textContent = Wallet.state.address ? 'Sign and launch' : 'Connect wallet to launch'; };
    ctx.on(Wallet.on(syncBtn)); syncBtn();
    f.addEventListener('input', (e) => { if (e.target.name) setErr(e.target.name, ''); preview(); });
    root.querySelector('#pair').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); pair = b.dataset.v; preview(); });
    const drop = root.querySelector('#drop'), file = root.querySelector('#file');
    const take = (fl) => { setErr('image', '');
      if (!fl) return; if (!/^image\/(png|jpeg|gif|webp)$/.test(fl.type)) return setErr('image', 'That file type is not supported.');
      if (fl.size > 2 * 1024 * 1024) return setErr('image', 'Keep it under 2 MB.');
      const r = new FileReader(); r.onload = () => { image = r.result; drop.textContent = fl.name; preview(); }; r.readAsDataURL(fl); };
    drop.addEventListener('click', () => file.click());
    drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
    file.addEventListener('change', () => take(file.files[0]));
    ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => take(e.dataTransfer.files[0]));
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate()) { const bad = f.querySelector('.bad'); if (bad) bad.focus(); return; }
      if (!Wallet.state.address) { App.openWallet(); return; }
      const v = val();
      const msg = `Conduit launch\n\nToken: ${v.name} (${v.ticker})\nFees to: ${v.site}\nCreator fee: ${v.fee.toFixed(2)}%\nPaired with: ${pair}\nCreator: ${Wallet.state.address}\nIssued: ${new Date().toISOString()}\n\nThis signature records intent only. It does not move funds.`;
      go.disabled = true; go.textContent = 'Check your wallet…';
      try {
        const sig = await Wallet.signMessage(msg);
        const t = { ticker: v.ticker, name: v.name, site: v.site, stage: 'graduating', mcap: 0, change: 0, curve: 0, pair, age: 'new', hue: hue(v.site),
          holders: 1, paid: 0, address: '0x' + sig.slice(2, 42), image, local: true, sig, creator: Wallet.state.address, fee: v.fee };
        const list = localTokens(); list.unshift(t);
        try { sessionStorage.setItem('conduit:launched', JSON.stringify(list)); }
        catch (err) { t.image = null; list[0] = t; try { sessionStorage.setItem('conduit:launched', JSON.stringify(list)); } catch (e2) {} }
        done.innerHTML = `<div class="panel" style="margin-top:12px"><b>Launched (demo)</b><p class="muted" style="font-size:13px;margin-top:6px">Signed by ${short(Wallet.state.address)}. It now appears in Explore for this browser session.</p>
          <p class="mono muted" style="font-size:11px;margin-top:8px;word-break:break-all">${esc(sig)}</p><a class="btn btn-line sm" style="margin-top:12px" href="#/token/${t.address}">View token →</a></div>`;
        App.toast('Signed. Your token is live in this demo.');
        f.reset(); image = null; drop.textContent = 'Drop an image or click to choose'; preview();
      } catch (err) {
        App.toast(err && err.code === 4001 ? 'Signature declined.' : (err && err.message) || 'Signing failed.');
      } finally { go.disabled = false; syncBtn(); }
    });
    preview();
  }
});

function normSite(s) {
  return String(s || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/?#].*$/, '');
}

const DOCS = {
  '': ['Overview', `<h1 class="display">Conduit docs</h1>
    <p>Conduit lets anyone launch a token whose creator fees are paid to a website, not a wallet. The site does not need to know anything about crypto: it proves it owns its domain once and gets paid like any other income.</p>
    <p class="callout">This is a demo build. Tokens, sites and payments shown are sample data. Wallet connection and message signing are real; nothing is deployed on-chain.</p>
    <h2>In one paragraph</h2><p>A token is created with one field that matters: <code>website</code>. Every trade pays a creator fee into a vault tagged with that domain. On a schedule the vault is swept and converted to USDC. Once the website claims it, the balance is paid out to the site's bank, card account or USDC wallet.</p>
    <h2>Next</h2><ul><li><a class="accent" href="#/docs/how">How fees are routed</a></li><li><a class="accent" href="#/docs/claim">Claiming payouts for a website</a></li><li><a class="accent" href="#/docs/wallets">Wallets and signing</a></li></ul>`],
  how: ['How it works', `<h1 class="display">How fees are routed</h1>
    <h2>1. Launch</h2><p>The creator names the token, picks a ticker and enters the website that will be paid. The creator fee can be set from 0.25% to 2%.</p>
    <h2>2. Bonding curve</h2><p>New tokens trade on a bonding curve. When the curve fills to 100% the token is considered <em>bonded</em> and moves to a regular liquidity pool. Fees are collected in both phases.</p>
    <h2>3. Vault and conversion</h2><p>Fees accumulate per token in a vault keyed by the website. Sweeps convert them to USDC so the amount owed is stable.</p>
    <h2>4. Payout</h2><p>Unclaimed balances stay in the vault and are shown as <em>owed</em>. After a claim, payouts run automatically. See <a class="accent" href="#/flow">Fee Flow</a> for a calculator.</p>`],
  claim: ['Claiming', `<h1 class="display">Claiming payouts for a website</h1>
    <p>Only whoever controls a domain can claim what it is owed. Ownership is proved with a DNS record, the same way search engines and email providers verify domains.</p>
    <h2>Steps</h2><ol><li>Open your site's page, for example <a class="accent" href="#/site/harbor.fm">harbor.fm</a>, and choose <em>Claim this site</em>.</li><li>Connect the wallet you want linked and sign the claim message.</li><li>Add the TXT record shown to your domain's DNS.</li><li>Choose a payout destination: bank, card account or USDC wallet.</li></ol>
    <pre>conduit-verify.example.com.  TXT  "conduit-site=0xYOURADDRESS"</pre>`],
  wallets: ['Wallets', `<h1 class="display">Wallets and signing</h1>
    <p>Conduit discovers wallets with <code>EIP-6963</code>, so the list shows whatever is really installed in your browser. If none is found you'll see links to popular wallets.</p>
    <p>Connecting calls <code>eth_requestAccounts</code> (<code>EIP-1193</code>) and shares one address. Launches and claims ask for a <code>personal_sign</code> message that describes exactly what you're agreeing to. Signing a message cannot move funds.</p>
    <p>Press <code>D</code> to switch theme and <code>/</code> to search anywhere.</p>`],
  terms: ['Terms', `<h1 class="display">Terms of use</h1>
    <p>Last updated 1 October 2026.</p>
    <h2>The service</h2><p>Conduit is provided as a demonstration of routing token creator fees to websites. Nothing on this site is an offer to buy or sell any asset, and figures shown are sample data.</p>
    <h2>Your responsibilities</h2><p>You are responsible for your wallet, your keys and anything you sign. Only name a website you are allowed to name; never imply that a site endorses a token when it does not.</p>
    <h2>No warranty</h2><p>The service is provided “as is”, without warranty of any kind. To the extent permitted by law, Conduit is not liable for losses arising from use of the site.</p>
    <h2>Privacy</h2><p>Conduit stores your consent choice, theme and sidebar state in your browser. If you choose “Just this visit”, only the consent choice is kept, and only for the session. There are no analytics or third-party cookies.</p>`],
  disclosures: ['Disclosures', `<h1 class="display">Disclosures</h1>
    <ul><li>All tokens, websites, payments and statistics on this site are fictional sample data.</li>
    <li>Conduit is not affiliated with, endorsed by or sponsored by any payment processor, exchange, blockchain or wallet named on this site.</li>
    <li>Trading tokens is risky. Prices can go to zero. Nothing here is financial advice.</li>
    <li>A website listed as a fee recipient has not necessarily agreed to be listed, unless it shows as <em>Claimed</em>.</li></ul>`],
  license: ['License', `<h1 class="display">License</h1>
    <p>The source code of this site is released under the MIT License.</p>
    <pre>MIT License

Copyright (c) 2026 Conduit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.</pre>
    <p>Fonts are served by Google Fonts under the SIL Open Font License. Wallet logos come from @web3icons/core (MIT) and remain trademarks of their owners; they are used only to identify each wallet.</p>`]
};

VIEWS.docs = (q, sub = '') => {
  const doc = DOCS[sub] || DOCS[''];
  const key = DOCS[sub] ? sub : '';
  return {
    title: doc[0] + ' — Conduit docs',
    html: `<div class="page"><div class="docs"><nav class="docs-nav" aria-label="Docs">${Object.entries(DOCS).map(([k, d]) =>
      `<a href="#/docs${k ? '/' + k : ''}" class="${k === key ? 'active' : ''}">${d[0]}</a>`).join('')}</nav><article class="prose">${doc[1]}</article></div></div>`
  };
};

VIEWS.token = (q, addr) => {
  const t = findToken(addr) || localTokens().find(x => x.address.toLowerCase() === String(addr).toLowerCase());
  if (!t) return VIEWS.missing();
  const s = findSite(t.site);
  return {
    title: `${t.name} (${t.ticker}) — Conduit`,
    html: `<div class="page"><a class="link" href="#/explore">← Explore</a><div class="detail" style="margin-top:16px">
      <div>${tokenCard(t).replace(/^<a class="tok"[^>]*>/, '<div class="tok">').replace(/<\/a>$/, '</div>')}</div>
      <div><h1 class="display" style="font-size:40px;letter-spacing:-.03em">${esc(t.name)} <span class="muted mono" style="font-size:18px">${esc(t.ticker)}</span></h1>
        <p class="muted" style="margin-top:6px">Fees go to <a class="accent" href="#/site/${esc(t.site)}">${esc(s ? s.name : t.site)}</a>${t.local ? ' · launched in this browser' : ''}</p>
        <div class="grid3" style="margin-top:20px"><div class="panel kpi"><div class="k">Market cap</div><div class="v num">$${compact(t.mcap)}</div></div>
          <div class="panel kpi"><div class="k">Holders</div><div class="v num">${compact(t.holders)}</div></div>
          <div class="panel kpi"><div class="k">Paid to site</div><div class="v num">${usd(t.paid, 0)}</div></div></div>
        <div class="panel" style="margin-top:12px"><div class="kv"><span>Contract</span><span><button class="copy" data-copy="${t.address}">${short(t.address)} ${icon('copy', 'ic" style="width:12px;height:12px')}</button></span>
          <span>Stage</span><span>${t.stage === 'bonded' ? 'Bonded' : 'Bonding curve · ' + t.curve + '%'}</span><span>Paired with</span><span>${esc(t.pair)}</span>
          <span>Creator fee</span><span>${(t.fee || 1).toFixed(2)}%</span><span>Age</span><span>${esc(t.age)}</span>${t.creator ? `<span>Creator</span><span class="mono">${short(t.creator)}</span>` : ''}</div></div>
      </div></div></div>`
  };
};

VIEWS.site = (q, domain) => {
  const s = findSite(domain);
  const local = localTokens().filter(t => t.site === domain);
  if (!s && !local.length) return VIEWS.missing();
  const site = s || { name: domain, domain, hue: local[0].hue, claimed: false, received: 0, owed: 0, tokens: local.length };
  const toks = [...local, ...TOKENS.filter(t => t.site === domain)];
  const pays = PAYMENTS.filter(p => p.site === domain);
  return {
    title: `${site.name} — Conduit`,
    html: `<div class="page"><a class="link" href="#/merchants">← Merchants</a>
      <div class="mcard" style="margin-top:16px;cursor:default;transform:none"><div class="art" style="position:relative;height:130px">${art(site.hue, site.domain)}</div>
        <div class="body" style="padding:34px 20px 20px">${avatar(site.name, site.hue)}<h1 class="display" style="font-size:30px">${esc(site.name)}</h1><div class="dom">${esc(site.domain)}</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px"><span class="st ${site.claimed ? 'ok' : ''}" style="margin:0">${site.claimed ? '● Claimed' : '○ Not claimed'}</span>
          <span class="muted" style="font-size:13px">${site.claimed ? usd(site.received) + ' received' : usd(site.owed || 0) + ' owed'}</span>
          ${site.claimed ? '' : '<button class="btn btn-accent sm" id="claim-btn" style="margin-left:auto">Claim this site</button>'}</div>
        <div id="claim-out"></div></div></div>
      <div class="bar" style="margin-top:28px"><h3 class="display">Tokens paying this site</h3></div><div class="tok-grid">${toks.map(tokenCard).join('')}</div>
      <div class="bar" style="margin-top:28px"><h3 class="display">Payouts</h3></div>
      ${pays.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Website</th><th>Token</th><th>Amount</th><th>To</th><th>When</th><th>Tx</th></tr></thead><tbody>${paymentRows(pays)}</tbody></table></div>`
        : '<div class="empty"><b>No payouts yet</b><p>Payouts appear here once the site claims what it is owed.</p></div>'}</div>`,
    mount(root) {
      const btn = root.querySelector('#claim-btn'); if (!btn) return;
      btn.addEventListener('click', async () => {
        if (!Wallet.state.address) return App.openWallet();
        const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');
        const msg = `Conduit site claim\n\nDomain: ${site.domain}\nPayout address: ${Wallet.state.address}\nNonce: ${nonce}\n\nSigning proves you hold this address. It does not move funds.`;
        btn.disabled = true; btn.textContent = 'Check your wallet…';
        try {
          const sig = await Wallet.signMessage(msg);
          root.querySelector('#claim-out').innerHTML = `<div class="panel" style="margin-top:16px"><b>Signed. One step left.</b>
            <p class="muted" style="font-size:13px;margin:6px 0 10px">Add this TXT record to ${esc(site.domain)}'s DNS. Verification runs once the record is visible.</p>
            <pre class="mono" style="font-size:12px;white-space:pre-wrap;word-break:break-all;margin:0;background:rgb(var(--bg));padding:12px;border-radius:10px;border:1px solid rgb(var(--line))">_conduit.${esc(site.domain)}  TXT  "conduit-site=${Wallet.state.address};sig=${sig.slice(0, 18)}…;n=${nonce}"</pre>
            <button class="btn btn-line sm" style="margin-top:10px" data-copy="conduit-site=${Wallet.state.address};n=${nonce}">Copy record value</button></div>`;
          btn.textContent = 'Awaiting DNS';
        } catch (err) { App.toast(err && err.code === 4001 ? 'Signature declined.' : (err && err.message) || 'Signing failed.'); btn.disabled = false; btn.textContent = 'Claim this site'; }
      });
    }
  };
};

VIEWS.missing = () => ({
  title: 'Not found — Conduit',
  html: `<div class="page"><div class="empty" style="margin-top:60px"><b style="font-size:22px">Nothing here</b><p>That page, token or website doesn't exist. Try search, or head back home.</p><a class="btn btn-solid sm" href="#/" style="margin-top:18px">Go home</a></div></div>`
});

const ROUTES = { '': 'home', explore: 'explore', merchants: 'merchants', payments: 'payments', analytics: 'analytics', launch: 'launch', flow: 'flow', docs: 'docs', token: 'token', site: 'site' };
