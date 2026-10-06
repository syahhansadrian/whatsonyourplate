(function () {
  "use strict";

  var S = window.WOYPStore;

  var areaSetup = document.getElementById("areaSetup");
  var areaMemuat = document.getElementById("areaMemuat");
  var areaLogin = document.getElementById("areaLogin");
  var areaAdmin = document.getElementById("areaAdmin");
  var barAdmin = document.getElementById("barAdmin");
  var emailAdmin = document.getElementById("emailAdmin");

  var formLogin = document.getElementById("formLogin");
  var loginPesan = document.getElementById("loginPesan");
  var tombolGantiMode = document.getElementById("tombolGantiMode");
  var tombolMasuk = document.getElementById("tombolMasuk");
  var inputEmail = document.getElementById("email");
  var inputPassword = document.getElementById("password");

  var adminPesan = document.getElementById("adminPesan");
  var daftarKategori = document.getElementById("daftarKategori");
  var tombolTambahKat = document.getElementById("tombolTambahKat");
  var tombolEkspor = document.getElementById("tombolEkspor");
  var tombolImpor = document.getElementById("tombolImpor");
  var fileImpor = document.getElementById("fileImpor");
  var tombolKeluar = document.getElementById("tombolKeluar");

  var dialogKat = document.getElementById("dialogKat");
  var formKat = document.getElementById("formKat");
  var dialogKatJudul = document.getElementById("dialogKatJudul");
  var katNama = document.getElementById("katNama");
  var katDesc = document.getElementById("katDesc");
  var katPesan = document.getElementById("katPesan");

  var dialogItem = document.getElementById("dialogItem");
  var formItem = document.getElementById("formItem");
  var dialogItemJudul = document.getElementById("dialogItemJudul");
  var itemName = document.getElementById("itemName");
  var itemDesc = document.getElementById("itemDesc");
  var itemUrl = document.getElementById("itemUrl");
  var itemFile = document.getElementById("itemFile");
  var itemPreview = document.getElementById("itemPreview");
  var itemPesan = document.getElementById("itemPesan");

  var data = { categories: [], items: [] };
  var buka = {};
  var modeDaftar = false;
  var editKatId = null;
  var editItem = { catId: null, parentId: null, itemId: null };
  var imgFile = null;
  var imgObjectUrl = null;
  var sudahLoad = false;

  function tampilkan(el, on) {
    el.hidden = !on;
  }

  function pesan(el, teks, jenis) {
    if (!teks) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.className = jenis === "catatan" ? "catatan" : "salah";
    el.textContent = teks;
    el.hidden = false;
  }

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function bySort(a, b) {
    var d = (a.sort_order || 0) - (b.sort_order || 0);
    if (d !== 0) return d;
    return String(a.name || "").localeCompare(String(b.name || ""), "id");
  }

  function rootsOf(catId) {
    return data.items
      .filter(function (i) { return i.category_id === catId && !i.parent_id; })
      .sort(bySort);
  }

  function childrenOf(parentId) {
    return data.items
      .filter(function (i) { return i.parent_id === parentId; })
      .sort(bySort);
  }

  function itemById(id) {
    for (var i = 0; i < data.items.length; i++) {
      if (data.items[i].id === id) return data.items[i];
    }
    return null;
  }

  function tombolItem(act, label, id, catId, kelas) {
    return (
      '<button type="button" class="btn btn-kecil ' + (kelas || "btn-hantu") +
      '" data-item-act="' + act + '" data-id="' + esc(id) + '" data-cat="' + esc(catId) + '">' +
      label + "</button>"
    );
  }

  function simpulHtml(node, catId) {
    var kids = childrenOf(node.id);
    var aksi =
      '<button type="button" class="btn btn-kecil btn-hantu" data-item-act="naik" data-id="' + esc(node.id) + '" data-cat="' + esc(catId) + '" aria-label="Naikkan ' + esc(node.name) + '">&uarr;</button>' +
      '<button type="button" class="btn btn-kecil btn-hantu" data-item-act="turun" data-id="' + esc(node.id) + '" data-cat="' + esc(catId) + '" aria-label="Turunkan ' + esc(node.name) + '">&darr;</button>' +
      tombolItem("anakan", "+ Anak", node.id, catId) +
      tombolItem("ubah", "Ubah", node.id, catId) +
      tombolItem("hapus", "Hapus", node.id, catId, "btn-bahaya");
    return (
      '<li class="simpul"><div class="simpul-baris">' +
      '<span class="simpul-nama">' + esc(node.name) + "</span>" +
      (kids.length
        ? '<span class="simpul-tag">' + kids.length + " pilihan</span>"
        : '<span class="sifat-akhir">pilihan akhir</span>') +
      '<div class="aksi-baris">' + aksi + "</div>" +
      "</div>" +
      (kids.length
        ? '<ul class="anak">' + kids.map(function (k) { return simpulHtml(k, catId); }).join("") + "</ul>"
        : "") +
      "</li>"
    );
  }

  function pohonHtml(c) {
    var roots = rootsOf(c.id);
    if (!roots.length) {
      return '<div class="kosong" style="padding:18px">Belum ada pilihan di kategori ini.</div>';
    }
    return "<ul>" + roots.map(function (n) { return simpulHtml(n, c.id); }).join("") + "</ul>";
  }

  function katCard(c, idx, total) {
    var open = Boolean(buka[c.id]);
    var atas =
      '<button type="button" class="btn btn-kecil btn-hantu" data-kat-act="naik" data-id="' + esc(c.id) + '"' + (idx === 0 ? " disabled" : "") + ' aria-label="Naikkan ' + esc(c.name) + '">&uarr;</button>' +
      '<button type="button" class="btn btn-kecil btn-hantu" data-kat-act="turun" data-id="' + esc(c.id) + '"' + (idx === total - 1 ? " disabled" : "") + ' aria-label="Turunkan ' + esc(c.name) + '">&darr;</button>' +
      '<button type="button" class="btn btn-kecil btn-hantu" data-kat-act="ubah" data-id="' + esc(c.id) + '">Ubah</button>' +
      '<button type="button" class="btn btn-kecil btn-bahaya" data-kat-act="hapus" data-id="' + esc(c.id) + '">Hapus</button>';
    var jumlah = rootsOf(c.id).length;
    return (
      '<article class="kartu kartu-kategori-admin">' +
      '<div class="kat-baris"><div class="kat-info"><h2>' + esc(c.name) + "</h2>" +
      (c.description ? '<p class="kat-desc">' + esc(c.description) + "</p>" : "") +
      '</div><div class="aksi-baris">' + atas + "</div></div>" +
      '<div class="kat-buka"><button type="button" class="btn btn-kecil btn-hantu" data-kat-act="buka" data-id="' + esc(c.id) + '" aria-expanded="' + open + '">' +
      (open ? "Tutup pilihan" : "Buka pilihan") + " (" + jumlah + ")</button></div>" +
      (open
        ? '<div class="pohon">' + pohonHtml(c) +
          '<button type="button" class="btn btn-kecil btn-utama tambah-utama" data-item-act="akar" data-cat="' + esc(c.id) + '">+ Tambah pilihan utama</button></div>'
        : "") +
      "</article>"
    );
  }

  function renderDaftar() {
    var cats = data.categories.slice().sort(bySort);
    if (!cats.length) {
      daftarKategori.innerHTML =
        '<div class="kosong"><h3>Belum ada kategori</h3>' +
        "<p>Misalnya Main Theme, Dessert, Snack. Tambah lewat tombol di atas.</p></div>";
      return;
    }
    daftarKategori.innerHTML = cats
      .map(function (c, i) { return katCard(c, i, cats.length); })
      .join("");
  }

  async function muatData() {
    tampilkan(areaAdmin, true);
    tampilkan(areaMemuat, false);
    daftarKategori.innerHTML = '<div class="memuat">Memuat menu...</div>';
    var res = await S.fetchAll();
    if (!res.ok) {
      daftarKategori.innerHTML = "";
      pesan(adminPesan, res.error);
      return;
    }
    pesan(adminPesan, "");
    data = res.data;
    renderDaftar();
  }

  function tampilkanLogin() {
    tampilkan(areaMemuat, false);
    tampilkan(areaSetup, false);
    tampilkan(areaAdmin, false);
    tampilkan(barAdmin, false);
    tampilkan(areaLogin, true);
  }

  function keluarTampilan() {
    sudahLoad = false;
    tampilkanLogin();
  }

  function masukAdmin(session) {
    tampilkan(areaSetup, false);
    tampilkan(areaMemuat, false);
    tampilkan(areaLogin, false);
    tampilkan(areaAdmin, true);
    tampilkan(barAdmin, true);
    emailAdmin.textContent = session.user && session.user.email ? session.user.email : "admin";
    if (!sudahLoad) {
      sudahLoad = true;
      muatData();
    }
  }

  function updateModeLabel() {
    tombolGantiMode.textContent = modeDaftar
      ? "Sudah punya akun? Masuk"
      : "Belum punya akun? Daftar dulu";
    tombolMasuk.textContent = modeDaftar ? "Daftar" : "Masuk";
    inputPassword.autocomplete = modeDaftar ? "new-password" : "current-password";
  }

  tombolGantiMode.addEventListener("click", function (e) {
    e.preventDefault();
    modeDaftar = !modeDaftar;
    updateModeLabel();
    pesan(loginPesan, "");
    inputEmail.focus();
  });

  formLogin.addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = inputEmail.value.trim();
    var pass = inputPassword.value;
    if (!email || !pass) {
      pesan(loginPesan, "Email dan password wajib diisi.");
      return;
    }
    var label = tombolMasuk.textContent;
    tombolMasuk.disabled = true;
    tombolMasuk.textContent = "Memproses...";
    var res = modeDaftar ? await S.signUp(email, pass) : await S.signIn(email, pass);
    tombolMasuk.disabled = false;
    tombolMasuk.textContent = label;
    if (!res.ok) {
      pesan(loginPesan, res.error);
      return;
    }
    if (modeDaftar && res.message) {
      modeDaftar = false;
      updateModeLabel();
      pesan(loginPesan, res.message, "catatan");
      return;
    }
    pesan(loginPesan, "");
    if (res.data) masukAdmin(res.data);
  });

  tombolKeluar.addEventListener("click", async function () {
    await S.signOut();
    keluarTampilan();
  });

  tombolTambahKat.addEventListener("click", function () {
    openKatDialog(null);
  });

  function openKatDialog(id) {
    editKatId = id || null;
    pesan(katPesan, "");
    dialogKatJudul.textContent = id ? "Ubah kategori" : "Tambah kategori";
    var c = null;
    if (id) {
      for (var i = 0; i < data.categories.length; i++) {
        if (data.categories[i].id === id) c = data.categories[i];
      }
    }
    katNama.value = c ? c.name : "";
    katDesc.value = c && c.description ? c.description : "";
    dialogKat.showModal();
    katNama.focus();
  }

  formKat.addEventListener("submit", async function (e) {
    e.preventDefault();
    var nama = katNama.value.trim();
    if (!nama) {
      pesan(katPesan, "Nama kategori wajib diisi.");
      katNama.focus();
      return;
    }
    var deskripsi = katDesc.value.trim();
    var res = editKatId
      ? await S.updateCategory(editKatId, { name: nama, description: deskripsi })
      : await S.createCategory({ name: nama, description: deskripsi });
    if (!res.ok) {
      pesan(katPesan, res.error);
      return;
    }
    dialogKat.close();
    muatData();
  });

  function setPreview(url) {
    if (imgObjectUrl) {
      URL.revokeObjectURL(imgObjectUrl);
      imgObjectUrl = null;
    }
    if (url) {
      itemPreview.innerHTML = '<img src="' + esc(url) + '" alt="">';
    } else {
      itemPreview.textContent = "🍽️";
    }
  }

  function openItemDialog(catId, parentId, itemId) {
    editItem = { catId: catId, parentId: parentId || null, itemId: itemId || null };
    imgFile = null;
    itemFile.value = "";
    pesan(itemPesan, "");
    var it = itemId ? itemById(itemId) : null;
    dialogItemJudul.textContent = itemId
      ? "Ubah pilihan"
      : parentId
        ? "Tambah pilihan di dalam"
        : "Tambah pilihan utama";
    itemName.value = it ? it.name : "";
    itemDesc.value = it && it.description ? it.description : "";
    itemUrl.value = it && it.image_url ? it.image_url : "";
    setPreview(itemUrl.value);
    dialogItem.showModal();
    itemName.focus();
  }

  itemFile.addEventListener("change", function () {
    var f = itemFile.files && itemFile.files[0];
    if (f) {
      imgFile = f;
      itemUrl.value = "";
      imgObjectUrl = URL.createObjectURL(f);
      itemPreview.innerHTML = '<img src="' + esc(imgObjectUrl) + '" alt="">';
    } else {
      imgFile = null;
      setPreview(itemUrl.value.trim());
    }
  });

  itemUrl.addEventListener("input", function () {
    var v = itemUrl.value.trim();
    if (v) {
      imgFile = null;
      itemFile.value = "";
      setPreview(v);
    } else if (!imgFile) {
      setPreview("");
    }
  });

  formItem.addEventListener("submit", async function (e) {
    e.preventDefault();
    var nama = itemName.value.trim();
    if (!nama) {
      pesan(itemPesan, "Nama pilihan wajib diisi.");
      itemName.focus();
      return;
    }
    var tombolSimpan = formItem.querySelector('button[type="submit"]');
    var label = tombolSimpan.textContent;
    tombolSimpan.disabled = true;
    tombolSimpan.textContent = "Menyimpan...";
    try {
      var imageUrl = "";
      if (imgFile) {
        var up = await S.uploadImage(imgFile);
        if (!up.ok) {
          pesan(itemPesan, up.error);
          return;
        }
        imageUrl = up.data;
      } else {
        imageUrl = itemUrl.value.trim();
      }
      var res = editItem.itemId
        ? await S.updateItem(editItem.itemId, {
            name: nama,
            description: itemDesc.value.trim(),
            image_url: imageUrl
          })
        : await S.createItem({
            category_id: editItem.catId,
            parent_id: editItem.parentId,
            name: nama,
            description: itemDesc.value.trim(),
            image_url: imageUrl
          });
      if (!res.ok) {
        pesan(itemPesan, res.error);
        return;
      }
      dialogItem.close();
      muatData();
    } finally {
      tombolSimpan.disabled = false;
      tombolSimpan.textContent = label;
    }
  });

  daftarKategori.addEventListener("click", async function (e) {
    var el = e.target.closest("[data-kat-act],[data-item-act]");
    if (!el) return;
    var res;

    if (el.hasAttribute("data-kat-act")) {
      var act = el.getAttribute("data-kat-act");
      var id = el.getAttribute("data-id");
      if (act === "buka") {
        buka[id] = !buka[id];
        renderDaftar();
      } else if (act === "ubah") {
        openKatDialog(id);
      } else if (act === "hapus") {
        var kat = null;
        data.categories.forEach(function (c) { if (c.id === id) kat = c; });
        if (!kat) return;
        if (!window.confirm('Hapus kategori "' + kat.name + '" beserta semua pilihannya?')) return;
        res = await S.deleteCategory(id);
        if (!res.ok) pesan(adminPesan, res.error);
        else muatData();
      } else if (act === "naik" || act === "turun") {
        var ids = data.categories.slice().sort(bySort).map(function (c) { return c.id; });
        res = await S.moveSibling("categories", ids, ids.indexOf(id), act === "naik" ? -1 : 1);
        if (!res.ok) pesan(adminPesan, res.error);
        else muatData();
      }
      return;
    }

    var iact = el.getAttribute("data-item-act");
    var itemId = el.getAttribute("data-id");
    var catId = el.getAttribute("data-cat");

    if (iact === "akar") {
      openItemDialog(catId, null, null);
    } else if (iact === "anakan") {
      openItemDialog(catId, itemId, null);
    } else if (iact === "ubah") {
      var it = itemById(itemId);
      if (it) openItemDialog(it.category_id, it.parent_id, it.id);
    } else if (iact === "hapus") {
      var hapusIt = itemById(itemId);
      if (!hapusIt) return;
      if (!window.confirm('Hapus pilihan "' + hapusIt.name + '" beserta isinya di bawahnya?')) return;
      res = await S.deleteItem(itemId);
      if (!res.ok) pesan(adminPesan, res.error);
      else muatData();
    } else if (iact === "naik" || iact === "turun") {
      var pindah = itemById(itemId);
      if (!pindah) return;
      var sodara = pindah.parent_id
        ? childrenOf(pindah.parent_id)
        : rootsOf(pindah.category_id);
      var sid = sodara.map(function (s) { return s.id; });
      res = await S.moveSibling("items", sid, sid.indexOf(itemId), iact === "naik" ? -1 : 1);
      if (!res.ok) pesan(adminPesan, res.error);
      else muatData();
    }
  });

  tombolEkspor.addEventListener("click", async function () {
    var res = await S.exportData();
    if (!res.ok) {
      pesan(adminPesan, res.error);
      return;
    }
    var blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "whatsonyourplate-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  tombolImpor.addEventListener("click", function () {
    fileImpor.click();
  });

  fileImpor.addEventListener("change", async function () {
    var f = fileImpor.files && fileImpor.files[0];
    if (!f) return;
    fileImpor.value = "";
    var parsed;
    try {
      parsed = JSON.parse(await f.text());
    } catch (err) {
      pesan(adminPesan, "File JSON tidak valid.");
      return;
    }
    if (!parsed || !Array.isArray(parsed.categories) || !Array.isArray(parsed.items)) {
      pesan(adminPesan, "Struktur file tidak sesuai dengan backup dari aplikasi ini.");
      return;
    }
    if (!window.confirm("Impor akan menimpa SEMUA kategori dan pilihan yang ada sekarang. Lanjutkan?")) return;
    var res = await S.importData(parsed);
    if (!res.ok) {
      pesan(adminPesan, res.error);
      return;
    }
    pesan(adminPesan, "");
    muatData();
  });

  document.querySelectorAll("[data-tutup]").forEach(function (b) {
    b.addEventListener("click", function () {
      b.closest("dialog").close();
    });
  });

  async function boot() {
    if (!S.isConfigured()) {
      tampilkan(areaMemuat, false);
      tampilkan(areaSetup, true);
      return;
    }
    S.onAuthStateChange(function (session) {
      if (session) masukAdmin(session);
      else keluarTampilan();
    });
    var g = await S.getSession();
    if (g.ok && g.data) masukAdmin(g.data);
    else tampilkanLogin();
  }

  boot();
})();
