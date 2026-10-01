/* Conduit — interactions: simulated live market, watchlist, demo trading,
   card tilt, confetti and the hero spotlight. Everything here is a demo:
   prices move on a local random walk and trades never leave the browser. */

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
      out[i] = { t: now - (n - 1 - i) * STEP, v };
      v = Math.max(t.mcap * 0.2, v / (1 + (rnd() - 0.47) * 0.06));
    }
    hist.set(t.ticker, out);
    return out;
  }

  const price = (t) => t.mcap / SUPPLY;

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
    const pool = Math.max(2000, t.mcap * 0.35);
    const delta = (side === 'buy' ? 1 : -1) * usdValue / pool * 0.5;
    const before = t.mcap;
    t.mcap = Math.max(500, t.mcap * (1 + delta));
    t.change = Math.max(-99, Math.round((t.change + (t.mcap / before - 1) * 100) * 10) / 10);
    if (t.stage === 'graduating' && side === 'buy') t.curve = Math.min(99, t.curve + Math.max(0, Math.round(delta * 40)));
    if (side === 'buy' && Math.random() < 0.15) t.holders += 1;
    const s = typeof findSite === 'function' && findSite(t.site);
    if (s && s.claimed) t.paid = Math.round((t.paid + usdValue * (t.fee || 1) / 100) * 100) / 100;
    const h = history(t); h.push({ t: Date.now(), v: t.mcap }); if (h.length > 400) h.shift();
    const ev = { t, side, usd: usdValue, who: who || randomAddr(), at: Date.now(), up: t.mcap >= before };
    subs.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
    return ev;
  }

  function randomAddr() {
    let a = '0x'; for (let i = 0; i < 40; i++) a += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    return a;
  }

  function tick() {
    const t = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const side = Math.random() < 0.56 ? 'buy' : 'sell';
    const usdValue = Math.round((15 + Math.random() ** 2 * Math.min(2400, t.mcap * 0.02)) * 100) / 100;
    apply(t, side, usdValue);
  }

  function start() {
    if (timer) return;
    const loop = () => { if (!document.hidden) tick(); timer = setTimeout(loop, 1800 + Math.random() * 2200); };
    timer = setTimeout(loop, 1500);
  }

  return { history, quote, apply, price, start, on: (fn) => { subs.add(fn); return () => subs.delete(fn); } };
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

/* ---------------------------------------------------------------- holdings (demo) */
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
