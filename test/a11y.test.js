const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const baca = (f) => fs.readFileSync(path.join(root, f), "utf8");
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const seed = JSON.parse(baca("test/seed.json"));
const tunggu = (ms = 30) => new Promise((r) => setTimeout(r, ms));

async function jalankanAxe(w, label) {
  const hasil = await w.axe.run(w.document.documentElement, {
    rules: {
      "color-contrast": { enabled: false }
    }
  });
  if (hasil.violations.length) {
    const detail = hasil.violations
      .map((v) => v.id + " (" + v.impact + "): " + v.nodes.map((n) => n.target.join(" ")).join(" | "))
      .join("\n  ");
    assert.fail("Axe menemukan pelanggaran di " + label + ":\n  " + detail);
  }
  console.log("AXE " + label + ": bersih");
}

function klik(w, el) {
  assert.ok(el, "elemen diklik harus ada");
  el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
}

async function ujiShowAxe() {
  const dom = new JSDOM(baca("index.html"), { url: "http://localhost/woyp/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  w.eval(baca("js/logic.js"));
  w.eval('window.WOYP_CONFIG = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "kunci", SUPABASE_BUCKET: "food-images" };');
  w.eval(baca("js/store.js"));
  w.eval("window.WOYPStore.isConfigured = function(){ return true; }; window.WOYPStore.fetchAll = function(){ return Promise.resolve({ ok: true, data: window.__seed }); };");
  w.__seed = seed;
  w.eval(axeSource);
  w.eval(baca("js/show.js"));
  await tunggu();
  const d = w.document;

  await jalankanAxe(w, "show:landing");

  klik(w, d.querySelector('[data-act="mulai"]'));
  await tunggu();
  await jalankanAxe(w, "show:kategori");

  klik(w, d.querySelector('[data-act="pilih-kategori"][data-id="cat-main"]'));
  await tunggu();
  await jalankanAxe(w, "show:pilih-kategori");

  klik(w, d.querySelector('[data-act="pilih-node"][data-id="n-ayam"]'));
  await tunggu();
  await jalankanAxe(w, "show:pilih-node");

  klik(w, d.querySelector('[data-act="pilih-node"][data-id="n-ayam-hitam"]'));
  await tunggu();
  await jalankanAxe(w, "show:hasil");

  klik(w, d.querySelector('[data-act="lanjut"]'));
  await tunggu();
  klik(w, d.querySelector('[data-act="lanjut-berikut"]'));
  await tunggu();
  klik(w, d.querySelector('[data-act="pilih-node"][data-id="n-eskrim"]'));
  await tunggu();
  klik(w, d.querySelector('[data-act="lanjut"]'));
  await tunggu();
  klik(w, d.querySelector('[data-act="lanjut-berikut"]'));
  await tunggu();
  klik(w, d.querySelector('[data-act="pilih-node"][data-id="n-popcorn"]'));
  await tunggu();
  klik(w, d.querySelector('[data-act="lanjut"]'));
  await tunggu();
  await jalankanAxe(w, "show:piring-akhir");

  dom.window.close();
}

async function ujiAdminAxe() {
  const dom = new JSDOM(baca("admin.html"), { url: "http://localhost/woyp/admin.html", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  const d = w.document;
  w.eval('window.WOYP_CONFIG = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "kunci", SUPABASE_BUCKET: "food-images" };');
  w.eval(baca("js/store.js"));
  if (w.HTMLDialogElement) {
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  }
  w.confirm = function () { return true; };
  w.WOYPStore.getSession = async function () { return { ok: true, data: { user: { email: "admin@contoh.com" } } }; };
  w.WOYPStore.fetchAll = async function () { return { ok: true, data: JSON.parse(JSON.stringify(seed)) }; };
  w.WOYPStore.signOut = async function () { return { ok: true, data: null }; };
  w.eval(axeSource);
  w.eval(baca("js/admin.js"));
  await tunggu(60);

  await jalankanAxe(w, "admin:dashboard");

  klik(w, d.querySelector('[data-kat-act="buka"][data-id="cat-main"]'));
  await tunggu();
  await jalankanAxe(w, "admin:pohon-terbuka");

  klik(w, d.querySelector('[data-item-act="ubah"]'));
  await tunggu();
  await jalankanAxe(w, "admin:dialog-item");

  klik(w, d.querySelector("#dialogItem [data-tutup]"));
  await tunggu();
  klik(w, d.getElementById("tombolTambahKat"));
  await tunggu();
  await jalankanAxe(w, "admin:dialog-kategori");

  klik(w, d.querySelector("#dialogKat [data-tutup]"));
  await tunggu();
  klik(w, d.getElementById("tombolPiring"));
  await tunggu();
  await jalankanAxe(w, "admin:dialog-piring");

  klik(w, d.querySelector("#dialogPiring [data-tutup]"));
  await tunggu();
  klik(w, d.getElementById("tombolKeluar"));
  await tunggu();
  await jalankanAxe(w, "admin:login");

  dom.window.close();
}

(async function () {
  await ujiShowAxe();
  await ujiAdminAxe();
  console.log("SEMUA AUDIT AXE LULUS.");
})().catch((err) => {
  console.error("GAGAL:", err && err.message ? err.message : err);
  process.exit(1);
});
