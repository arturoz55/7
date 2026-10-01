/* Conduit — interactions: the preview market, watchlist, preview trading,
   card tilt, confetti and the hero spotlight. The market is simulated in the
   browser: a recurring pool of traders, log-normal trade sizes, momentum and
   the occasional whale. Trades never leave the browser. */

'use strict';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function seeded(str) {
  let s = 0; for (const c of str) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  s = s || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/* ---------------------------------------------------------------- market */
const Market = (() => {
  const subs = new Set();
  const hist = new Map();          // ticker -> [{t, v}]
  const SUPPLY = 1e9;
  const STEP = 15 * 60e3;          // 15 minutes between history points
  let timer = null;

  function history(t) {
    if (hist.has(t.ticker)) return hist.get(t.ticker);
    const rnd = seeded(t.ticker + t.site), n = 96, out = [];
    let v = t.mcap;
    const now = Date.now();
    for (let i = n - 1; i >= 0; i--) {
      const vol = Math.exp(Math.log(t.mcap * 0.0025) + (rnd() - 0.5) * 2.2);
      out[i] = { t: now - (n - 1 - i) * STEP, v, vol };
      v = Math.max(t.mcap * 0.2, v / (1 + (rnd() - 0.47) * 0.06));
    }
    hist.set(t.ticker, out);
    return out;
  }

  const price = (t) => t.mcap / SUPPLY;
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* 24h figures: a seeded base for the day so far, plus every live trade since load. */
  const day = new Map();
  function stats(t) {
    if (!day.has(t.ticker)) {
      const h = history(t);
      const vol = h.reduce((a, p) => a + p.vol, 0);
      const txns = Math.round(vol / (55 + seeded(t.ticker)() * 60));
      const buys = Math.round(txns * (0.5 + t.change / 200));
      day.set(t.ticker, { vol, txns, buys, sells: txns - buys });
    }
    const d = day.get(t.ticker);
    return { ...d, liquidity: Math.max(2000, t.mcap * 0.35) };
  }

  /* Who holds the supply: the curve or pool, the creator, then the largest wallets. */
  function holders(t) {
    const rnd = seeded('h' + t.ticker);
    const rows = [];
    const poolShare = t.stage === 'bonded' ? 18 + rnd() * 10 : Math.max(8, 100 - t.curve * 0.9);
    rows.push({ label: t.stage === 'bonded' ? 'Liquidity pool' : 'Bonding curve', pct: poolShare, tag: 'pool' });
    rows.push({ label: t.creator ? short(t.creator) : TRADERS[Math.floor(rnd() * TRADERS.length)].slice(0, 6) + '…' + TRADERS[0].slice(-4), pct: 1.5 + rnd() * 3, tag: 'creator' });
    let left = 100 - poolShare - rows[1].pct, share = left * 0.16;
    for (let i = 0; i < 6; i++) { const a = TRADERS[Math.floor(rnd() * TRADERS.length)]; rows.push({ label: short(a), pct: share }); share *= 0.62 + rnd() * 0.2; }
    return rows;
  }

  /* A recurring cast of traders so the same wallets show up again, like a real market. */
  const TRADERS = Array.from({ length: 48 }, (_, i) => {
    const r = seeded('trader' + i); let a = '0x';
    for (let k = 0; k < 40; k++) a += '0123456789abcdef'[Math.floor(r() * 16)];
    return a;
  });
  const bias = new Map();

  /* Constant-product style quote against a virtual pool sized from market cap. */
  function quote(t, side, amount) {
    const fee = (t.fee || 1) / 100;
    const pool = Math.max(2000, t.mcap * 0.35);
    if (!(amount > 0)) return null;
    if (side === 'buy') {
      const net = amount * (1 - fee);
      const impact = net / (pool + net);
      const tokens = net / price(t) * (1 - impact);
      return { pay: amount, get: tokens, fee: amount * fee, impact, avg: amount / tokens };
    }
    const gross = amount * price(t);
    const impact = gross / (pool + gross);
    const out = gross * (1 - impact);
    return { pay: amount, get: out * (1 - fee), fee: out * fee, impact, avg: out / amount };
  }

  function apply(t, side, usdValue, who) {
    const st = stats(t), dd = day.get(t.ticker);
    dd.vol += usdValue; dd.txns += 1; side === 'buy' ? dd.buys++ : dd.sells++;
    const pool = Math.max(2000, t.mcap * 0.35);
    const delta = (side === 'buy' ? 1 : -1) * usdValue / pool * 0.5;
    const before = t.mcap;
    t.mcap = Math.max(500, t.mcap * (1 + delta));
    t.change = Math.max(-99, Math.round((t.change + (t.mcap / before - 1) * 100) * 10) / 10);
    if (t.stage === 'graduating' && side === 'buy') t.curve = Math.min(99, t.curve + Math.max(0, Math.round(delta * 40)));
    if (side === 'buy' && Math.random() < 0.15) t.holders += 1;
    const s = typeof findSite === 'function' && findSite(t.site);
    if (s && s.claimed) t.paid = Math.round((t.paid + usdValue * (t.fee || 1) / 100) * 100) / 100;
    const h = history(t), last = h[h.length - 1], now = Date.now();
    if (now - last.t < 60e3) { last.v = t.mcap; last.vol += usdValue; } else { h.push({ t: now, v: t.mcap, vol: usdValue }); if (h.length > 400) h.shift(); }
    const ev = { t, side, usd: usdValue, who: who || trader(), at: now, up: t.mcap >= before, whale: usdValue >= 1000, tokens: usdValue / price(t) };
    subs.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
    return ev;
  }

  function trader() {
    if (Math.random() < 0.82) return TRADERS[Math.floor(Math.random() ** 1.6 * TRADERS.length)];
    let a = '0x'; for (let i = 0; i < 40; i++) a += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    return a;
  }

  /* Bigger tokens trade more often; each token drifts between buying and selling streaks. */
  function pick() {
    const w = TOKENS.map(t => Math.sqrt(t.mcap)), sum = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < TOKENS.length; i++) { r -= w[i]; if (r <= 0) return TOKENS[i]; }
    return TOKENS[0];
  }
  function tick() {
    const t = pick();
    const b = Math.max(-0.25, Math.min(0.25, (bias.get(t.ticker) || 0) * 0.85 + gauss() * 0.08));
    bias.set(t.ticker, b);
    const side = Math.random() < 0.52 + b ? 'buy' : 'sell';
    let usdValue = Math.exp(Math.log(70) + gauss() * 1.05);
    if (Math.random() < 0.025) usdValue *= 10 + Math.random() * 15;
    usdValue = Math.round(Math.min(Math.max(usdValue, 3), t.mcap * 0.04) * 100) / 100;
    apply(t, side, usdValue);
  }

  function start() {
    if (timer) return;
    const loop = () => {
      if (!document.hidden) { tick(); if (Math.random() < 0.18) { setTimeout(tick, 250 + Math.random() * 400); setTimeout(tick, 700 + Math.random() * 600); } }
      timer = setTimeout(loop, Math.exp(Math.log(1900) + gauss() * 0.55));
    };
    timer = setTimeout(loop, 1200);
  }

  return { history, quote, apply, price, stats, holders, start, on: (fn) => { subs.add(fn); return () => subs.delete(fn); } };
})();

