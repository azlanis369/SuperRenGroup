# Super Ren Group

Private real estate listing CRM + digital business card + shareable property
catalog + sales intelligence dashboard. Mobile-first, ringan, premium.

**Tagline:** _Manage listings. Share faster. Close smarter._

Built with Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn-style UI
· Supabase (Postgres + Auth + Storage) · Recharts · React Hook Form + Zod.

---

## Ciri (Phase 1)

- 🔐 Auth + peranan (Super Admin / Admin / Agent) dengan Row Level Security
- 👤 Onboarding & profil agent (kad bisnes digital + QR code)
- 🏠 Listing CRUD — borang multi-step (Project / Subsale / Rental)
- 🖼️ Muat naik media dengan mampatan imej client-side, susunan & hero
- 🌐 Halaman awam: katalog listing (Open Graph) + profil agent
- 💬 Kongsi WhatsApp / Telegram + jejak share
- 📊 Dashboard agent & admin + SWOT intelligence automatik
- 🧪 **Demo Mode** dengan seed data lengkap & imej placeholder SVG

---

## 🚀 Cara terpantas — Demo tanpa setup (zero-config)

Mahu lihat keseluruhan aplikasi serta-merta tanpa Supabase? Cukup:

```bash
npm install
npm run dev
```

Buka http://localhost:3000 → pilih persona (Admin / Super Admin / Agent) di skrin
log masuk. Bila **tiada** Supabase dikonfigurasi, aplikasi automatik berjalan
dalam **Local Demo Mode**: dataset penuh dalam-memori (8 agent, 45 listing,
130+ leads, 30+ deals, share, SWOT) — tiada pangkalan data, tiada auth backend
diperlukan. Dashboard, katalog awam, profil agent, analytics & SWOT semua hidup
dengan data contoh berlabel "DEMO".

> Local Demo menyimpan perubahan (cth. Add Listing) dalam memori untuk sesi
> pelayan semasa sahaja — restart untuk reset. Muat naik media dimatikan
> (tiada storage). Untuk produk penuh dengan data berkekalan, sediakan Supabase
> di bawah.

---

## Setup penuh (dengan Supabase)

### 1. Prasyarat

- Node.js 20+ (dibangunkan pada Node 22)
- Projek [Supabase](https://supabase.com)

### 2. Pemasangan

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local` dengan nilai dari Supabase (Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=listing-media
```

### 3. Pangkalan data

Jalankan migrasi SQL dalam Supabase SQL Editor (ikut urutan):

1. `supabase/migrations/0001_init.sql` — skema, enum, RLS, trigger
2. `supabase/migrations/0002_storage.sql` — bucket storage + polisi

### 4. Jana imej demo (SVG placeholder)

```bash
npm run demo:images
```

Menjana placeholder ke `public/demo/` (hartanah, avatar agent, OG fallback).
Semua imej adalah **dummy/sample sahaja** — bukan hartanah sebenar.

### 5. Seed data demo

```bash
npm run seed:demo     # seed data demo
npm run seed:reset    # clear + seed semula
npm run seed:clear    # clear data demo sahaja
```

Mencipta 10 akaun, 8 profil agent, 45 listing (15 setiap kategori), 130+ leads,
33 deals, ratusan share & media. Semua bertanda `is_demo = true`.

**Akaun demo** (kata laluan: `DemoPass123!`):

| Peranan      | Emel                        |
| ------------ | --------------------------- |
| Super Admin  | `superadmin@superren.demo`  |
| Admin        | `admin@superren.demo`       |
| Agent        | `aiman@superren.demo` … dll |

### 6. Jalankan

```bash
npm run dev
```

Buka http://localhost:3000

---

## Demo Mode

Apabila `NEXT_PUBLIC_DEMO_MODE=true`:

- Lencana **"Demo Mode — Sample Data Only"** dipaparkan di dashboard, admin,
  listing, dan halaman awam (untuk rekod demo).
- Akaun demo dipaparkan di halaman log masuk.
- Admin Panel menunjukkan kawalan **Clear Demo Data** (perlu taip `RESET DEMO`).

Set `NEXT_PUBLIC_DEMO_MODE=false` untuk production — lencana & kawalan demo
disembunyikan.

> ⚠️ Semua data demo adalah contoh/ujian sahaja dan dilabel dengan jelas.
> Tiada gambar hartanah sebenar digunakan — hanya placeholder SVG yang dijana.

---

## Skrip

| Skrip                 | Fungsi                               |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Server pembangunan                   |
| `npm run build`       | Build production                     |
| `npm run typecheck`   | Semak jenis TypeScript               |
| `npm run demo:images` | Jana imej placeholder SVG            |
| `npm run seed:demo`   | Seed data demo                       |
| `npm run seed:reset`  | Clear + seed semula                  |
| `npm run seed:clear`  | Clear data demo                      |

---

## Struktur

```
src/
  app/
    (app)/            # kawasan beraplikasi (auth + shell)
    agent/[slug]/     # profil agent awam (kad bisnes)
    listing/[slug]/   # katalog listing awam
    login/ onboarding/ forgot-password/ legal/
    api/public/       # endpoint awam (share, view tracking)
  components/         # UI primitives + komponen domain
  lib/
    actions/          # server actions
    data/             # lapisan capaian data (queries, stats, SWOT)
    supabase/         # klien browser/server/admin/middleware
    validations/      # skema Zod
scripts/
  generate-demo-images.mjs
  seed-demo.mjs + demo-data.mjs
supabase/migrations/  # skema SQL + storage
```

---

## Peranan & Kebenaran

- **Agent** — urus profil, listing, lead, deal sendiri sahaja.
- **Admin / Team Leader** — lihat & urus data kumpulan.
- **Super Admin** — akses penuh.
- **Public** — hanya lihat profil & listing awam; tiada data sensitif
  (lead/deal/pelanggan) didedahkan.

Dikuatkuasakan di lapisan pangkalan data melalui Row Level Security.
