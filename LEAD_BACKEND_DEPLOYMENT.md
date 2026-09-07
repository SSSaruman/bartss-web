# BARTSS lead backend — deployment

This branch contains a shared-hosting/PHP lead flow.

## Server requirements
- PHP 8.0+
- writable `storage/` directory for the web-server user
- PHP `mail()` enabled if email notifications are required
- Apache-compatible `.htaccess` support to deny public access to `storage/`

## Required production environment variables
Set these in the hosting control panel/server configuration. Do **not** commit their values.

- `BARTSS_ADMIN_USER` — username for `/admin/leads.php`
- `BARTSS_ADMIN_PASSWORD` — long unique password for `/admin/leads.php`
- `BARTSS_LEAD_EMAIL` — notification recipient; defaults to `hello@bartss.com`
- `BARTSS_STORAGE_DIR` — recommended absolute path **outside public_html** for runtime lead data. If omitted, the protected repository `storage/` directory is used.

If the admin credentials are not set, the lead inbox intentionally returns HTTP 503 instead of becoming public.

## Flow
1. `index.html` project brief POSTs JSON to `/api/leads.php`.
2. Backend validates fields, honeypot, consent and rate limit.
3. Lead is appended to `storage/leads.jsonl` with a generated `BRT-YYYYMMDD-XXXXXX` ID.
4. Browser receives a per-lead update token and carries it only in sessionStorage.
5. `offers.html` updates scope against the same lead ID/token.
6. Final scope confirmation marks the lead `qualified`.
7. BARTSS reviews aggregated records at `/admin/leads.php`.

## Before launch
- Replace the placeholder legal-entity/contact wording in `privacy.html`.
- Prefer setting `BARTSS_STORAGE_DIR` to a writable directory outside the public web root.
- If the repository `storage/` fallback is used, verify it is writable and directly requesting `/storage/leads.jsonl` returns 403.
- Verify mail delivery or configure SMTP at hosting level.
- Set admin credentials.
- Run a real form submission and confirm it appears in the admin inbox.
