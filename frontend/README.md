# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Local Development

```sh
npm install
npm run dev
npm run build
npm test
```

The simulator works without a wallet, RPC credentials, or a deployed contract. It remains a local demo and does not send bridge transactions.

## Optional RouteGuard Assessment Contract

The Route Analysis page can optionally submit the selected route's assessment to the `RouteGuard` contract. The control is shown only when `VITE_ROUTEGUARD_CONTRACT_ADDRESS` is set to a valid contract address. If it is unset, the regular simulation UI continues to work as before.

The current Hardhat configuration targets MST Coral (chain ID `54635`). The connected wallet must already be on that network; the frontend deliberately does not switch networks automatically. Submitting an assessment opens the wallet for explicit transaction approval and consumes the wallet's network fee token. The assessment stores a hash of the report content, not the full report.

Set the address locally in a frontend `.env.local` file after a trusted deployment has been completed and verified. Do not put private keys, seed phrases, RPC credentials, or other secrets in `VITE_*` variables: Vite exposes those values in the browser bundle. No contract address is currently included in this repository.
