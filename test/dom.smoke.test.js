const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const baca = (f) => fs.readFileSync(path.join(root, f), "utf8");

const seed = {
  categories: [
    { id: "cat-main", name: "Main Theme", description: "Inti makanan.", sort_order: 1 },
    { id: "cat-dessert", name: "Dessert", description: "Manis.", sort_order: 2 },
    { id: "cat-kosong", name: "Belum Diisi", description: "", sort_order: 3 },
    { id: "cat-snack", name: "Snack", description: "", sort_order: 4 }
  ],
  items: [
    { id: "n-mie", category_id: "cat-main", parent_id: null, name: "Mie", description: "Hangat.", image_url: "", sort_order: 1 },
    { id: "n-ayam", category_id: "cat-main", parent_id: null, name: "Ayam", description: "Pilih bumbu.", image_url: "", sort_order: 2 },
    { id: "n-ayam-hitam", category_id: "cat-main", parent_id: "n-ayam", name: "Ayam Bumbu Hitam", description: "Manis gurih.", image_url: "https://contoh.test/hitam.png", sort_order: 1 },
    { id: "n-ayam-bakar", category_id: "cat-main", parent_id: "n-ayam", name: "Ayam Bakar Madu", description: "", image_url: "", sort_order: 2 },
    { id: "n-eskrim", category_id: "cat-dessert", parent_id: null, name: "Es Krim", description: "", image_url: "", sort_order: 1 },
    { id: "n-popcorn", category_id: "cat-snack", parent_id: null, name: "Popcorn", description: "", image_url: "", sort_order: 1 }
  ]
};

const tunggu = (ms = 25) => new Promise((r) => setTimeout(r, ms));

function klik(w, el) {
  assert.ok(el, "elemen yang diklik harus ada");
  el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
}

