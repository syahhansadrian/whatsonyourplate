(function () {
  "use strict";

  var cfg = window.WOYP_CONFIG || {};

  function isConfigured() {
    return Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  }

  function libReady() {
    return typeof window.supabase !== "undefined" &&
      typeof window.supabase.createClient === "function";
  }

  var _client = null;

  function client() {
    if (!isConfigured()) {
      throw new Error("Konfigurasi Supabase belum diisi di js/config.js.");
    }
    if (!libReady()) {
      throw new Error("Pustaka Supabase gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.");
    }
    if (!_client) {
      _client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    }
    return _client;
  }

  function fail(error) {
    var msg = error && error.message ? error.message : String(error || "Terjadi kesalahan tidak diketahui.");
    return { ok: false, error: msg };
  }

  function ok(data) {
    return { ok: true, data: data };
  }

  function bySort(a, b) {
    var d = (a.sort_order || 0) - (b.sort_order || 0);
    if (d !== 0) return d;
    return String(a.name || "").localeCompare(String(b.name || ""), "id");
  }

  async function fetchAll() {
    try {
      var db = client();
      var cats = await db.from("categories").select("*");
      if (cats.error) return fail(cats.error);
      var items = await db.from("items").select("*");
      if (items.error) return fail(items.error);
      var settings = {};
      var set = await db.from("settings").select("*");
      if (!set.error && set.data) {
        set.data.forEach(function (row) {
          settings[row.key] = row.value;
        });
      }
      return ok({
        categories: (cats.data || []).sort(bySort),
        items: (items.data || []).sort(bySort),
        settings: settings
      });
    } catch (e) {
      return fail(e);
    }
  }

  async function getSession() {
    try {
      var res = await client().auth.getSession();
      if (res.error) return fail(res.error);
      return ok(res.data.session);
    } catch (e) {
      return fail(e);
    }
  }

  function onAuthStateChange(cb) {
    try {
      client().auth.onAuthStateChange(function (_event, session) {
        cb(session);
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function signIn(email, password) {
    try {
      var res = await client().auth.signInWithPassword({ email: email, password: password });
      if (res.error) return fail(res.error);
      return ok(res.data.session);
    } catch (e) {
      return fail(e);
    }
  }

  async function signUp(email, password) {
    try {
      var res = await client().auth.signUp({ email: email, password: password });
      if (res.error) return fail(res.error);
      if (!res.data.session) {
        return { ok: true, data: null, message: "Akun dibuat. Konfirmasi lewat email dulu, lalu masuk." };
      }
      return ok(res.data.session);
    } catch (e) {
      return fail(e);
    }
  }

  async function signOut() {
    try {
      var res = await client().auth.signOut();
      if (res.error) return fail(res.error);
      return ok(null);
    } catch (e) {
      return fail(e);
    }
  }

  async function nextOrder(table, filter) {
    var q = client().from(table).select("sort_order").match(filter);
    if (q.error) throw q.error;
    var max = 0;
    (q.data || []).forEach(function (r) {
      if ((r.sort_order || 0) > max) max = r.sort_order || 0;
    });
    return max + 1;
  }

  async function reindex(table, filter) {
    var q = await client().from(table).select("id, sort_order").match(filter);
    if (q.error) throw q.error;
    var rows = (q.data || []).sort(bySort);
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].sort_order !== i + 1) {
        var upd = await client().from(table).update({ sort_order: i + 1 }).eq("id", rows[i].id);
        if (upd.error) throw upd.error;
      }
    }
  }

  async function createCategory(input) {
    try {
      var order = await nextOrder("categories", {});
      var res = await client().from("categories").insert({
        name: input.name,
        description: input.description || null,
        sort_order: order
      }).select().single();
      if (res.error) return fail(res.error);
      return ok(res.data);
    } catch (e) {
      return fail(e);
    }
  }

  async function updateCategory(id, patch) {
    try {
      var res = await client().from("categories").update({
        name: patch.name,
        description: patch.description || null
      }).eq("id", id).select().single();
      if (res.error) return fail(res.error);
      return ok(res.data);
    } catch (e) {
      return fail(e);
    }
  }

  async function deleteCategory(id) {
    try {
      var res = await client().from("categories").delete().eq("id", id);
      if (res.error) return fail(res.error);
      await reindex("categories", {});
      return ok(null);
    } catch (e) {
      return fail(e);
    }
  }

  async function createItem(input) {
    try {
      var filter = {
        category_id: input.category_id,
        parent_id: input.parent_id || null
      };
      var order = await nextOrder("items", filter);
      var res = await client().from("items").insert({
        category_id: input.category_id,
        parent_id: input.parent_id || null,
        name: input.name,
        description: input.description || null,
        image_url: input.image_url || null,
        sort_order: order
      }).select().single();
      if (res.error) return fail(res.error);
      return ok(res.data);
    } catch (e) {
      return fail(e);
    }
  }

  async function updateItem(id, patch) {
    try {
      var body = {
        name: patch.name,
        description: patch.description || null,
        image_url: patch.image_url || null
      };
      var res = await client().from("items").update(body).eq("id", id).select().single();
      if (res.error) return fail(res.error);
      return ok(res.data);
    } catch (e) {
      return fail(e);
    }
  }

  async function deleteItem(id) {
    try {
      var q = await client().from("items").select("category_id, parent_id").eq("id", id).single();
      if (q.error) return fail(q.error);
      var res = await client().from("items").delete().eq("id", id);
      if (res.error) return fail(res.error);
      await reindex("items", {
        category_id: q.data.category_id,
        parent_id: q.data.parent_id
      });
      return ok(null);
    } catch (e) {
      return fail(e);
    }
  }

  async function moveSibling(table, orderedIds, index, dir) {
    try {
      var target = index + dir;
      if (index < 0 || target < 0 || target >= orderedIds.length) return ok(null);
      var a = orderedIds[index];
      var b = orderedIds[target];
      var first = await client().from(table).update({ sort_order: target + 1 }).eq("id", a);
      if (first.error) return fail(first.error);
      var second = await client().from(table).update({ sort_order: index + 1 }).eq("id", b);
      if (second.error) return fail(second.error);
      return ok({ swapped: [a, b] });
    } catch (e) {
      return fail(e);
    }
  }

  async function uploadImage(file) {
    try {
      if (!file.type || file.type.indexOf("image/") !== 0) {
        return fail(new Error("File harus berupa gambar."));
      }
      if (file.size > 5 * 1024 * 1024) {
        return fail(new Error("Ukuran gambar maksimal 5 MB."));
      }
      var extRaw = (file.name || "").split(".").pop() || "png";
      var ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      var path = "menu/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
      var up = await client().storage.from(cfg.SUPABASE_BUCKET || "food-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false
      });
      if (up.error) return fail(up.error);
      var pub = client().storage.from(cfg.SUPABASE_BUCKET || "food-images").getPublicUrl(path);
      return ok(pub.data.publicUrl);
    } catch (e) {
      return fail(e);
    }
  }

  async function saveSetting(key, value) {
    try {
      var res = await client().from("settings").upsert({
        key: key,
        value: value || "",
        updated_at: new Date().toISOString()
      }).select().single();
      if (res.error) return fail(res.error);
      return ok(res.data);
    } catch (e) {
      return fail(e);
    }
  }

  async function exportData() {
    try {
      var res = await fetchAll();
      if (!res.ok) return res;
      return ok(res.data);
    } catch (e) {
      return fail(e);
    }
  }

  async function importData(data) {
    try {
      var db = client();
      var wipe = await db.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (wipe.error) return fail(wipe.error);
      var cats = data.categories || [];
      var items = data.items || [];
      if (cats.length) {
        var insC = await db.from("categories").insert(cats.map(function (c) {
          return {
            id: c.id,
            name: c.name,
            description: c.description || null,
            sort_order: c.sort_order || 0
          };
        }));
        if (insC.error) return fail(insC.error);
      }
      if (items.length) {
        var insI = await db.from("items").insert(items.map(function (i) {
          return {
            id: i.id,
            category_id: i.category_id,
            parent_id: i.parent_id || null,
            name: i.name,
            description: i.description || null,
            image_url: i.image_url || null,
            sort_order: i.sort_order || 0
          };
        }));
        if (insI.error) return fail(insI.error);
      }
      var settings = data.settings || {};
      var skeys = Object.keys(settings);
      if (skeys.length) {
        var insS = await db.from("settings").upsert(skeys.map(function (k) {
          return { key: k, value: settings[k] || "" };
        }));
        if (insS.error) return fail(insS.error);
      }
      return ok(null);
    } catch (e) {
      return fail(e);
    }
  }

  window.WOYPStore = {
    isConfigured: isConfigured,
    libReady: libReady,
    fetchAll: fetchAll,
    getSession: getSession,
    onAuthStateChange: onAuthStateChange,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    createCategory: createCategory,
    updateCategory: updateCategory,
    deleteCategory: deleteCategory,
    createItem: createItem,
    updateItem: updateItem,
    deleteItem: deleteItem,
    moveSibling: moveSibling,
    uploadImage: uploadImage,
    saveSetting: saveSetting,
    exportData: exportData,
    importData: importData
  };
})();
