(function () {
  "use strict";

  var L = window.WOYPLogic;
  var S = window.WOYPStore;
  var layar = document.getElementById("layar");
  var tombolKembali = document.getElementById("tombolKembali");
  var statusEl = document.getElementById("statusLayar");

  var EMOJI = ["🍜", "🍗", "🍚", "🍰", "🥤", "🍨", "🍤", "🥗", "🍝", "🥮", "🍲", "🧁", "🍢", "🍔", "🌮", "🍩"];
  var WARNA_KONFETI = ["#c13b52", "#efafb6", "#f6c9ce", "#3a2a2a"];

  var db = null;
  var state = L.initial();
  var gate = "loading";
  var bootError = "";

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function emojiFor(name) {
    var s = String(name || "");
    var sum = 0;
    for (var i = 0; i < s.length; i++) sum += s.charCodeAt(i);
    return EMOJI[sum % EMOJI.length];
  }

  function bulatanHtml(name, imageUrl) {
    if (imageUrl) {
      return '<span class="bulatan"><img src="' + esc(imageUrl) + '" alt=""></span>';
    }
    return '<span class="bulatan" aria-hidden="true">' + emojiFor(name) + "</span>";
  }

  function hasilBulatanHtml(name, imageUrl) {
    if (imageUrl) {
      return '<span class="hasil-bulatan"><img src="' + esc(imageUrl) + '" alt=""></span>';
    }
    return '<span class="hasil-bulatan" aria-hidden="true">' + emojiFor(name) + "</span>";
  }

  var piringUrl = "";

  function piringHtml() {
    if (piringUrl) {
      return '<img class="piring-foto" src="' + esc(piringUrl) + '" alt="">';
    }
    return '<div class="piring-lingkar" aria-hidden="true"></div>';
  }

  function renderGate() {
    tombolKembali.hidden = true;
    statusEl.textContent = "";
    if (gate === "loading") {
      layar.innerHTML = '<div class="memuat">Memuat menu...</div>';
      return;
    }
    if (gate === "setup") {
      layar.innerHTML =
        '<section class="layar-landing">' +
        '<div class="pemberitahuan" style="max-width:560px;text-align:left">' +
        "<h3>Setelan belum lengkap</h3>" +
        "<p>Isi <code>js/config.js</code> dengan URL dan anon key dari proyek Supabase Anda, " +
        "lalu jalankan <code>supabase/schema.sql</code>. Panduan lengkap ada di <code>README.md</code>.</p>" +
        '<p style="margin-top:14px"><a class="btn btn-utama" href="admin.html">Buka halaman admin</a></p>' +
        "</div></section>";
      return;
    }
    layar.innerHTML =
      '<section class="layar-landing">' +
      '<div class="kosong" style="max-width:560px">' +
      "<h3>Menu belum bisa dimuat</h3>" +
      "<p>" + esc(bootError) + "</p>" +
      '<p style="margin-top:16px"><button type="button" class="btn btn-utama" data-act="coba-lagi">Coba lagi</button></p>' +
      "</div></section>";
  }

  function tahapKategori() {
    var idx = -1;
    for (var i = 0; i < db.flow.length; i++) {
      if (db.flow[i].id === state.catId) idx = i;
    }
    return (idx >= 0 ? idx + 1 : 1) + " dari " + db.flow.length;
  }

  function renderLanding() {
    return (
      '<section class="layar-landing layar-anim">' +
      '<div class="piring-lingkar" aria-hidden="true"></div>' +
      '<h1 class="judul-besar"><span>What\'s on</span><span>Your Plate</span></h1>' +
      '<button type="button" class="btn btn-utama btn-besar" data-act="mulai">Mulai</button>' +
      "</section>"
    );
  }

  function renderKosong() {
    return (
      '<section class="layar-kosong layar-anim">' +
      '<div class="kosong"><h3>Belum ada pilihan</h3>' +
      "<p>Kategori atau menu belum dibuat. Isi dulu lewat halaman admin.</p>" +
      '<p style="margin-top:16px"><a class="btn btn-utama" href="admin.html">Buka halaman admin</a></p></div>' +
      "</section>"
    );
  }

  function renderChoose() {
    var info = L.currentChoices(db, state);
    if (!info) return renderKosong();
    var pilihan = "";
    for (var i = 0; i < info.choices.length; i++) {
      var n = info.choices[i];
      pilihan +=
        '<button type="button" class="kartu-pilihan" data-act="pilih-node" data-id="' + esc(n.id) + '" style="--i:' + i + '">' +
        bulatanHtml(n.name, n.image_url) +
        '<span class="pil-nama">' + esc(n.name) + "</span>" +
        "</button>";
    }
    var label = labelTahap();
    var kepala =
      '<div class="head">' +
      (label ? '<p class="tahap">' + esc(label) + "</p>" : "") +
      '<h2 class="judul-layar">' + esc(info.title) + "</h2>" +
      (info.description ? '<div class="kotak-desc">' + esc(info.description) + "</div>" : "") +
      "</div>";
    if (!info.choices.length) {
      return (
        '<section class="layar-pilih layar-anim">' +
        kepala +
        '<div class="kosong"><h3>Belum ada pilihan di sini</h3><p>Minta admin menambahkannya lewat halaman admin.</p></div>' +
        "</section>"
      );
    }
    return (
      '<section class="layar-pilih layar-anim">' +
      kepala +
      '<div class="panggung">' +
      '<div class="panggung-pilihan">' + pilihan + "</div>" +
      '<div class="panggung-piring" aria-hidden="true">' + piringHtml() + "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function renderResult() {
    var pick = state.picks[state.catId];
    if (!pick) return renderChoose();
    return (
      '<section class="layar-hasil layar-anim" role="status" aria-live="polite">' +
      '<p class="tahap">' + esc(labelTahap()) + "</p>" +
      '<p class="kabar">Selamat, kamu akan makan</p>' +
      '<div class="panggung">' +
      '<div class="panggung-pilihan">' + hasilBulatanHtml(pick.name, pick.imageUrl) + "</div>" +
      '<div class="panggung-piring" aria-hidden="true">' + piringHtml() + "</div>" +
      "</div>" +
      '<p class="nama-hasil">' + esc(pick.name) + "</p>" +
      '<p class="kat-hasil">dari kategori ' + esc(pick.categoryName) + "</p>" +
      '<button type="button" class="btn btn-utama btn-besar" data-act="lanjut">Lanjut</button>' +
      "</section>"
    );
  }

  function renderFinal() {
    var picks = L.plateItems(db, state.picks);
    if (!picks.length) {
      return (
        '<section class="layar-piring layar-anim">' +
        '<div class="kosong" style="max-width:560px"><h3>Piring masih kosong</h3>' +
        "<p>Mulai dulu, nanti semua pilihanmu muncul di sini.</p>" +
        '<p style="margin-top:16px"><button type="button" class="btn btn-utama" data-act="kembali">Kembali</button></p></div>' +
        "</section>"
      );
    }
    var n = picks.length;
    var makanan = "";
    var daftar = "";
    for (var i = 0; i < n; i++) {
      var p = picks[i];
      var angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      var x = 50 + (n === 1 ? 0 : 39 * Math.cos(angle));
      var y = 50 + (n === 1 ? 0 : 39 * Math.sin(angle));
      makanan +=
        '<div class="makanan-di-piring" style="--x:' + x.toFixed(1) + "%;--y:" + y.toFixed(1) + "%;--i:" + i + '">' +
        bulatanHtml(p.name, p.imageUrl) +
        '<span class="cap">' + esc(p.name) + "</span>" +
        "</div>";
      daftar +=
        "<li>" + esc(p.name) + ' <span class="dari">(' + esc(p.categoryName) + ")</span></li>";
    }
    var konfeti = "";
    for (var k = 0; k < 16; k++) {
      konfeti +=
        '<span class="konfeti" style="left:' + ((k * 100) / 16 + (k % 3) * 3).toFixed(1) +
        "%;--i:" + k + ";background:" + WARNA_KONFETI[k % WARNA_KONFETI.length] + '"></span>';
    }
    var namaSemua = picks.map(function (p) { return p.name; }).join(", ");
    var kelasPiring = "piring-besar";
    var gayaPiring = "";
    if (piringUrl) {
      kelasPiring += " dengan-foto";
      gayaPiring = ' style="background-image:url(\'' + esc(piringUrl) + '\')"';
    }
    return (
      '<section class="layar-piring layar-anim">' +
      '<div><p class="tahap">' + esc(labelTahap()) + "</p>" +
      '<h2 class="judul-besar">Piringmu malam ini</h2>' +
      '<p class="sub" style="margin-inline:auto">Semua pilihanmu sudah masuk piring. Tinggal dieksekusi berdua.</p></div>' +
      '<div class="' + kelasPiring + '"' + gayaPiring + ' role="img" aria-label="Piring berisi ' + esc(namaSemua) + '">' +
      makanan +
      '<div class="konfeti-wadah" aria-hidden="true">' + konfeti + "</div>" +
      "</div>" +
      '<ul class="daftar-hasil">' + daftar + "</ul>" +
      '<button type="button" class="btn btn-utama btn-besar" data-act="ulang">Mulai lagi</button>' +
      "</section>"
    );
  }

  function labelTahap() {
    if (!db || state.screen === "landing" || state.screen === "categories") return "";
    if (state.screen === "final") {
      return db.flow.length + " dari " + db.flow.length + " kategori";
    }
    if (state.screen === "choose") {
      var info = L.currentChoices(db, state);
      var cat = L.findCat(db, state.catId);
      var asal = info && !info.isCategoryLevel && cat ? cat.name + " · " : "";
      return asal + "kategori " + tahapKategori();
    }
    if (state.screen === "result") return "kategori " + tahapKategori();
    return "";
  }

  function renderNav() {
    var adaNav = state.screen !== "landing";
    tombolKembali.hidden = !adaNav;
    layar.classList.toggle("punya-nav", adaNav);
  }

  function render() {
    if (gate) {
      renderGate();
      return;
    }
    renderNav();
    statusEl.textContent = labelTahap();
    if (state.screen === "landing") layar.innerHTML = renderLanding();
    else if (state.screen === "categories") layar.innerHTML = renderKosong();
    else if (state.screen === "choose") layar.innerHTML = renderChoose();
    else if (state.screen === "result") layar.innerHTML = renderResult();
    else if (state.screen === "final") layar.innerHTML = renderFinal();
  }

  function kembali() {
    if (gate || state.screen === "landing") return;
    state = L.goBack(state);
    render();
  }

  document.addEventListener("click", function (e) {
    cobaMainkanMusik();
    if (e.target.closest("button")) putarSfx();
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");
    var id = el.getAttribute("data-id");
    if (act === "mulai") state = L.startFlow(db, state);
    else if (act === "pilih-node") state = L.pickNode(db, state, id);
    else if (act === "lanjut") state = L.startFlow(db, state);
    else if (act === "ulang") state = L.restart();
    else if (act === "kembali") state = L.goBack(state);
    else if (act === "coba-lagi") { boot(); return; }
    else return;
    render();
  });

  tombolKembali.addEventListener("click", kembali);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") kembali();
  });

  var musikLatar = document.getElementById("musikLatar");
  var sfxKlik = document.getElementById("sfxKlik");

  function cobaMainkanMusik() {
    if (!musikLatar) return;
    try {
      var p = musikLatar.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  function putarSfx() {
    if (!sfxKlik) return;
    try {
      sfxKlik.currentTime = 0;
      var p = sfxKlik.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  cobaMainkanMusik();

  async function boot() {
    gate = "loading";
    render();
    if (!S.isConfigured()) {
      gate = "setup";
      render();
      return;
    }
    var res = await S.fetchAll();
    if (!res.ok) {
      bootError = res.error;
      gate = "error";
      render();
      return;
    }
    db = L.prepare(res.data.categories, res.data.items);
    piringUrl = (res.data.settings && res.data.settings.plate_image_url) || "";
    state = L.initial();
    gate = null;
    render();
  }

  boot();
})();