function buatDom(file) {
  return new JSDOM(baca(file), {
    url: "http://localhost/woyp/",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
}

async function ujiShow() {
  const dom = buatDom("index.html");
  const w = dom.window;
  w.eval(baca("js/logic.js"));
  w.eval('window.WOYP_CONFIG = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "kunci", SUPABASE_BUCKET: "food-images" };');
  w.eval(baca("js/store.js"));
  w.eval("window.WOYPStore.isConfigured = function(){ return true; }; window.WOYPStore.fetchAll = function(){ return Promise.resolve({ ok: true, data: window.__seed }); };");
  w.__seed = seed;
  w.eval(baca("js/show.js"));
  await tunggu();

  const d = w.document;
  assert.ok(d.querySelector(".layar-landing"), "show: layar landing tampil");
  assert.ok(d.querySelector(".judul-besar").textContent.includes("What's on"), "show: judul What's on Your Plate");
  assert.ok(!d.querySelector(".layar-landing .sub"), "show: landing tanpa deskripsi");
  assert.ok(!d.querySelector(".layar-landing .sapaan"), "show: landing tanpa sapaan");
  assert.ok(d.querySelector('[data-act="mulai"]').textContent.trim() === "Mulai", "show: tombol landing hanya 'Mulai'");
  assert.strictEqual(d.getElementById("tombolKembali").hidden, true, "show: tombol kembali tersembunyi di landing");

  const tombolMusik = d.getElementById("tombolMusik");
  assert.ok(tombolMusik, "show: tombol musik ada");
  assert.strictEqual(tombolMusik.getAttribute("aria-pressed"), "true", "show: musik bawaan nyala");
  klik(w, tombolMusik);
  await tunggu();
  assert.ok(tombolMusik.textContent.includes("mati"), "show: klik mematikan musik");
  assert.strictEqual(tombolMusik.getAttribute("aria-pressed"), "false", "show: aria-pressed musik mati");
  assert.strictEqual(w.localStorage.getItem("woyp-musik"), "mati", "show: preferensi musik tersimpan");
  klik(w, tombolMusik);
  await tunggu();
  assert.ok(tombolMusik.textContent.includes("nyala"), "show: klik menyalakan musik lagi");

  klik(w, d.querySelector('[data-act="mulai"]'));
  await tunggu();
  assert.strictEqual(d.querySelectorAll(".kartu-kategori").length, 3, "show: kategori kosong dilewati, tersisa 3");
  assert.ok(d.querySelector(".layar-kategori"), "show: layar kategori tampil");
  assert.ok(d.querySelector(".panggung .panggung-piring"), "show: panggung piring ada di layar kategori");
  assert.ok(d.getElementById("tahap").textContent.includes("0 dari 3"), "show: progres 0 dari 3");

  klik(w, d.querySelector('[data-act="pilih-kategori"][data-id="cat-main"]'));
  await tunggu();
  assert.ok(d.querySelector(".judul-layar").textContent === "Main Theme", "show: judul kategori");
  assert.ok(d.querySelector(".kotak-desc").textContent.includes("Inti makanan."), "show: deskripsi kategori tampil");
  assert.strictEqual(d.querySelectorAll(".kartu-pilihan").length, 2, "show: dua pilihan akar (Mie, Ayam)");
  assert.ok(d.querySelector(".panggung-pilihan .kartu-pilihan .bulatan"), "show: bulatan makanan di atas piring");
  assert.ok(d.querySelector(".panggung .piring-lingkar"), "show: fallback cincin piring di panggung");

  klik(w, d.querySelector('[data-act="pilih-node"][data-id="n-ayam"]'));
  await tunggu();
  assert.ok(d.querySelector(".judul-layar").textContent === "Ayam", "show: masuk ke layar Ayam");
  assert.ok(d.querySelector(".kotak-desc").textContent.includes("Pilih bumbu."), "show: deskripsi Ayam tampil");
  assert.strictEqual(d.querySelectorAll(".kartu-pilihan").length, 2, "show: dua anak Ayam tampil");

  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await tunggu();
  assert.ok(d.querySelector(".judul-layar").textContent === "Main Theme", "show: Escape kembali satu tingkat");

  klik(w, d.querySelector('[data-act="pilih-node"][data-id="n-ayam"]'));
  await tunggu();
  klik(w, d.querySelector('[data-act="pilih-node"][data-id="n-ayam-hitam"]'));
  await tunggu();
  assert.ok(d.querySelector(".layar-hasil"), "show: layar hasil tampil");
  assert.ok(d.querySelector(".kabar").textContent.includes("Selamat"), "show: kabar Selamat");
  assert.ok(d.querySelector(".nama-hasil").textContent === "Ayam Bumbu Hitam", "show: nama hasil sesuai");
  assert.ok(d.querySelector(".hasil-bulatan img").src.includes("hitam.png"), "show: gambar hasil tampil");
  assert.ok(d.querySelector(".kat-hasil").textContent.includes("Main Theme"), "show: sumber kategori hasil");

  klik(w, d.querySelector('[data-act="lanjut"]'));
  await tunggu();
  assert.ok(d.querySelector(".kat-status") && d.querySelector(".kat-status").textContent.includes("Ayam Bumbu Hitam"), "show: status selesai di kategori");
  const cta1 = d.querySelector('[data-act="lanjut-berikut"]');
  assert.ok(cta1.textContent.includes("Dessert"), "show: CTA lanjut ke Dessert");

  klik(w, cta1);
  await tunggu();
  assert.ok(d.querySelector(".judul-layar").textContent === "Dessert", "show: layar Dessert");
  klik(w, d.querySelector('[data-act="pilih-node"][data-id="n-eskrim"]'));
  await tunggu();
  klik(w, d.querySelector('[data-act="lanjut"]'));
  await tunggu();
  const cta2 = d.querySelector('[data-act="lanjut-berikut"]');
  assert.ok(cta2.textContent.includes("Snack"), "show: CTA lanjut ke Snack");

  klik(w, cta2);
  await tunggu();
  klik(w, d.querySelector('[data-act="pilih-node"][data-id="n-popcorn"]'));
  await tunggu();
  klik(w, d.querySelector('[data-act="lanjut"]'));
  await tunggu();

  assert.ok(d.querySelector(".layar-piring"), "show: layar piring akhir tampil");
  assert.strictEqual(d.querySelectorAll(".makanan-di-piring").length, 3, "show: tiga makanan di piring");
  assert.strictEqual(d.querySelectorAll(".daftar-hasil li").length, 3, "show: daftar hasil lengkap");
  assert.ok(d.querySelector('[role="img"]').getAttribute("aria-label").includes("Ayam Bumbu Hitam"), "show: aria-label piring menyebut pilihan");
  assert.strictEqual(d.querySelectorAll(".konfeti").length, 16, "show: konfeti perayaan ada");
  assert.ok(d.getElementById("tahap").textContent.includes("siap"), "show: header piring siap");

  klik(w, d.querySelector('[data-act="ulang"]'));
  await tunggu();
  assert.ok(d.querySelector(".layar-landing"), "show: Mulai lagi kembali ke landing");

  klik(w, d.querySelector('[data-act="mulai"]'));
  await tunggu();
  klik(w, d.getElementById("tombolKembali"));
  await tunggu();
  assert.ok(d.querySelector(".layar-landing"), "show: tombol Kembali dari kategori ke landing");

  dom.window.close();
  console.log("TES SHOW: lulus");
}

async function ujiShowFotoPiring() {
  const dom = buatDom("index.html");
  const w = dom.window;
  w.eval(baca("js/logic.js"));
  w.eval('window.WOYP_CONFIG = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "kunci", SUPABASE_BUCKET: "food-images" };');
  w.eval(baca("js/store.js"));
  const seedPiring = JSON.parse(JSON.stringify(seed));
  seedPiring.settings = { plate_image_url: "https://contoh.test/piring.png" };
  w.__seedPiring = seedPiring;
  w.eval("window.WOYPStore.isConfigured = function(){ return true; }; window.WOYPStore.fetchAll = function(){ return Promise.resolve({ ok: true, data: window.__seedPiring }); };");
  w.eval(baca("js/show.js"));
  await tunggu();
  const d = w.document;

  klik(w, d.querySelector('[data-act="mulai"]'));
  await tunggu();
  const foto = d.querySelector(".panggung-piring .piring-foto");
  assert.ok(foto, "show: foto piring tampil di panggung kategori");
  assert.strictEqual(foto.getAttribute("src"), "https://contoh.test/piring.png", "show: src foto piring benar");

  klik(w, d.querySelector('[data-act="pilih-kategori"][data-id="cat-dessert"]'));
  await tunggu();
  assert.ok(d.querySelector(".panggung-piring .piring-foto"), "show: foto piring juga di layar pilihan");
  klik(w, d.querySelector('[data-act="pilih-node"][data-id="n-eskrim"]'));
  await tunggu();
  assert.ok(d.querySelector(".panggung-piring .piring-foto"), "show: foto piring juga di layar hasil");

  klik(w, d.querySelector('[data-act="lanjut"]'));
  await tunggu();
  klik(w, d.querySelector('[data-act="piring"]'));
  await tunggu();
  const besar = d.querySelector(".piring-besar");
  assert.ok(besar.classList.contains("dengan-foto"), "show: piring akhir memakai foto piring admin");
  assert.ok(besar.getAttribute("style").includes("https://contoh.test/piring.png"), "show: background piring akhir = foto piring");

  dom.window.close();
  console.log("TES SHOW (foto piring): lulus");
}

async function ujiShowTanpaData() {
  const dom = buatDom("index.html");
  const w = dom.window;
  w.eval(baca("js/logic.js"));
  w.eval('window.WOYP_CONFIG = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "kunci", SUPABASE_BUCKET: "food-images" };');
  w.eval(baca("js/store.js"));
  w.eval("window.WOYPStore.isConfigured = function(){ return true; }; window.WOYPStore.fetchAll = function(){ return Promise.resolve({ ok: true, data: { categories: [], items: [] } }); };");
  w.eval(baca("js/show.js"));
  await tunggu();
  const d = w.document;
  klik(w, d.querySelector('[data-act="mulai"]'));
  await tunggu();
  assert.ok(d.querySelector(".kosong").textContent.includes("Belum ada pilihan"), "show: empty state saat data kosong");
  assert.ok(d.querySelector('a[href="admin.html"]'), "show: empty state mengarah ke admin");
  dom.window.close();
  console.log("TES SHOW (data kosong): lulus");
}

async function ujiShowSetup() {
  const dom = buatDom("index.html");
  const w = dom.window;
  w.eval(baca("js/logic.js"));
  w.eval('window.WOYP_CONFIG = { SUPABASE_URL: "", SUPABASE_ANON_KEY: "", SUPABASE_BUCKET: "food-images" };');
  w.eval(baca("js/store.js"));
  w.eval(baca("js/show.js"));
  await tunggu();
  const d = w.document;
  assert.ok(d.querySelector(".pemberitahuan").textContent.includes("Setelan belum lengkap"), "show: state setup saat config kosong");
  assert.ok(d.querySelector('a[href="admin.html"]'), "show: setup menunjuk halaman admin");
  dom.window.close();
  console.log("TES SHOW (setup): lulus");
}

async function ujiShowGagalMuat() {
  const dom = buatDom("index.html");
  const w = dom.window;
  w.eval(baca("js/logic.js"));
  w.eval('window.WOYP_CONFIG = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "kunci", SUPABASE_BUCKET: "food-images" };');
  w.eval(baca("js/store.js"));
  w.eval(baca("js/show.js"));
  await tunggu();
  const d = w.document;
  assert.ok(d.querySelector(".kosong").textContent.includes("Menu belum bisa dimuat"), "show: error state saat pustaka/gagal muat");
  assert.ok(d.querySelector('[data-act="coba-lagi"]'), "show: tombol coba lagi tersedia");
  klik(w, d.querySelector('[data-act="coba-lagi"]'));
  await tunggu();
  assert.ok(d.querySelector(".kosong").textContent.includes("Menu belum bisa dimuat"), "show: coba lagi mencoba ulang");
  dom.window.close();
  console.log("TES SHOW (gagal muat): lulus");
}

async function ujiAdminSetup() {
  const dom = buatDom("admin.html");
  const w = dom.window;
  w.eval('window.WOYP_CONFIG = { SUPABASE_URL: "", SUPABASE_ANON_KEY: "", SUPABASE_BUCKET: "food-images" };');
  w.eval(baca("js/store.js"));
  w.eval(baca("js/admin.js"));
  await tunggu();
  const d = w.document;
  assert.strictEqual(d.getElementById("areaSetup").hidden, false, "admin: area setup tampil saat config kosong");
  assert.strictEqual(d.getElementById("areaLogin").hidden, true, "admin: login tersembunyi saat config kosong");
  dom.window.close();
  console.log("TES ADMIN (setup): lulus");
}

function stubAdmin(w) {
  const state = JSON.parse(JSON.stringify(seed));
  w.__state = state;
  w.WOYPStore.getSession = async function () { return { ok: true, data: { user: { email: "admin@contoh.com" } } }; };
  w.WOYPStore.fetchAll = async function () { return { ok: true, data: JSON.parse(JSON.stringify(state)) }; };
  w.WOYPStore.signUp = async function () { return { ok: true, data: null, message: "Akun dibuat." }; };
  w.WOYPStore.signIn = async function () { return { ok: true, data: { user: { email: "admin@contoh.com" } } }; };
  w.WOYPStore.signOut = async function () { return { ok: true, data: null }; };
  w.WOYPStore.createCategory = async function (i) {
    const row = Object.assign({ id: "cat-baru", sort_order: 99 }, i);
    state.categories.push(row);
    return { ok: true, data: row };
  };
  w.WOYPStore.updateCategory = async function () { return { ok: true, data: {} }; };
  w.WOYPStore.deleteCategory = async function () { return { ok: true, data: null }; };
  w.WOYPStore.createItem = async function (i) {
    const row = Object.assign({ id: "n-baru", sort_order: 99 }, i);
    state.items.push(row);
    return { ok: true, data: row };
  };
  w.WOYPStore.updateItem = async function () { return { ok: true, data: {} }; };
  w.WOYPStore.deleteItem = async function () { return { ok: true, data: null }; };
  w.WOYPStore.moveSibling = async function (table, ids, index, dir) {
    const arr = table === "categories" ? state.categories : state.items;
    const target = index + dir;
    if (index < 0 || target < 0 || target >= ids.length) return { ok: true, data: null };
    const a = arr.find((x) => x.id === ids[index]);
    const b = arr.find((x) => x.id === ids[target]);
    if (a && b) {
      const ao = a.sort_order;
      a.sort_order = b.sort_order;
      b.sort_order = ao;
    }
    return { ok: true, data: null };
  };
  w.WOYPStore.exportData = async function () { return { ok: true, data: JSON.parse(JSON.stringify(state)) }; };
  w.WOYPStore.saveSetting = async function (k, v) {
    state.settings = state.settings || {};
    state.settings[k] = v;
    return { ok: true, data: { key: k, value: v } };
  };
  w.WOYPStore.uploadImage = async function () { return { ok: true, data: "https://cdn.test/piring-baru.png" }; };
}

async function ujiAdmin() {
  const dom = buatDom("admin.html");
  const w = dom.window;
  const d = w.document;
  w.eval('window.WOYP_CONFIG = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "kunci", SUPABASE_BUCKET: "food-images" };');
  w.eval(baca("js/store.js"));
  if (w.HTMLDialogElement) {
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event("close")); };
  }
  w.confirm = function () { return true; };
  stubAdmin(w);
  w.eval(baca("js/admin.js"));
  await tunggu(50);

  assert.strictEqual(d.getElementById("areaAdmin").hidden, false, "admin: panel admin tampil setelah sesi ada");
  assert.strictEqual(d.getElementById("areaLogin").hidden, true, "admin: login tersembunyi saat sudah sesi");
  assert.strictEqual(d.getElementById("areaMemuat").hidden, true, "admin: tulisan memuat atas disembunyikan");
  assert.strictEqual(w.getComputedStyle(d.getElementById("areaMemuat")).display, "none", "admin: CSS hidden menang atas .memuat");
  assert.ok(d.getElementById("emailAdmin").textContent.includes("admin@contoh.com"), "admin: email tampil di bar");
  assert.ok(d.getElementById("daftarKategori").textContent.includes("Main Theme"), "admin: kategori terdaftar");
  assert.ok(d.getElementById("daftarKategori").textContent.includes("Belum Diisi"), "admin: kategori ikut tampil");

  const tombolBuka = d.querySelector('[data-kat-act="buka"][data-id="cat-main"]');
  assert.ok(tombolBuka.textContent.includes("Buka pilihan (2)"), "admin: jumlah pilihan akar benar");
  klik(w, tombolBuka);
  await tunggu();
  const t = d.getElementById("daftarKategori").textContent;
  assert.ok(t.includes("Ayam Bumbu Hitam"), "admin: pohon item tampil");
  assert.ok(t.includes("Ayam Bakar Madu"), "admin: anak kedua tampil");
  assert.ok(t.includes("pilihan akhir"), "admin: penanda pilihan akhir tampil");
  assert.ok(d.querySelector('[data-item-act="akar"][data-cat="cat-main"]'), "admin: tombol tambah pilihan utama ada");

  const ubahItem = d.querySelector('[data-item-act="ubah"]');
  klik(w, ubahItem);
  await tunggu();
  const dialogItem = d.getElementById("dialogItem");
  assert.strictEqual(dialogItem.open, true, "admin: dialog item terbuka");
  assert.ok(d.getElementById("dialogItemJudul").textContent === "Ubah pilihan", "admin: judul dialog ubah");
  assert.ok(d.getElementById("itemName").value.length > 0, "admin: nama item terisi");
  const cbHapusBg = d.getElementById("itemHapusBg");
  assert.ok(cbHapusBg, "admin: checkbox hapus latar ada");
  assert.strictEqual(cbHapusBg.checked, true, "admin: checkbox hapus latar aktif secara bawaan");
  klik(w, dialogItem.querySelector("[data-tutup]"));
  await tunggu();
  assert.strictEqual(dialogItem.open, false, "admin: dialog item tertutup via Batal");

  const tambahKat = d.getElementById("tombolTambahKat");
  klik(w, tambahKat);
  await tunggu();
  const dialogKat = d.getElementById("dialogKat");
  assert.strictEqual(dialogKat.open, true, "admin: dialog kategori terbuka");
  d.getElementById("formKat").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await tunggu();
  assert.ok(!d.getElementById("katPesan").hidden, "admin: validasi nama kategori kosong");
  d.getElementById("katNama").value = "Minuman";
  d.getElementById("formKat").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await tunggu(60);
  assert.strictEqual(dialogKat.open, false, "admin: dialog kategori tertutup setelah simpan");
  assert.ok(d.getElementById("daftarKategori").textContent.includes("Minuman"), "admin: kategori baru muncul");

  const naik = d.querySelector('[data-kat-act="naik"][data-id="cat-dessert"]');
  klik(w, naik);
  await tunggu(60);
  const urutan = Array.from(d.querySelectorAll(".kat-info h2")).map((h) => h.textContent);
  assert.ok(urutan.indexOf("Dessert") < urutan.indexOf("Main Theme"), "admin: urutan kategori bisa digeser");

  klik(w, d.getElementById("tombolPiring"));
  await tunggu();
  const dialogPiring = d.getElementById("dialogPiring");
  assert.strictEqual(dialogPiring.open, true, "admin: dialog foto piring terbuka");
  const inputPiring = d.getElementById("piringUrl");
  inputPiring.value = "https://contoh.test/piring-baru.png";
  inputPiring.dispatchEvent(new w.Event("input", { bubbles: true }));
  d.getElementById("formPiring").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await tunggu(60);
  assert.strictEqual(dialogPiring.open, false, "admin: dialog foto piring tertutup setelah simpan");
  assert.strictEqual(w.__state.settings.plate_image_url, "https://contoh.test/piring-baru.png", "admin: foto piring tersimpan ke settings");
  assert.ok(d.getElementById("adminPesan").textContent.includes("Foto piring tersimpan"), "admin: konfirmasi simpan foto piring");

  klik(w, d.getElementById("tombolPiring"));
  await tunggu();
  assert.ok(d.getElementById("piringUrl").value.includes("piring-baru.png"), "admin: dialog piring menampilkan foto tersimpan");
  klik(w, d.getElementById("piringHapus"));
  await tunggu(60);
  assert.strictEqual(w.__state.settings.plate_image_url, "", "admin: foto piring dihapus");
  assert.strictEqual(dialogPiring.open, false, "admin: dialog piring tertutup saat hapus");

  const buatAkun = d.getElementById("tombolGantiMode");
  klik(w, buatAkun);
  assert.ok(buatAkun.textContent.includes("Sudah punya akun"), "admin: mode daftar aktif");
  klik(w, buatAkun);
  assert.ok(buatAkun.textContent.includes("Belum punya akun"), "admin: kembali mode masuk");

  d.getElementById("formLogin").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await tunggu();
  assert.ok(!d.getElementById("loginPesan").hidden, "admin: validasi form login kosong");

  klik(w, d.getElementById("tombolKeluar"));
  await tunggu();
  assert.strictEqual(d.getElementById("areaLogin").hidden, false, "admin: logout kembali ke layar login");
  assert.strictEqual(d.getElementById("barAdmin").hidden, true, "admin: bar admin hilang setelah logout");

  dom.window.close();
  console.log("TES ADMIN: lulus");
}

(async function () {
  await ujiShow();
  await ujiShowFotoPiring();
  await ujiShowTanpaData();
  await ujiShowSetup();
  await ujiShowGagalMuat();
  await ujiAdminSetup();
  await ujiAdmin();
  console.log("SEMUA TES DOM LULUS.");
})().catch((err) => {
  console.error("GAGAL:", err && err.message ? err.message : err);
  process.exit(1);
});
