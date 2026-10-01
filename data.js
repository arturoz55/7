/* Spout — market data for the preview.
   Tokens, websites and payouts are simulated (see interactions.js for the
   live market). Times are relative to page load so the feed always reads
   as current. */

'use strict';

const NAV = [
  { label: 'Home',      href: '#/',          icon: 'home' },
  { label: 'Explore',   href: '#/explore',   icon: 'search' },
  { label: 'Merchants', href: '#/merchants', icon: 'store' },
  { label: 'Payments',  href: '#/payments',  icon: 'dollar' },
  { label: 'Analytics', href: '#/analytics', icon: 'chart' },
  { label: 'Launch',    href: '#/launch',    icon: 'plus', cta: true },
  { label: 'Portfolio', href: '#/portfolio', icon: 'wallet' },
  { label: 'Fee Flow',  href: '#/flow',      icon: 'flow' },
  { label: 'Docs',      href: '#/docs',      icon: 'code' }
];

const ICONS = {
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14.5" r="1.3"/>',
  home:   '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  store:  '<path d="M4 9h16l-1.5-5h-13zM5 9v11h14V9M9 20v-6h6v6"/>',
  dollar: '<path d="M12 2v20M17 6.5C17 4.6 14.8 4 12 4S7 5 7 7.5s2.4 3 5 3.5 5 1 5 3.5-2.2 3.5-5 3.5-5-.6-5-2.5"/>',
  chart:  '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
  plus:   '<path d="M12 5v14M5 12h14"/>',
  flow:   '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 12h4c2 0 2-6 6-6M11 12c2 0 2 6 6 6"/>',
  code:   '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  copy:   '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
  ext:    '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  lock:   '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check:  '<path d="m5 12 5 5L20 7"/>',
  globe:  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'
};

/* Original line-art marks, one per fictional brand (24×24, stroked in white). */
const MARKS = {
  sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  box:     '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9M7.5 5.2l9 4.5"/>',
  leaf:    '<path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15z"/><path d="m5 19 8-8"/>',
  anchor:  '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 10h8M4 13a8 8 0 0 0 16 0"/>',
  moon:    '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  check:   '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
  orbit:   '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-25 12 12)"/>',
  wheat:   '<path d="M12 21V8M12 8c-2-1-3-3-3-5 2 0 3 1.5 3 3 0-1.5 1-3 3-3 0 2-1 4-3 5zM12 13c-2.5 0-4-1.5-4.5-3.5 2 0 3.5.8 4.5 2 1-1.2 2.5-2 4.5-2-.5 2-2 3.5-4.5 3.5zM12 18c-2.5 0-4-1.5-4.5-3.5 2 0 3.5.8 4.5 2 1-1.2 2.5-2 4.5-2-.5 2-2 3.5-4.5 3.5z"/>',
  flame:   '<path d="M12 22c4 0 7-2.7 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4.3 3 7 7 7z"/>',
  wave:    '<path d="M2 12h3l2-6 4 12 3-9 2 5 2-2h4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  sprout:  '<path d="M12 21v-9M12 12C12 8 9 6 5 6c0 4 3 6 7 6zM12 10c0-3 2.5-5 6-5 0 3.5-2.5 5-6 5z"/>',
  book:    '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7"/>',
  mail:    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  bag:     '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  star:    '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'
};

/* Fictional websites. hue drives the generated art and avatar color. */
const SITES = [
  { name: 'Lumen Notes',    owner: 'lumennotes.app',   domain: 'lumennotes.app',   hue: 262, logo: 'sun', logoImg: 'logos/lumen.svg', claimed: true,  received: 18420.55, tokens: 3 },
  { name: 'Parcel Post',    owner: 'parcelpost.io',    domain: 'parcelpost.io',    hue: 18, logo: 'box', logoImg: 'logos/parcel.svg',  claimed: true,  received: 9310.20,  tokens: 2 },
  { name: 'Fieldkit',       owner: 'fieldkit.dev',     domain: 'fieldkit.dev',     hue: 150, logo: 'leaf', logoImg: 'logos/field.svg', claimed: true,  received: 7442.90,  tokens: 2 },
  { name: 'Harbor Radio',   owner: 'harbor.fm',        domain: 'harbor.fm',        hue: 205, logo: 'anchor', logoImg: 'logos/harbor.svg', claimed: false, received: 0,        tokens: 1, owed: 1260.40 },
  { name: 'Quietbox',       owner: 'quietbox.co',      domain: 'quietbox.co',      hue: 330, logo: 'moon', logoImg: 'logos/quiet.svg', claimed: true,  received: 5120.00,  tokens: 1 },
  { name: 'Tinyforms',      owner: 'tinyforms.so',     domain: 'tinyforms.so',     hue: 45, logo: 'check', logoImg: 'logos/forms.svg',  claimed: false, received: 0,        tokens: 1, owed: 842.10 },
  { name: 'Orbit Maps',     owner: 'orbitmaps.net',    domain: 'orbitmaps.net',    hue: 185, logo: 'orbit', logoImg: 'logos/orbit.svg', claimed: true,  received: 3980.75,  tokens: 1 },
  { name: 'Grainline',      owner: 'grainline.shop',   domain: 'grainline.shop',   hue: 30, logo: 'wheat', logoImg: 'logos/grain.svg',  claimed: false, received: 0,        tokens: 1, owed: 512.00 },
  { name: 'Kilnworks',      owner: 'kilnworks.studio', domain: 'kilnworks.studio', hue: 8, logo: 'flame', logoImg: 'logos/kiln.svg',   claimed: true,  received: 2210.30,  tokens: 1 },
  { name: 'Patchbay',       owner: 'patchbay.audio',   domain: 'patchbay.audio',   hue: 280, logo: 'wave', logoImg: 'logos/patch.svg', claimed: false, received: 0,        tokens: 1, owed: 301.65 },
  { name: 'Northwind Reads',owner: 'northwind.pub',    domain: 'northwind.pub',    hue: 220, logo: 'compass', logoImg: 'logos/north.svg', claimed: true,  received: 1640.00,  tokens: 1 },
  { name: 'Sprout Kit',     owner: 'sproutkit.garden', domain: 'sproutkit.garden', hue: 110, logo: 'sprout', logoImg: 'logos/sprout.svg', claimed: false, received: 0,        tokens: 1, owed: 220.00 }
];

