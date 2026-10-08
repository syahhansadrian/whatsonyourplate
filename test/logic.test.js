const assert = require("node:assert");
const L = require("../js/logic.js");

const cats = [
  { id: "cat-main", name: "Main Theme", description: "Inti makanan.", sort_order: 2 },
  { id: "cat-dessert", name: "Dessert", description: "", sort_order: 3 },
  { id: "cat-kosong", name: "Kosong", description: "", sort_order: 1 },
  { id: "cat-snack", name: "Snack", description: "", sort_order: 4 }
];

const items = [
  { id: "n-mie", category_id: "cat-main", parent_id: null, name: "Mie", description: "Hangat.", image_url: "", sort_order: 1 },
  { id: "n-ayam", category_id: "cat-main", parent_id: null, name: "Ayam", description: "Pilih bumbu.", image_url: "", sort_order: 2 },
  { id: "n-mie-goreng", category_id: "cat-main", parent_id: "n-mie", name: "Mie Goreng Jawa", description: "", image_url: "", sort_order: 1 },
  { id: "n-ayam-hitam", category_id: "cat-main", parent_id: "n-ayam", name: "Ayam Bumbu Hitam", description: "Manis gurih.", image_url: "img/hitam.png", sort_order: 1 },
  { id: "n-ayam-bakar", category_id: "cat-main", parent_id: "n-ayam", name: "Ayam Bakar Madu", description: "", image_url: "", sort_order: 2 },
  { id: "n-eskrim", category_id: "cat-dessert", parent_id: null, name: "Es Krim", description: "", image_url: "", sort_order: 1 },
  { id: "n-popcorn", category_id: "cat-snack", parent_id: null, name: "Popcorn", description: "", image_url: "", sort_order: 1 }
];

const db = L.prepare(cats, items);

assert.deepStrictEqual(db.flow.map((c) => c.id), ["cat-main", "cat-dessert", "cat-snack"], "kategori kosong dilewati, urutan sort_order dipakai");
assert.strictEqual(db.rootsByCat["cat-main"].length, 2, "dua akar di Main Theme");
assert.strictEqual(db.byId["n-ayam"].children.length, 2, "ayam punya dua anak");
assert.deepStrictEqual(db.byId["n-ayam"].children.map((n) => n.name), ["Ayam Bumbu Hitam", "Ayam Bakar Madu"], "anak terurut sort_order");

let s = L.initial();
assert.strictEqual(s.screen, "landing");

s = L.startFlow(db, s);
assert.strictEqual(s.screen, "choose", "Mulai langsung ke layar pilih");
assert.strictEqual(s.catId, "cat-main", "kategori pertama sesuai urutan admin");
let info = L.currentChoices(db, s);
assert.strictEqual(info.title, "Main Theme");
assert.strictEqual(info.description, "Inti makanan.");
assert.deepStrictEqual(info.choices.map((n) => n.name), ["Mie", "Ayam"], "pilihan akar kategori");

s = L.pickNode(db, s, "n-ayam");
assert.strictEqual(s.screen, "choose", "node beranak tetap di layar pilih");
assert.deepStrictEqual(s.stack, ["n-ayam"]);
info = L.currentChoices(db, s);
assert.strictEqual(info.title, "Ayam");
assert.strictEqual(info.description, "Pilih bumbu.", "deskripsi node tampil");
assert.deepStrictEqual(info.choices.map((n) => n.name), ["Ayam Bumbu Hitam", "Ayam Bakar Madu"]);

s = L.goBack(s);
assert.strictEqual(s.screen, "choose");
assert.strictEqual(s.stack.length, 0, "kembali satu tingkat");

s = L.pickNode(db, s, "n-ayam");
s = L.pickNode(db, s, "n-ayam-hitam");
assert.strictEqual(s.screen, "result", "node daun menghasilkan layar hasil");
assert.strictEqual(s.picks["cat-main"].name, "Ayam Bumbu Hitam");
assert.strictEqual(s.picks["cat-main"].imageUrl, "img/hitam.png");
assert.strictEqual(s.picks["cat-main"].categoryName, "Main Theme");

const sHasil = L.goBack(s);
assert.strictEqual(sHasil.screen, "choose", "kembali dari hasil ke layar pilih kategori itu");
assert.strictEqual(sHasil.catId, "cat-main");
assert.strictEqual(sHasil.stack.length, 0, "kembali dari hasil ke pilihan akar");

s = L.startFlow(db, s);
assert.strictEqual(s.screen, "choose", "lanjut langsung ke kategori berikutnya");
assert.strictEqual(s.catId, "cat-dessert", "kategori berikutnya sesuai urutan admin");
assert.strictEqual(L.pendingFlow(db, s.picks).length, 2, "masih ada kategori pending");

s = L.pickNode(db, s, "n-eskrim");
s = L.startFlow(db, s);
assert.strictEqual(s.screen, "choose");
assert.strictEqual(s.catId, "cat-snack");

s = L.pickNode(db, s, "n-popcorn");
assert.strictEqual(L.allDone(db, s.picks), true);
s = L.startFlow(db, s);
assert.strictEqual(s.screen, "final", "semua selesai masuk layar piring");

const plate = L.plateItems(db, s.picks);
assert.deepStrictEqual(plate.map((p) => p.name), ["Ayam Bumbu Hitam", "Es Krim", "Popcorn"], "piring sesuai urutan kategori");

s = L.goBack(s);
assert.strictEqual(s.screen, "landing", "kembali dari piring ke halaman awal");

s = L.pickCategory(s, "cat-main");
s = L.pickNode(db, s, "n-mie");
s = L.pickNode(db, s, "n-mie-goreng");
assert.strictEqual(s.picks["cat-main"].name, "Mie Goreng Jawa", "pilih ulang menimpa pilihan lama");

const s2 = L.pickCategory(L.initial(), "cat-main");
const s3 = L.pickNode(db, s2, "n-eskrim");
assert.strictEqual(s3.screen, "choose", "node kategori lain tidak bisa dipilih");
assert.strictEqual(s3.picks["cat-main"], undefined, "tidak ada pilihan tersimpan");

const empty = L.prepare([], []);
assert.deepStrictEqual(empty.flow, [], "data kosong aman");
assert.strictEqual(L.allDone(empty, {}), false);
assert.deepStrictEqual(L.plateItems(empty, {}), []);
assert.strictEqual(L.startFlow(empty, L.initial()).screen, "categories", "data kosong menuju empty state");
assert.strictEqual(L.goBack(L.startFlow(empty, L.initial())).screen, "landing", "kembali dari empty state ke landing");

assert.strictEqual(L.goBack(L.initial()).screen, "landing", "kembali di landing tidak berubah");

const orphanItems = [{ id: "x1", category_id: "cat-main", parent_id: "hilang", name: "Yatim", sort_order: 5 }];
const db2 = L.prepare(cats, orphanItems);
assert.strictEqual(db2.rootsByCat["cat-main"].length, 1, "node yatim jadi akar, tidak hilang");

console.log("Semua tes lulus.");
