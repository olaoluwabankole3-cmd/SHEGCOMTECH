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

## Product catalogue and admin

The public storefront reads published products from Supabase when its public project URL and publishable key are configured. A separate admin interface is available at `/admin` (or `/admin.html`). It supports staff sign-in, product images, product details, prices, comparison prices, SKU, stock quantity, category, featured status, and publishing/unpublishing listings.

### Connect the backend

1. Create or select a Supabase project.
2. Open the Supabase SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql) in full. This creates the product and admin tables, row-level security policies, and the public product-image bucket.
3. In **Authentication → Users**, create the admin user with the email address that should manage the store. Disable public sign-ups if they are enabled.
4. Copy that user's UUID from Authentication → Users. Run the following in the SQL Editor, replacing the example UUID with the admin user's actual UUID:

   ```sql
   insert into public.admin_users (user_id)
   values ('00000000-0000-0000-0000-000000000000');
   ```

   This allowlist is deliberate: creating an Auth user alone does not grant admin access.
5. Copy the Supabase project URL and its **publishable key** (or legacy anon key). Add these environment variables in **Cloudflare Pages → Settings → Variables and Secrets**, for the production environment and preview if needed:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

   Then trigger a fresh deployment. These are browser-side public values; **never** put a Supabase `service_role` or secret key in the frontend.
6. Visit `/admin`, sign in with the admin user's credentials, and add the confirmed catalogue items. Published active products appear on the public storefront; drafts remain hidden.

The admin app denies access unless the signed-in user is in `public.admin_users`. Database row-level security enforces the same permission boundary on product changes and image uploads. Keep admin accounts limited to trusted staff.

### Product image guidance

The `product-images` Supabase Storage bucket is public for storefront display, but uploads, updates, and deletions are restricted by policies to allowlisted admins. The UI validates image type and a 5 MB maximum; the bucket also applies its own allowed-type and file-size restrictions.

## Before accepting real orders

The bag and quotation form are currently front-end demonstrations, not a live checkout or order-processing system. Quote submissions do not reach SHEGCOMTECH yet. The print-request form selects files locally in the browser; it does **not** upload or transmit those files.

Before launch, connect a secure backend for quote/order delivery and private file intake (for example, a Cloudflare Worker with R2 storage and an email/notification workflow). Validate file types and sizes on the server, restrict access to uploaded files, define a retention/deletion policy, and never expose storage credentials in frontend code. Add verified business contact details, service terms, privacy notice, delivery/payment policies and confirmed product availability before publishing.

## Stack

- React + Vite
- Lucide icons
- Responsive CSS with reduced-motion support
