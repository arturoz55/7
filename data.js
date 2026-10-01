/* Conduit — sample data.
   Everything here is fictional demo data: the tokens, the websites and the
   ledger. Nothing on the page reads a live market. */

'use strict';

const NAV = [
  { label: 'Home',      href: '#/',          icon: 'home' },
  { label: 'Explore',   href: '#/explore',   icon: 'search' },
  { label: 'Merchants', href: '#/merchants', icon: 'store' },
  { label: 'Payments',  href: '#/payments',  icon: 'dollar' },
  { label: 'Analytics', href: '#/analytics', icon: 'chart' },
  { label: 'Launch',    href: '#/launch',    icon: 'plus', cta: true },
  { label: 'Fee Flow',  href: '#/flow',      icon: 'flow' },
  { label: 'Docs',      href: '#/docs',      icon: 'code' }
];

const ICONS = {
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

const STATS = [
  { prefix: '$', value: 4.2, decimals: 1, unit: 'M', label: 'Fees routed to websites', note: 'Sample figure for this demo', delta: '+18% 30d' },
  { value: 1284, unit: '', label: 'Websites receiving fees', note: 'Across every listed token' },
  { value: 92, unit: '%', label: 'Of fees reach the site', note: 'After network and payout costs' },
  { value: 3, suffix: 'min', label: 'Median time to payout', note: 'From fee sweep to settlement' }
];

/* Fictional websites. hue drives the generated art and avatar color. */
const SITES = [
  { name: 'Lumen Notes',    owner: 'lumennotes.app',   domain: 'lumennotes.app',   hue: 262, claimed: true,  received: 18420.55, tokens: 3 },
  { name: 'Parcel Post',    owner: 'parcelpost.io',    domain: 'parcelpost.io',    hue: 18,  claimed: true,  received: 9310.20,  tokens: 2 },
  { name: 'Fieldkit',       owner: 'fieldkit.dev',     domain: 'fieldkit.dev',     hue: 150, claimed: true,  received: 7442.90,  tokens: 2 },
  { name: 'Harbor Radio',   owner: 'harbor.fm',        domain: 'harbor.fm',        hue: 205, claimed: false, received: 0,        tokens: 1, owed: 1260.40 },
  { name: 'Quietbox',       owner: 'quietbox.co',      domain: 'quietbox.co',      hue: 330, claimed: true,  received: 5120.00,  tokens: 1 },
  { name: 'Tinyforms',      owner: 'tinyforms.so',     domain: 'tinyforms.so',     hue: 45,  claimed: false, received: 0,        tokens: 1, owed: 842.10 },
  { name: 'Orbit Maps',     owner: 'orbitmaps.net',    domain: 'orbitmaps.net',    hue: 185, claimed: true,  received: 3980.75,  tokens: 1 },
  { name: 'Grainline',      owner: 'grainline.shop',   domain: 'grainline.shop',   hue: 30,  claimed: false, received: 0,        tokens: 1, owed: 512.00 },
  { name: 'Kilnworks',      owner: 'kilnworks.studio', domain: 'kilnworks.studio', hue: 8,   claimed: true,  received: 2210.30,  tokens: 1 },
  { name: 'Patchbay',       owner: 'patchbay.audio',   domain: 'patchbay.audio',   hue: 280, claimed: false, received: 0,        tokens: 1, owed: 301.65 },
  { name: 'Northwind Reads',owner: 'northwind.pub',    domain: 'northwind.pub',    hue: 220, claimed: true,  received: 1640.00,  tokens: 1 },
  { name: 'Sprout Kit',     owner: 'sproutkit.garden', domain: 'sproutkit.garden', hue: 110, claimed: false, received: 0,        tokens: 1, owed: 220.00 }
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
  return { ticker, name, site, stage, mcap, change, curve, pair, age, hue: s ? s.hue : 260,
    holders: Math.round(Math.sqrt(mcap) * 3.1), paid, address: fakeAddr(ticker + site) };
});

/* Completed payouts, newest first. */
const PAYMENTS = (() => {
  const out = [], now = Date.UTC(2026, 8, 30, 18, 0);
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
