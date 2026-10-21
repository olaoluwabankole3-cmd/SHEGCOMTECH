# SHEGCOMTECH

A mobile-first storefront for technology retail, business equipment sourcing, and cyber-cafe print/digital services.

## Run locally

- Install Node.js 20 or newer.
- Run `npm install`.
- Run `npm run dev`.
- Create a production build with `npm run build` (output: `dist/`).

## Deploy to Cloudflare Pages

1. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
2. Select `olaoluwabankole3-cmd/SHEGCOMTECH` and the `main` branch.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Build output directory: `dist`.
6. Save and deploy. Future pushes to `main` will trigger builds.

## Before accepting real orders

This repository currently contains the responsive storefront and front-end interactions. Product prices and product examples are placeholders and must be confirmed/replaced with real inventory. The bag and quotation form are demonstrations, not a live checkout or order system. The print-request form currently selects files locally in the browser; it does **not** upload or transmit those files.

Before launch, connect a secure backend for quote/order delivery and private file intake (for example, a Cloudflare Worker with R2 storage and an email/notification workflow). Validate file types and sizes on the server, restrict access to uploaded files, define a retention/deletion policy, and never expose storage credentials in frontend code. Add verified business contact details, service terms, privacy notice, delivery/payment policies and product availability before publishing.

## Stack

- React + Vite
- Lucide icons
- Responsive CSS with reduced-motion support
