# What's on Your Plate

Aplikasi web untuk memilih makanan berdua: halaman **admin** mengatur kategori dan pilihan, halaman **show** memandu presentasi sampai menampilkan piring berisi semua pilihan.

## Isi proyek

| File | Fungsi |
|---|---|
| `index.html` | Halaman presentasi (show) |
| `admin.html` | Halaman admin (login email + password) |
| `DESIGN.md` | Arah desain resmi (palet, huruf, dial) |
| `supabase/schema.sql` | Tabel, keamanan (RLS), storage, data contoh |
| `js/config.js` | Isi dengan kunci Supabase Anda |
| `js/logic.js` | Alur pilihan (murni, ada unit test di `test/`) |
| `js/store.js` | Koneksi Supabase (data, login, gambar) |
| `js/show.js` | Render halaman presentasi |
| `js/admin.js` | Render halaman admin |

## 1. Siapkan Supabase (gratis)

1. Daftar di [supabase.com](https://supabase.com), buat project baru.
2. Buka **SQL Editor**, tempel seluruh isi `supabase/schema.sql`, klik **Run**. Ini membuat tabel, aturan keamanan, bucket gambar, plus data contoh (Main Theme, Dessert, Snack).
3. Agar bisa langsung mendaftar tanpa cek email: buka **Authentication → Sign In / Providers → Email**, matikan **Confirm email**, simpan.
4. Buka **Project Settings → API**, salin **Project URL** dan **anon public** key.
5. Isi `js/config.js`:

```js
window.WOYP_CONFIG = {
  SUPABASE_URL: "https://xxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi...",
  SUPABASE_BUCKET: "food-images"
};
```

Anon key aman disimpan di kode selama aturan RLS (langkah 2) aktif: publik hanya bisa membaca, hanya admin login yang bisa menulis.

## 2. Jalankan lokal

Buka lewat Laragon, misalnya:

```
http://localhost/Whats%20On%20Your%20Plate/
```

- `admin.html`: klik **Daftar dulu**, buat akun (email + password), otomatis masuk.
- `index.html`: halaman presentasi, tidak butuh login.

## 3. Cara pakai admin

- **+ Tambah kategori**: nama + deskripsi opsional (misal Main Theme, Dessert, Snack). Tombol panah mengatur urutan.
- **Buka pilihan**: menambah pohon pilihan dalam kategori.
- **+ Tambah pilihan utama** lalu **+ Anak** untuk pilihan berjenjang (misal Ayam → Ayam Bumbu Hitam). Tanpa anak = pilihan akhir, halaman show langsung menampilkan "Selamat, kamu akan makan ...".
- **Gambar**: pilih file dari komputer (diunggah ke Supabase) atau tempel URL. Kosongkan keduanya untuk placeholder otomatis.
- **Ekspor/Impor JSON**: cadangan data.

## 4. Deploy ke Vercel (gratis)

Cara termudah (lewat GitHub):

```bash
git init
git add .
git commit -m "What's on Your Plate"
```

Buat repo baru di [github.com](https://github.com), lalu `git remote add origin <url-repo>` dan `git push -u origin main`.

Di [vercel.com](https://vercel.com): **Add New → Project** → pilih repo ini → Framework: **Other** → Deploy. Selesai, dapat alamat `namamu.vercel.app`.

Alternatif tanpa GitHub: `npx vercel` di folder proyek, ikuti petunjuknya.

**Catatan:**

- Alamat gratis selalu subdomain (`*.vercel.app`). Domain sendiri dibeli terpisah, lalu disambungkan di Vercel → Project → Settings → Domains.
- Setelah deploy, isi ulang `js/config.js` kalau kunci Supabase-nya berubah, lalu commit + push supaya ikut ter-deploy.
- Proyek Supabase gratis otomatis dijeda setelah 1 minggu tidak ada akses. Kalau datang tiba-tiba kosong/timeout, buka dashboard Supabase → **Restore project** (gratis).

## 5. Keamanan

- Halaman admin dilindungi login Supabase Auth; tanpa login, data tidak bisa diubah lewat API mana pun.
- Halaman show hanya membaca data (aturan RLS).
- `admin.html` diberi `noindex` supaya tidak diindeks mesin pencari.
- Setelah akun admin dibuat, pertimbangkan menyalakan kembali **Confirm email** di Supabase.
