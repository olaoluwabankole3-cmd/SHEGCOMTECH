# SHEGCOMTECH

A mobile-first storefront for technology retail, business equipment sourcing, and cyber-cafe print/digital services.

## Run locally

- Install Node.js 20 or newer.
- Run `npm install`.
- Run `npm run dev`.
- Create a production build with `npm run build` (output: `dist/`).

The Cloudflare Pages Functions backend runs in Cloudflare's runtime. For local full-stack testing, use Wrangler Pages dev after installing Wrangler and configuring local bindings/secrets.

## Deploy to Cloudflare Pages

1. In Cloudflare, open **Workers & Pages** and select the SHEGCOMTECH Pages project.
2. Connect the `olaoluwabankole3-cmd/SHEGCOMTECH` repository and `main` branch after reviewing and merging the migration branch.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Build output directory: `dist`.
6. Pages Functions in `functions/` are deployed with the project.

## Cloudflare bindings and secrets

Configure these bindings in the Pages project's production environment:

- D1 binding: `SHEGCOMTECH_DB` → `shegcomtech-db`
- R2 binding: `PRODUCT_IMAGES` → `shegcomtech-product-images`

Configure these as **server-side secrets**, not `VITE_*` variables:

- `ADMIN_EMAIL` — the administrator email address.
- `ADMIN_PASSWORD` — a strong, unique admin password.

Do not put admin credentials in frontend variables, source code, or GitHub. After changing production bindings or secrets, trigger a new deployment.

## Product catalogue and admin

- Public storefront: `/`
- Admin interface: `/admin`
- Public catalogue endpoint: `GET /api/products`
- Admin catalogue endpoint: `GET /api/products?all=1` (requires a valid admin session)
- Admin login: `POST /api/auth/login`
- Admin session check/logout: `GET/DELETE /api/auth/session`
- Product create/update/delete: `POST /api/products`, `PATCH/DELETE /api/products/:id`
- Product image upload/delete: `POST /api/images/upload`, `POST /api/images/delete`

The API uses D1 for product records and admin sessions, and a private R2 bucket for product images. Images are served through a read-only Pages Function; the bucket itself does not need public write access. Admin sessions are stored as SHA-256 token hashes in D1 and delivered using an HttpOnly, Secure, SameSite cookie. Login attempts are rate-limited by client IP.

The D1 schema must contain `products`, `admin_sessions`, and `admin_login_attempts`. The `products` table should include the fields referenced by `functions/api/products.js`. Do not run the PostgreSQL schema in `supabase/schema.sql` against D1.

## Before accepting real orders

The bag and quotation form are currently front-end demonstrations, not a live checkout or order-processing system. Quote submissions do not reach SHEGCOMTECH yet. The print-request form selects files locally in the browser; it does not upload or transmit those files.

Before launch, connect a secure backend for quote/order delivery and private file intake (for example, a Cloudflare Worker with R2 storage and an email/notification workflow). Validate file types and sizes on the server, restrict access to uploaded files, define a retention/deletion policy, and never expose storage credentials in frontend code. Add verified business contact details, service terms, privacy notice, delivery/payment policies and confirmed product availability before publishing.

## Stack

- React + Vite
- Cloudflare Pages Functions
- Cloudflare D1
- Cloudflare R2
- Lucide icons
- Responsive CSS with reduced-motion support