/* Deterministic pseudo-addresses so links stay stable between visits. */
function fakeAddr(seed) {
  let h = 2166136261 >>> 0, out = '0x';
  for (let i = 0; i < 40; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i; h = Math.imul(h, 16777619) >>> 0;
    out += '0123456789abcdef'[h & 15];
  }
  return out;
}

/* Logo files for tokens whose brand you own or are licensed to use.
   Put the file in logos/ and map the ticker to it, e.g.  LUMEN: 'logos/lumen.png'.
   A token with no entry here (or whose file fails to load) shows its line-art mark. */
const TOKEN_IMAGES = {
  LUMEN: 'logos/lumen.svg',
  PARCEL: 'logos/parcel.svg',
  FIELD: 'logos/field.svg',
  HARBOR: 'logos/harbor.svg',
  QUIET: 'logos/quiet.svg',
  FORMS: 'logos/forms.svg',
  ORBIT: 'logos/orbit.svg',
  GRAIN: 'logos/grain.svg',
  KILN: 'logos/kiln.svg',
  PATCH: 'logos/patch.svg',
  NORTH: 'logos/north.svg',
  SPROUT: 'logos/sprout.svg',
  NOTES: 'logos/notes.svg',
  POST: 'logos/post.svg',
  KIT: 'logos/kit.svg',
  LUX: 'logos/lux.svg',
};

function ageMinutes(a) { const n = parseFloat(a); return a.endsWith('d') ? n * 1440 : a.endsWith('h') ? n * 60 : n; }

const TOKEN_LOGO = {'LUMEN': 'sun', 'PARCEL': 'box', 'FIELD': 'leaf', 'HARBOR': 'anchor', 'QUIET': 'moon', 'FORMS': 'check', 'ORBIT': 'orbit', 'GRAIN': 'wheat', 'KILN': 'flame', 'PATCH': 'wave', 'NORTH': 'compass', 'SPROUT': 'sprout', 'NOTES': 'book', 'POST': 'mail', 'KIT': 'bag', 'LUX': 'star'};

const TOKENS = [
  ['LUMEN',  'Lumen',        'lumennotes.app',   'graduating', 48210, 6.4,  71, 'USDC', '12m'],
  ['PARCEL', 'Parcel',       'parcelpost.io',    'graduating', 31890, 2.1,  52, 'ETH',  '38m'],
  ['FIELD',  'Fieldkit',     'fieldkit.dev',     'graduating', 22410, -1.8, 41, 'USDC', '1h'],
  ['HARBOR', 'Harbor',       'harbor.fm',        'graduating', 18770, 0.6,  36, 'ETH',  '2h'],
  ['QUIET',  'Quietbox',     'quietbox.co',      'bonded',     612000, 12.2, 100, 'USDC', '3d'],
  ['FORMS',  'Tinyforms',    'tinyforms.so',     'graduating', 9420,  4.3,  19, 'USDC', '3h'],
  ['ORBIT',  'Orbit',        'orbitmaps.net',    'bonded',     288400, -3.4, 100, 'ETH',  '6d'],
  ['GRAIN',  'Grainline',    'grainline.shop',   'graduating', 7300,  0,    14, 'USDC', '5h'],
  ['KILN',   'Kiln',         'kilnworks.studio', 'bonded',     154900, 1.1,  100, 'USDC', '9d'],
  ['PATCH',  'Patchbay',     'patchbay.audio',   'graduating', 5120,  8.9,  9,  'ETH',  '7h'],
  ['NORTH',  'Northwind',    'northwind.pub',    'bonded',     98200, 0.4,  100, 'USDC', '12d'],
  ['SPROUT', 'Sprout',       'sproutkit.garden', 'graduating', 3900,  -0.7, 6,  'USDC', '9h'],
  ['NOTES',  'Lumen Pages',  'lumennotes.app',   'graduating', 2810,  1.4,  4,  'USDC', '11h'],
  ['POST',   'Postmark',     'parcelpost.io',    'bonded',     74400, 2.6,  100, 'ETH',  '15d'],
  ['KIT',    'Kitbag',       'fieldkit.dev',     'graduating', 2100,  0.2,  3,  'USDC', '14h'],
  ['LUX',    'Lux',          'lumennotes.app',   'bonded',     51200, -0.9, 100, 'USDC', '20d']
].map(([ticker, name, site, stage, mcap, change, curve, pair, age]) => {
  const s = SITES.find(x => x.domain === site);
  const paid = s && s.claimed ? Math.round(mcap * 0.012 * 100) / 100 : 0;
  return { created: Date.now() - ageMinutes(age) * 60e3 - Math.floor(Math.random() * 50e3), ticker, name, site, stage, logo: TOKEN_LOGO[ticker], logoImg: TOKEN_IMAGES[ticker], mcap, change, curve, pair, age, hue: s ? s.hue : 260,
    holders: Math.round(Math.sqrt(mcap) * 3.1), paid, address: fakeAddr(ticker + site) };
});