/* ---------------------------------------------------------------- watchlist */
const Watch = (() => {
  let mem = null;
  const read = () => {
    if (mem) return mem;
    try { mem = new Set(JSON.parse(localStorage.getItem('conduit:watch') || '[]')); } catch (e) { mem = new Set(); }
    return mem;
  };
  const save = () => { if (Prefs.allowed()) try { localStorage.setItem('conduit:watch', JSON.stringify([...read()])); } catch (e) {} };
  return {
    has: (k) => read().has(k),
    list: () => [...read()],
    toggle(k) { const s = read(); s.has(k) ? s.delete(k) : s.add(k); save(); return s.has(k); }
  };
})();

/* ---------------------------------------------------------------- holdings (preview, per wallet, this session) */
const Holdings = {
  key: () => 'conduit:hold:' + (Wallet.state.address || '').toLowerCase(),
  get(ticker) { try { return JSON.parse(sessionStorage.getItem(this.key()) || '{}')[ticker] || 0; } catch (e) { return 0; } },
  add(ticker, n) {
    let all = {}; try { all = JSON.parse(sessionStorage.getItem(this.key()) || '{}'); } catch (e) {}
    all[ticker] = Math.max(0, (all[ticker] || 0) + n);
    try { sessionStorage.setItem(this.key(), JSON.stringify(all)); } catch (e) {}
    return all[ticker];
  }
};

