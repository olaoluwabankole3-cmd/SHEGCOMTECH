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

## Catalogue management

The storefront reads products from `public/catalog.json` at runtime. Product listings are not embedded in the React page. The file starts empty intentionally; add confirmed inventory before publishing so visitors never mistake sample products or made-up prices for stock SHEGCOMTECH actually sells.

Each catalogue entry supports the following fields:

```json
{
  "id": "unique-product-id",
  "name": "Exact product name or model",
  "category": "Laptops",
  "description": "Short factual description",
  "brand": "Manufacturer",
  "priceNgn": 485000,
  "imageUrl": "https://example.com/your-product-image.jpg",
  "tag": "NEW",
  "tone": "neutral"
}
```

Only `id`, `name`, and `category` are required. Use a numeric `priceNgn` only when the price is current and approved; omit it or set it to `null` to display “Price on request.” `imageUrl` should point to an image SHEGCOMTECH has permission to use. Category names should match the categories shown in the storefront. Edit the JSON and push the change to GitHub to update the catalogue; the application loads it separately from its layout code.

## Before accepting real orders

The bag and quotation form are currently front-end demonstrations, not a live checkout or order-processing system. Quote submissions do not reach SHEGCOMTECH yet. The print-request form selects files locally in the browser; it does **not** upload or transmit those files.

Before launch, connect a secure backend for quote/order delivery and private file intake (for example, a Cloudflare Worker with R2 storage and an email/notification workflow). Validate file types and sizes on the server, restrict access to uploaded files, define a retention/deletion policy, and never expose storage credentials in frontend code. Add verified business contact details, service terms, privacy notice, delivery/payment policies and confirmed product availability before publishing.

## Stack

- React + Vite
- Lucide icons
- Responsive CSS with reduced-motion support
