# Conduit

A static single-page site for a "point token creator fees at a website" launchpad.
No build step: plain HTML, CSS and JavaScript.

## Run locally

```sh
npx http-server -p 8080 .
# open http://localhost:8080
```

## What works

- **Wallet**: real EIP-6963 discovery of installed wallets, EIP-1193 connection, chain and balance readout, disconnect, and silent reconnect on return visits.
- **Signing**: launching a token and claiming a site each ask the wallet for a `personal_sign` message. Nothing is deployed and no funds move.
- **Routing**: hash routes for Home, Explore, Merchants, Payments, Analytics, Launch, Fee Flow, Docs, token pages (`#/token/<address>`) and site pages (`#/site/<domain>`).
- **Search**: `/` focuses search, arrow keys move through results, Enter opens the selected one.
- **Theme**: `D` toggles light/dark, and the site follows the OS theme until you choose.
- **Consent gate**: the "Remember my settings" choice persists theme, sidebar and wallet. "Just this visit" stores nothing long-term.

All tokens, websites and payments are fictional sample data (`data.js`).

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Shell, consent gate, wallet modal |
| `styles.css` | Design tokens, layout, components, animations |
| `data.js` | Sample data and icon paths |
| `views.js` | Page views |
| `wallet.js` | EIP-6963 / EIP-1193 wallet layer |
| `app.js` | Router, search, theme, sidebar, wallet UI |

## License

MIT. See [LICENSE](LICENSE).
