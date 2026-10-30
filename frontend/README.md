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

Route analysis uses mock route data, simulated fee estimates, and simulated transfer lifecycles. The Sepolia label is demo context only; simulated transfers do not connect to Sepolia or create blockchain transactions. The simulator works without a wallet, RPC credentials, or a deployed contract.

## RouteGuard Assessment Contract

The Overview page reads assessment ID `1` and `nextAssessmentId` from the deployed RouteGuard contract on MST Coral using the public Coral RPC. This panel is read-only and does not require a wallet connection.

The panel also checks MetaMask's current chain ID without requesting accounts or changing networks. MetaMask must already be on chain ID `54635` for the network status to show as connected. The assessment stores a report hash, not the full report.

The Route Analysis page's separate optional write action still requires `VITE_ROUTEGUARD_CONTRACT_ADDRESS` and explicit wallet transaction approval. It is not used by the Overview read panel. Do not put private keys, seed phrases, RPC credentials, or other secrets in `VITE_*` variables: Vite exposes those values in the browser bundle.
