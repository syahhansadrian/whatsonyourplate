# DESIGN.md: What's on Your Plate

Arah desain resmi proyek ini. Ditranskrip dari jawaban pemilik proyek.

## Identitas

- Produk: "What's on Your Plate", aplikasi web untuk memilih makanan berdua dengan kekasih, terdiri dari halaman admin dan halaman presentasi.
- Konsep: **gamifikasi memilih menu** — aplikasi untuk pasangan/teman yang bingung makan apa, di mana proses memilihnya yang dirayakan, bukan sekadar fungsionalitas. Layar dipenuhi foto makanan, pilihan diklik "di atas piring", dan piring akhir adalah hadiahnya.
- Landing: cukup judul "What's on Your Plate" + tombol Mulai. Tanpa deskripsi apapun (permintaan pemilik proyek).
- Urutan pilihan dipaksa mengikuti susunan admin; pemain tidak bisa melompat.
- Musik latar: loop original 20 detik (dibuat sendiri untuk proyek ini), boleh diganti pemilik proyek dengan file yang sama namanya.
- Kepribadian: playful & romantis. Hangat, ceria, sedikit flirty.
- Suara teks: Bahasa Indonesia, akrab dan menggoda ringan ("Serahkan pilihan pada piring."), tanpa jargon korporat.

## Palet warna

| Warna | Hex | Pemakaian |
|---|---|---|
| Krem | `#FFF7F0` | latar utama semua halaman |
| Putih kartu | `#FFFFFF` | kartu, dialog, form |
| Blush pink | `#F6C9CE` | dekor: piring, chip, lapisan lembut (jangan dipakai untuk teks) |
| Blush tua | `#EFAEB6` | garis dekor, state hover blush |
| Ink cokelat | `#3A2A2A` | semua teks utama (kontras AA di krem) |
| Raspberry | `#C13B52` | aksen utama: tombol CTA, fokus, penanda terpilih (putih di atas raspberry lolos AA) |

Alasan pemilihan: krem + blush pink diminta pemilik proyek sebagai nuansa romantis; raspberry dibutuhkan sebagai satu aksen gelap agar tombol dan teks di atas blush tetap kontras (R-25).

Warna fungsional (bukan bagian palet dekor): merah muda pucat `#fdecec` + raspberry tua `#a32f43` untuk pesan error, ditetapkan agar pesan error tetap terbaca dan terasa satu keluarga dengan raspberry.

Tema terang saja, tanpa toggle gelap: palet krem + blush adalah identitas yang dipilih sendiri dan tidak bisa diinvert ke gelap tanpa merusaknya (alasan tetap tema terang, R-21/R-31).

## Tipografi

- Judul: **Fraunces** (serif chunky, axes SOFT/WONK, bobot 700-900). Alasan: diminta pemilik proyek "serif chunky/playful"; Fraunces punya bobot gemuk dan wajah aneh-manis yang cocok untuk karakter romantis-playful, bukan serif generik bawaan AI.
- Teks isi & UI: **Nunito** (sans membulat, ramah). Alasan: pasangan yang lembut untuk Fraunces, tetap terbaca kecil di layar ponsel.
- Hierarki: satu judul layar besar per layar (fokus tunggal), sisanya menurun tegas.

## Dial (ENERGY / RHYTHM / MOTION)

- **ENERGY 3**: halaman pembuka dan layar hasil berani besar dan ekspresif; ini aplikasi kencan, bukan dasbor.
- **RHYTHM 3**: komposisi tiap layar sengaja berbeda (landings berpusat, layar pilih kartu bertumpuk, layar hasil satu fokus besar, layar piring komposisi melingkar) supaya presentasi tidak monoton.
- **MOTION 3**: gerak berani & meriah. Transisi antar tahap pilihan, dan layar piring akhir dirayakan dengan munculnya makanan berurutan + konfeti CSS. Alasan: momen "ternyata pilihanmu" adalah puncak pengalaman.

## Motif identitas

- **Piring bundar**: setiap foto makanan selalu bulat seperti piring; layar akhir berupa piring besar berisi bulatan-bulatan makanan. Bulatan diulang di chip, avatar emoji placeholder, dan titik progres. Admin bisa mengunggah foto piring sendiri; foto itu menjadi panggung tiap layar pilihan (fallback: cincin piring motif), dan jadi alas piring akhir.

## Yang dihindari

- Tidak ada gradien ungu-biru, glassmorphism tebal, glow, atau grid latar.
- Tidak ada ikon generik (sparkle/bolt) sebagai hiasan; ikon/emoji hanya jika mewakili konten makanan itu sendiri.
- Tidak ada foto makanan palsu: tanpa gambar, tampilkan placeholder bulat dengan emoji makanan dan nama menu (placeholder jujur).