/* Completed payouts, newest first. */
const PAYMENTS = (() => {
  const out = [], now = Date.now() - 6 * 60e3;
  const claimed = SITES.filter(s => s.claimed);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 24; i++) {
    const s = claimed[Math.floor(rnd() * claimed.length)];
    const toks = TOKENS.filter(t => t.site === s.domain);
    const t = toks[Math.floor(rnd() * toks.length)];
    out.push({
      id: 'po_' + fakeAddr('p' + i).slice(2, 14),
      site: s.domain, token: t.ticker,
      amount: Math.round((40 + rnd() * 900) * 100) / 100,
      rail: ['Bank', 'Card account', 'USDC wallet'][Math.floor(rnd() * 3)],
      at: now - Math.floor(i * 3.3 * 3600e3 + rnd() * 3600e3),
      tx: fakeAddr('tx' + i) + fakeAddr('tx2' + i).slice(2, 26)
    });
  }
  return out;
})();

/* Thirty days of fees routed (USD), for the analytics charts. */
const DAILY = (() => {
  let v = 1800, seed = 3; const out = [];
  const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  for (let i = 0; i < 30; i++) { v = Math.max(600, v * (0.9 + rnd() * 0.26)); out.push(Math.round(v)); }
  return out;
})();

/* Third-party wallets shown when the browser has none announced.
   Logos: @web3icons/core (MIT), "background" variant. */
const WALLET_CATALOGUE = [
  { name: 'MetaMask',        url: 'https://metamask.io/download/',          color: '#F6851B', logo: 'wallets/metamask.svg' },
  { name: 'Rabby',           url: 'https://rabby.io/',                      color: '#7084FF', logo: 'wallets/rabby.svg' },
  { name: 'Coinbase Wallet', url: 'https://www.coinbase.com/wallet',        color: '#0052FF', logo: 'wallets/coinbase.svg' },
  { name: 'Rainbow',         url: 'https://rainbow.me/',                    color: '#174299', logo: 'wallets/rainbow.svg' },
  { name: 'Phantom',         url: 'https://phantom.com/',                   color: '#AB9FF2', logo: 'wallets/phantom.svg' },
  { name: 'Trust Wallet',    url: 'https://trustwallet.com/',               color: '#3375BB', logo: 'wallets/trust.svg' },
  { name: 'OKX Wallet',      url: 'https://www.okx.com/web3',               color: '#111111', logo: 'wallets/okx.svg' },
  { name: 'Zerion',          url: 'https://zerion.io/',                     color: '#2962EF', logo: 'wallets/zerion.svg' }
];

const CHAINS = {
  1: 'Ethereum', 10: 'Optimism', 56: 'BNB Chain', 137: 'Polygon', 8453: 'Base',
  42161: 'Arbitrum One', 11155111: 'Sepolia', 84532: 'Base Sepolia'
};

/* Headline figures, derived from the data above so every number on the page agrees. */
const STATS = (() => {
  const paid = PAYMENTS.reduce((a, p) => a + p.amount, 0);
  const owed = SITES.reduce((a, s) => a + (s.owed || 0), 0);
  const claimed = SITES.filter(s => s.claimed).length;
  return [
    { prefix: '$', value: Math.round(paid + owed), label: 'Fees routed to websites', note: usdPlain(owed) + ' waiting to be claimed' },
    { value: SITES.length, label: 'Websites earning fees', note: claimed + ' have claimed their payouts' },
    { value: 92, unit: '%', label: 'Of every fee reaches the site', note: 'After network and payout costs' },
    { value: PAYMENTS.length, label: 'Payouts settled', note: 'To banks, card accounts and USDC wallets' }
  ];
  function usdPlain(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
})();
