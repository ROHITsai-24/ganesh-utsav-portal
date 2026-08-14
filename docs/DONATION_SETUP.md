# Donation Section — Setup Guide

Everything the Donation feature needs, in the order you should do it. Nothing
here is optional except where marked.

The flow is:

```
Hero Donation section (form)
        │
        ▼
POST /api/donations
        ├──► Supabase Storage  (Payment Screenshot, optional)
        ├──► Supabase table `donations`   ← source of truth, powers Admin panel + CSV
        └──► Google Apps Script Web App   ← appends a row to your Google Sheet
```

Supabase is the source of truth. If the Google Sheet sync fails, the donation is
still saved and the Admin panel flags the row with ⚠️.

---

## 1. Database table

Run this in the **Supabase dashboard → SQL Editor**:

```sql
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  -- 'already_paid' = Already Paid, 'planning_to_pay' = Planning to Pay
  status text not null check (status in ('already_paid', 'planning_to_pay')),
  name text not null,
  phone text not null,
  amount numeric(12, 2) not null check (amount > 0),
  -- Payment Date for Already Paid, Planned Payment Date for Planning to Pay
  payment_date date not null,
  -- Payment Screenshot; only ever set for Already Paid, and optional
  screenshot_url text,
  synced_to_sheet boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists donations_created_at_idx
  on public.donations (created_at desc);

-- All reads and writes go through the API routes using the service role key,
-- which bypasses RLS. Enabling RLS with no policies blocks direct access from
-- the browser using the anon key.
alter table public.donations enable row level security;
```

## 2. Storage bucket (for the Payment Screenshot)

**Supabase dashboard → Storage → New bucket**

| Setting | Value |
| --- | --- |
| Name | `donation-screenshots` |
| Public bucket | **Yes** (the Admin panel links directly to the image) |
| File size limit | 5 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |

Uploads happen server-side with the service role key, so no storage policies are
needed. If you would rather keep the bucket private, make it private and switch
`getPublicUrl` to `createSignedUrl` in
[src/app/api/donations/route.js](../src/app/api/donations/route.js).

## 3. Google Sheet + Apps Script Web App

1. Create a new Google Sheet. Name the first tab **`Donations`**.
2. **Extensions → Apps Script**, delete the placeholder code, and paste this:

```javascript
// Receives donations from the Ganesh Utsav portal and appends them as rows.
const SHEET_NAME = 'Donations';

// Must match GOOGLE_SHEETS_SHARED_SECRET in your .env.local / Vercel env.
// Leave as '' to accept any request (not recommended).
const SHARED_SECRET = 'change-me-to-a-long-random-string';

const HEADERS = [
  'Submitted At',
  'Donation Option',
  'Name',
  'Phone Number',
  'Amount',
  'Payment Date',
  'Payment Screenshot',
  'Record ID'
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (SHARED_SECRET && body.secret !== SHARED_SECRET) {
      return jsonResponse({ success: false, error: 'Unauthorized' });
    }

    const donation = body.donation;
    if (!donation) {
      return jsonResponse({ success: false, error: 'Missing donation payload' });
    }

    const sheet = getSheet();

    sheet.appendRow([
      donation.submittedAt,
      donation.donationOption,
      donation.name,
      donation.phone,
      donation.amount,
      donation.paymentDate,
      donation.screenshotUrl,
      donation.recordId
    ]);

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: String(error) });
  }
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  // Write the header row once, the first time a donation arrives.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Change `SHARED_SECRET` to a long random string and save.
4. **Deploy → New deployment → type: Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** ← required, otherwise Google returns a sign-in
     page instead of JSON and the sync fails
5. Copy the Web app URL (ends in `/exec`).

> Re-deploying after any script edit requires **Deploy → Manage deployments →
> Edit → New version**, otherwise the old code keeps running.

## 4. QR code and payment details

The Donation section tries three sources, in order:

1. **`public/donation-qr.png`** — preferred. Export the QR from GPay / PhonePe /
   Paytm / your bank app and save it at exactly that path. Guaranteed correct
   because your bank generated it.
2. **Generated** — if that file is missing and `NEXT_PUBLIC_DONATION_UPI_ID` is
   set, `/api/donation/qr` renders a UPI QR locally from your UPI ID. No
   external service, no cost.
3. **Neither** — the section shows the donation number and a "QR coming soon"
   message instead of a broken image.

## 5. Environment variables

Add to `.env.local` for local development, and to the Vercel project settings
for production:

```bash
# --- already used by the project ---
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAIL=you@example.com

# --- donation payment details (shown in the Hero Donation section) ---
NEXT_PUBLIC_DONATION_UPI_ID=yourname@okhdfcbank
NEXT_PUBLIC_DONATION_PAYEE_NAME=Unprofessional Players
NEXT_PUBLIC_DONATION_PHONE=+91 98765 43210

# --- Google Sheets sync ---
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/XXXX/exec
GOOGLE_SHEETS_SHARED_SECRET=the-same-long-random-string-as-the-script
```

`NEXT_PUBLIC_*` values are baked in at build time, so **redeploy after changing
them**.

## 6. Verify

1. `npm run dev`, open the home page, scroll to **Donation**.
2. Submit an **Already Paid** donation with a screenshot, and a **Planning to
   Pay** donation without one.
3. Check `/admin` → **Donations**: both rows appear, the screenshot link opens,
   and the Sheet column shows ✅.
4. Check the Google Sheet: both rows are there.
5. Click **Export CSV** and confirm the file downloads.

### If the Sheet column shows ⚠️

The donation saved fine, only the Sheet sync failed. Check the server logs for
`Google Sheet sync failed:` — the usual causes are:

| Message | Fix |
| --- | --- |
| `GOOGLE_SHEETS_WEBHOOK_URL is not configured` | Set the env var and redeploy |
| `non-JSON response` | Web App access is not set to **Anyone** |
| `Unauthorized` | `GOOGLE_SHEETS_SHARED_SECRET` does not match `SHARED_SECRET` |
| `did not respond within 10000ms` | Google was slow; export the CSV to reconcile |

There is no automatic retry — use **Export CSV** from the Admin panel to
reconcile any rows the Sheet missed.
