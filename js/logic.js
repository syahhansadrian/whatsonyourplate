(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WOYPLogic = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function bySort(a, b) {
    var d = (a.sort_order || 0) - (b.sort_order || 0);
    if (d !== 0) return d;
    return String(a.name || "").localeCompare(String(b.name || ""), "id");
  }

  function prepare(categories, items) {
    var cats = (categories || []).slice().sort(bySort);
    var byId = {};
    var list = (items || []).slice();
    list.forEach(function (it) {
      byId[it.id] = Object.assign({}, it, { children: [] });
    });
    var rootsByCat = {};
    cats.forEach(function (c) {
      rootsByCat[c.id] = [];
    });
    list.forEach(function (it) {
      var node = byId[it.id];
      if (it.parent_id && byId[it.parent_id]) {
        byId[it.parent_id].children.push(node);
      } else if (rootsByCat[it.category_id]) {
        rootsByCat[it.category_id].push(node);
      }
    });
    Object.keys(byId).forEach(function (id) {
      byId[id].children.sort(bySort);
    });
    Object.keys(rootsByCat).forEach(function (id) {
      rootsByCat[id].sort(bySort);
    });
    var flow = cats.filter(function (c) {
      return rootsByCat[c.id].length > 0;
    });
    return { categories: cats, flow: flow, byId: byId, rootsByCat: rootsByCat };
  }

  function initial() {
    return { screen: "landing", catId: null, stack: [], picks: {} };
  }

  function findCat(db, catId) {
    for (var i = 0; i < db.categories.length; i++) {
      if (db.categories[i].id === catId) return db.categories[i];
    }
    return null;
  }

  function startFlow(db, s) {
    if (!db.flow.length) {
      return Object.assign({}, s, { screen: "categories", catId: null, stack: [] });
    }
    var pending = pendingFlow(db, s.picks);
    if (!pending.length) {
      return Object.assign({}, s, { screen: "final", catId: null, stack: [] });
    }
    return Object.assign({}, s, { screen: "choose", catId: pending[0].id, stack: [] });
  }

  function pickCategory(s, catId) {
    return Object.assign({}, s, { screen: "choose", catId: catId, stack: [] });
  }

  function currentChoices(db, s) {
    if (s.screen === "result") {
      var doneCat = findCat(db, s.catId);
      return { title: doneCat ? doneCat.name : "", description: "", choices: [], isCategoryLevel: true };
    }
    if (!s.catId) return null;
    var cat = findCat(db, s.catId);
    if (!cat) return null;
    if (s.stack.length === 0) {
      return {
        title: cat.name,
        description: cat.description || "",
        choices: db.rootsByCat[cat.id] || [],
        isCategoryLevel: true
      };
    }
    var node = db.byId[s.stack[s.stack.length - 1]];
    if (!node) return null;
    return {
      title: node.name,
      description: node.description || "",
      choices: node.children || [],
      isCategoryLevel: false
    };
  }

  function pickNode(db, s, nodeId) {
    var node = db.byId[nodeId];
    if (!node || !s.catId || node.category_id !== s.catId) return s;
    if (node.children && node.children.length > 0) {
      return Object.assign({}, s, { screen: "choose", stack: s.stack.concat([nodeId]) });
    }
    var cat = findCat(db, s.catId);
    if (!cat) return s;
    var picks = Object.assign({}, s.picks);
    picks[cat.id] = {
      itemId: node.id,
      name: node.name,
      imageUrl: node.image_url || "",
      categoryId: cat.id,
      categoryName: cat.name
    };
    return Object.assign({}, s, { screen: "result", picks: picks });
  }

  function goBack(s) {
    if (s.screen === "choose" && s.stack.length > 0) {
      return Object.assign({}, s, { stack: s.stack.slice(0, -1) });
    }
    if (s.screen === "result") {
      return pickCategory(s, s.catId);
    }
    if (s.screen === "categories" || s.screen === "choose" || s.screen === "final") {
      return Object.assign({}, s, { screen: "landing" });
    }
    return s;
  }

  function pendingFlow(db, picks) {
    return db.flow.filter(function (c) {
      return !picks[c.id];
    });
  }

  function allDone(db, picks) {
    return db.flow.length > 0 && pendingFlow(db, picks).length === 0;
  }

  function plateItems(db, picks) {
    var out = [];
    db.flow.forEach(function (c) {
      if (picks[c.id]) out.push(picks[c.id]);
    });
    return out;
  }

  function restart() {
    return initial();
  }

  return {
    bySort: bySort,
    prepare: prepare,
    initial: initial,
    findCat: findCat,
    startFlow: startFlow,
    pickCategory: pickCategory,
    currentChoices: currentChoices,
    pickNode: pickNode,
    goBack: goBack,
    pendingFlow: pendingFlow,
    allDone: allDone,
    plateItems: plateItems,
    restart: restart
  };
});