/* ---------------------------------------------------------------- effects */
const FX = (() => {
  /* 3D tilt with a moving glare on token cards (fine pointers only). */
  function initTilt() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let cur = null;
    document.addEventListener('pointermove', (e) => {
      if (reducedMotion()) return;
      const card = e.target.closest('.tok, .mcard:not(.static)');
      if (cur && cur !== card) reset(cur);
      cur = card; if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
      card.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      card.classList.add('tilting');
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur && reset(cur));
    function reset(c) { c.classList.remove('tilting'); c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); }
  }

  /* A soft light that follows the pointer across the hero. */
  function spotlight(el) {
    if (!el || reducedMotion()) return () => {};
    const move = (e) => { const r = el.getBoundingClientRect();
      el.style.setProperty('--sx', (e.clientX - r.left) + 'px'); el.style.setProperty('--sy', (e.clientY - r.top) + 'px'); };
    el.addEventListener('pointermove', move);
    return () => el.removeEventListener('pointermove', move);
  }

  function confetti(originX = innerWidth / 2, originY = innerHeight / 3) {
    if (reducedMotion()) return;
    const c = document.createElement('canvas');
    c.className = 'confetti'; c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
    document.body.appendChild(c);
    const g = c.getContext('2d'); g.scale(devicePixelRatio, devicePixelRatio);
    const cols = ['#8A7AFF', '#28D6AA', '#FFC93C', '#FF6B6B', '#FFFFFF', '#4CC9F0'];
    const ps = Array.from({ length: 160 }, () => ({
      x: originX, y: originY, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 4,
      w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: cols[Math.floor(Math.random() * cols.length)]
    }));
    const t0 = performance.now();
    const frame = (now) => {
      const age = now - t0; g.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach(p => { p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.globalAlpha = Math.max(0, 1 - age / 2200); g.translate(p.x, p.y); g.rotate(p.r);
        g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); g.restore(); });
      if (age < 2200) requestAnimationFrame(frame); else c.remove();
    };
    requestAnimationFrame(frame);
  }

  return { initTilt, spotlight, confetti };
})();

/* DEX-style price: 0.0000482 reads as 0.0₄482. */
function fmtPrice(p) {
  if (!(p > 0)) return '$0';
  if (p >= 0.01) return '$' + p.toFixed(4);
  const zeros = Math.floor(-Math.log10(p)) - 1;
  const digits = Math.round(p * 10 ** (zeros + 4)).toString().slice(0, 4);
  if (zeros < 3) return '$0.' + '0'.repeat(zeros) + digits;
  const sub = String(zeros).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('');
  return '$0.0' + sub + digits;
}

/* Relative age that keeps counting: 45s, 12m, 3h, 6d. */
function ageOf(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60); if (m < 60) return m + 'm';
  const h = Math.floor(m / 60); if (h < 48) return h + 'h';
  return Math.floor(h / 24) + 'd';
}
