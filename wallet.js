/* Spout — wallet.
   Discovery follows EIP-6963: each injected wallet announces itself with a name
   and icon. The connection is plain EIP-1193 (eth_requestAccounts). Nothing is
   signed or sent on connect. */

'use strict';

const Wallet = (() => {
  const providers = new Map();          // uuid -> { info, provider }
  const listeners = new Set();
  const state = { address: null, chainId: null, provider: null, info: null };
  const KEY = 'spout:wallet';

  const emit = () => listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });

  window.addEventListener('eip6963:announceProvider', (e) => {
    const d = e.detail;
    if (!d || !d.info || !d.provider || !d.info.uuid) return;
    providers.set(d.info.uuid, { info: d.info, provider: d.provider });
    emit();
  });
  const discover = () => window.dispatchEvent(new Event('eip6963:requestProvider'));

  /* A legacy window.ethereum that never announced itself still deserves a row. */
  function list() {
    const out = [...providers.values()];
    if (!out.length && window.ethereum) {
      const eth = window.ethereum;
      const name = eth.isRabby ? 'Rabby' : eth.isCoinbaseWallet ? 'Coinbase Wallet' : eth.isMetaMask ? 'MetaMask' : 'Browser wallet';
      out.push({ info: { uuid: 'legacy', name, icon: '', rdns: 'legacy' }, provider: eth });
    }
    return out;
  }

  function bind(p) {
    if (!p || !p.on) return;
    p.on('accountsChanged', (accs) => {
      if (state.provider !== p) return;
      if (!accs || !accs.length) return disconnect();
      state.address = accs[0]; emit();
    });
    p.on('chainChanged', (id) => {
      if (state.provider !== p) return;
      state.chainId = parseInt(id, 16); emit();
    });
    p.on('disconnect', () => { if (state.provider === p) disconnect(); });
  }

  async function connect(entry) {
    const p = entry.provider;
    const accs = await p.request({ method: 'eth_requestAccounts' });
    if (!accs || !accs.length) throw new Error('No account was shared.');
    let chain = null;
    try { chain = parseInt(await p.request({ method: 'eth_chainId' }), 16); } catch (e) { /* optional */ }
    if (state.provider !== p) bind(p);
    Object.assign(state, { address: accs[0], chainId: chain, provider: p, info: entry.info });
    try { if (Prefs.allowed()) localStorage.setItem(KEY, entry.info.rdns || entry.info.name); } catch (e) {}
    emit();
    return state;
  }

  function disconnect() {
    const p = state.provider;
    Object.assign(state, { address: null, chainId: null, provider: null, info: null });
    try { localStorage.removeItem(KEY); } catch (e) {}
    /* Some wallets support revoking the permission; ignore those that don't. */
    if (p && p.request) p.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] }).catch(() => {});
    emit();
  }

  /* Reconnect silently (eth_accounts never prompts) to the wallet used last time. */
  async function restore() {
    let want = null;
    try { want = localStorage.getItem(KEY); } catch (e) {}
    if (!want) return;
    await new Promise(r => setTimeout(r, 300));
    const entry = list().find(e => (e.info.rdns || e.info.name) === want);
    if (!entry) return;
    try {
      const accs = await entry.provider.request({ method: 'eth_accounts' });
      if (accs && accs.length) {
        let chain = null;
        try { chain = parseInt(await entry.provider.request({ method: 'eth_chainId' }), 16); } catch (e) {}
        bind(entry.provider);
        Object.assign(state, { address: accs[0], chainId: chain, provider: entry.provider, info: entry.info });
        emit();
      }
    } catch (e) { /* stay disconnected */ }
  }

  /* EIP-191 personal_sign of a plain-text message. Used to prove intent; it moves nothing. */
  async function signMessage(text) {
    if (!state.provider) throw new Error('Connect a wallet first.');
    const hex = '0x' + Array.from(new TextEncoder().encode(text), b => b.toString(16).padStart(2, '0')).join('');
    return state.provider.request({ method: 'personal_sign', params: [hex, state.address] });
  }

  async function balance() {
    if (!state.provider) return null;
    const wei = await state.provider.request({ method: 'eth_getBalance', params: [state.address, 'latest'] });
    return Number(BigInt(wei) * 10000n / 10n ** 18n) / 10000;
  }

  return { list, discover, connect, disconnect, restore, signMessage, balance, state,
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); } };
})();
