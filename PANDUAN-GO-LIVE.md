# 🚀 Panduan Go-Live — Super Ren Group (Demo → Data Sebenar)

Aplikasi kini **live dalam mod demo** di https://superren.group (data contoh dalam ingatan, tiada pangkalan data). Panduan ini menukar app ke **data sebenar** menggunakan **Supabase** (database + auth + storage).

> ⚠️ **Yang perlu anda buat sendiri**: cipta akaun Supabase, dapatkan kunci API, set env di Vercel, cipta akaun ejen. (Tidak boleh diautomasi sepenuhnya kerana melibatkan akaun & bayaran anda.) Anggaran masa: **~15–20 minit**.

---

## Ringkasan peranan
| Perkhidmatan | Peranan |
|---|---|
| **Vercel** | Hosting app (sudah siap) |
| **Supabase** | Database (PostgreSQL) + Auth (login) + Storage (gambar) |

Bila env Supabase di-set, app **auto-tukar** dari Demo → Data Sebenar (kod kesan ini sendiri: `LOCAL_DEMO = !HAS_SUPABASE`).

---

## Langkah 1 — Cipta projek Supabase
1. Pergi **supabase.com** → Sign up (boleh guna GitHub)
2. **New Project** → nama: `super-ren-group` → set **Database Password** (simpan!) → Region: **Singapore** (paling dekat Malaysia)
3. Tunggu projek siap (~2 minit)

## Langkah 2 — Jalankan skema (migrations)
Di Supabase → **SQL Editor** → **New query**, jalankan ikut turutan (salin kandungan fail dari repo `supabase/migrations/`):
1. `0001_init.sql` — jadual & enum utama
2. `0002_storage.sql` — bucket storage
3. `0003_deal_status_and_teams.sql` — status deal baharu + lajur pasukan

> Atau guna Supabase CLI: `supabase db push` (jika anda biasa CLI).

## Langkah 3 — Storage bucket
Supabase → **Storage** → pastikan bucket **`listing-media`** wujud (0002 sepatutnya cipta). Set **Public** supaya gambar boleh dipapar.

## Langkah 4 — Dapatkan kunci API
Supabase → **Project Settings → API**, salin:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** (RAHSIA!) → `SUPABASE_SERVICE_ROLE_KEY`

## Langkah 5 — Set Environment Variables di Vercel
Vercel → projek `super-ren-group` → **Settings → Environment Variables**, tambah:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...           (RAHSIA — Production sahaja)
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=listing-media
NEXT_PUBLIC_SITE_URL=https://superren.group   (sudah set)
```
Kemudian **Deployments → Redeploy** (buang "Use existing Build Cache").

✅ Selepas ini, app guna **data sebenar**. Skrin login akan minta **email + kata laluan sebenar** (bukan lagi pemilih persona demo).

## Langkah 6 — Cipta akaun & peranan
1. Supabase → **Authentication → Users → Add user** (cipta akaun untuk Azlan, Nasyriq, ejen)
2. Setiap pengguna baharu mula sebagai `agent` + `pending` (lihat `0001_init.sql` trigger). Untuk naikkan peranan, di **SQL Editor**:
   ```sql
   update public.users set role='super_admin', status='active' where email='azlan.ibnuzakaria@gmail.com';
   update public.users set role='admin',       status='active' where email='nasyriq@...';
   update public.users set status='active' where role='agent';
   ```
3. Log masuk di `https://superren.group/login` → lengkapkan **Profil** (onboarding) → nama, REN, agensi, telefon (untuk stamp kongsi)

## Langkah 7 — (Pilihan) Data permulaan
- Anda boleh mula kosong dan tambah listing sebenar melalui app, **atau**
- Seed data contoh: `npm run seed:demo` (perlu `.env.local` dengan kunci Supabase) — berguna untuk demo berterusan.

---

## 💰 Kos (ulasan)
| | Mula (pilot) | Production komersial |
|---|---|---|
| Vercel | Hobby (percuma)* | **Pro** ~USD20/bln |
| Supabase | Free | **Pro** ~USD25/bln |
| Domain | superren.group (sudah beli) | renew ~USD22/thn |

\*Hobby = bukan komersial (ToS). Untuk guna perniagaan sebenar → Vercel **Pro**.

---

## ✅ Kesediaan ciri pada data sebenar
**Berfungsi terus** selepas Supabase disambung:
- Auth/login, profil ejen, onboarding
- Listing (CRUD), katalog awam, kad nama digital + QR
- Leads, **Tawaran** (board LMS + filter), follow-up WhatsApp/SMS/Call
- Stamp kongsi, dashboard & analytics peribadi
- **Leaderboard Top-10** (per sektor + MoM) — ada laluan Supabase

**Perlu kerja tambahan (Fasa 2)** untuk data sebenar:
- **Team Leader / Perbandingan Pasukan** — query masih mod demo sahaja. Lajur `team_leader_id` sudah disediakan (migration 0003); tinggal implement query Supabase untuk `getTeamOverview` / `getGroupTeams` / `isTeamLeader`. *(Boleh saya siapkan dalam sesi seterusnya.)*
- Deep-link persona `/enter/...` & pemilih persona = **demo sahaja** (tiada makna bila auth sebenar aktif).

---

## 🔄 Nak kembali ke mod demo?
Padam/keluarkan env `NEXT_PUBLIC_SUPABASE_*` di Vercel → redeploy. App auto-kembali ke mod demo.

---

Bila anda sedia, beritahu saya — saya boleh pandu setiap langkah ini secara langsung (guna telefon), dan siapkan **query Supabase untuk Team Leader** (Fasa 2).
