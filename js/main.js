/* Tamper — демо-сайт кофейни. Без сборки и серверной части. */
(function () {
  'use strict';

  /* ===== Настройки: меняются под конкретного клиента ===== */
  var CONFIG = {
    shopName: 'Tamper',
    telegram: 'your_telegram',   // ник в Telegram без @
    whatsapp: '79000000000',     // номер для WhatsApp, цифры без плюса
    timezone: 'Europe/Moscow',   // часовой пояс кофейни (Казань)
    openMinutes: 8 * 60,         // открытие, минут от полуночи (8:00)
    closeMinutes: 21 * 60,       // закрытие (21:00)
    lastPickupBeforeClose: 15,   // последний слот выдачи: за столько минут до закрытия
    stepMinutes: 15,             // шаг времени выдачи
    leadMinutes: 15,             // минимальное время на приготовление
    maxQty: 20
  };

  /* ===== Данные конструктора ===== */
  var MILKS = [
    { id: 'cow', name: 'Коровье', add: 0, tint: null, foam: '#f3e6d3' },
    { id: 'lf', name: 'Безлактозное', add: 30, tint: '#d9c3a0', foam: '#f1e3cf' },
    { id: 'oat', name: 'Овсяное', add: 50, tint: '#d8b47a', foam: '#f0dfbd' },
    { id: 'almond', name: 'Миндальное', add: 70, tint: '#cfa684', foam: '#ecdcc6' },
    { id: 'coconut', name: 'Кокосовое', add: 70, tint: '#e6d6c0', foam: '#f6efe4' }
  ];
  var SYRUPS = [
    { id: 'none', name: 'Без сиропа', add: 0, color: null },
    { id: 'vanilla', name: 'Ваниль', add: 40, color: '#f0d78a' },
    { id: 'caramel', name: 'Карамель', add: 40, color: '#c47a1d' },
    { id: 'hazel', name: 'Лесной орех', add: 40, color: '#8a5a30' },
    { id: 'salted', name: 'Солёная карамель', add: 40, color: '#d38b2c' },
    { id: 'coconut', name: 'Кокос', add: 40, color: '#f4eee2' }
  ];
  var TEMPS = [
    { id: 'hot', name: 'Горячий', add: 0 },
    { id: 'ice', name: 'Со льдом', add: 30 }
  ];
  var ADD_SHOT = 70, ADD_CREAM = 40;

  var DRINKS = [
    { id: 'espresso', name: 'Эспрессо', def: 0, milk: false, shot: false, cream: false, ice: false,
      desc: 'Плотный, с густой кремой и нотой тёмного шоколада.',
      sizes: [{ ml: 30, label: 'Одинарный', price: 150 }, { ml: 60, label: 'Двойной', price: 220 }],
      layers: { esp: 0.78, foam: 0.22 }, colors: { esp: '#2a140a', foam: '#b9803f' } },
    { id: 'americano', name: 'Американо', def: 1, milk: false, shot: true, cream: false, ice: true,
      desc: 'Эспрессо с водой: прозрачный, чистый вкус.',
      sizes: [{ ml: 250, price: 190 }, { ml: 350, price: 220 }, { ml: 450, price: 250 }],
      layers: { esp: 0.2, water: 0.8 }, colors: { esp: '#2a140a', water: '#6d3f1f' } },
    { id: 'cappuccino', name: 'Капучино', def: 1, milk: true, shot: true, cream: true, ice: true,
      desc: 'Эспрессо, молоко и плотная молочная пена.',
      sizes: [{ ml: 250, price: 230 }, { ml: 350, price: 270 }, { ml: 450, price: 310 }],
      layers: { esp: 0.3, milk: 0.38, foam: 0.32 }, colors: { esp: '#2f170c', milk: '#c8975f' } },
    { id: 'latte', name: 'Латте', def: 1, milk: true, shot: true, cream: true, ice: true,
      desc: 'Мягкий и сливочный: много молока, немного кофе.',
      sizes: [{ ml: 250, price: 240 }, { ml: 350, price: 280 }, { ml: 450, price: 320 }],
      layers: { esp: 0.2, milk: 0.66, foam: 0.14 }, colors: { esp: '#2f170c', milk: '#d2a574' } },
    { id: 'flat', name: 'Флэт уайт', def: 0, milk: true, shot: false, cream: false, ice: true,
      desc: 'Двойной эспрессо и бархатное молоко. Крепче латте.',
      sizes: [{ ml: 200, price: 260 }, { ml: 300, price: 320 }],
      layers: { esp: 0.38, milk: 0.52, foam: 0.1 }, colors: { esp: '#2f170c', milk: '#c99a68' } },
    { id: 'raf', name: 'Раф', def: 0, milk: true, shot: true, cream: false, ice: true,
      desc: 'Сливочный кофе с ванильным сахаром. Сладкий и нежный.',
      sizes: [{ ml: 300, price: 290 }, { ml: 400, price: 340 }],
      layers: { esp: 0.1, milk: 0.78, foam: 0.12 }, colors: { esp: '#2f170c', milk: '#e6cda6' } },
    { id: 'filter', name: 'Фильтр-кофе', def: 0, milk: false, shot: false, cream: false, ice: true,
      desc: 'Лёгкий и чистый. Сорт зерна меняется каждую неделю.',
      sizes: [{ ml: 300, price: 180 }, { ml: 400, price: 220 }],
      layers: { water: 1 }, colors: { water: '#6a3a1b' } },
    { id: 'cocoa', name: 'Какао', def: 1, milk: true, shot: false, cream: true, ice: true, plain: true,
      desc: 'Густое, на молоке, из тёмного шоколада.',
      sizes: [{ ml: 250, price: 230 }, { ml: 350, price: 270 }, { ml: 450, price: 310 }],
      layers: { milk: 0.82, foam: 0.18 }, colors: { milk: '#5a3322', foam: '#efe0cc' } },
    { id: 'matcha', name: 'Матча-латте', def: 0, milk: true, shot: false, cream: true, ice: true, plain: true,
      desc: 'Японский чай матча с молоком. Бодрит мягче кофе.',
      sizes: [{ ml: 300, price: 330 }, { ml: 400, price: 380 }],
      layers: { milk: 0.84, foam: 0.16 }, colors: { milk: '#a3b36a', foam: '#e8efd2' } }
  ];

  /* ===== Утилиты ===== */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function rub(n) { return fmt(n) + ' ₽'; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function plural(n, a, b, c) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return a;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return b;
    return c;
  }
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var NS = 'http://www.w3.org/2000/svg';
  function se(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function hexToRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mixRgb(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgbCss(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }

  /* ===== Навигация ===== */
  var burger = $('#burger');
  var nav = $('#nav');
  var siteTop = $('#top');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $all('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  $('#nav-cart').addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
  });
  function onScroll() { siteTop.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ===== Рисунок стакана ===== */
  var cupSeq = 0;
  var HOT_ORDER = ['syrup', 'esp', 'water', 'milk', 'foam'];
  var ICE_ORDER = ['syrup', 'water', 'milk', 'esp', 'foam'];

  function createCup(svg) {
    var id = 'cup' + (cupSeq++);
    svg.innerHTML = '';
    var defs = se('defs', null, svg);
    var grad = se('linearGradient', { id: id + '-shade', x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
    [['0', '#000', '.30'], ['.32', '#000', '0'], ['.78', '#fff', '.10'], ['1', '#000', '.22']].forEach(function (st) {
      se('stop', { offset: st[0], 'stop-color': st[1], 'stop-opacity': st[2] }, grad);
    });
    var clipH = se('clipPath', { id: id + '-ch' }, defs);
    var clipHPath = se('path', null, clipH);
    var clipI = se('clipPath', { id: id + '-ci' }, defs);
    var clipIPath = se('path', null, clipI);

    function makeLayers(parent, clipId) {
      var g = se('g', { 'clip-path': 'url(#' + clipId + ')' }, parent);
      var rects = {};
      ['syrup', 'esp', 'water', 'milk', 'foam'].forEach(function (k) { rects[k] = se('rect', { x: 0, y: 0, width: 0, height: 0 }, g); });
      var shade = se('rect', { fill: 'url(#' + id + '-shade)' }, g);
      return { g: g, rects: rects, shade: shade };
    }
    function makeMound(parent) {
      var g = se('g', { class: 'mound' }, parent);
      var e = [se('ellipse', {}, g), se('ellipse', {}, g), se('ellipse', {}, g)];
      e.forEach(function (x) { x.setAttribute('fill', '#fbf6ec'); x.setAttribute('stroke', 'rgba(60,40,20,.12)'); });
      return { g: g, e: e };
    }

    /* горячая чашка */
    var gHot = se('g', { class: 'g-hot' }, svg);
    var saucer = se('ellipse', { class: 'saucer' }, gHot);
    var saucer2 = se('ellipse', { class: 'saucer-in' }, gHot);
    var handle = se('path', { class: 'handle', fill: 'none' }, gHot);
    var hotLayers = makeLayers(gHot, id + '-ch');
    var hotGlass = se('path', { class: 'glass' }, gHot);
    var hotGloss = se('path', { class: 'gloss', fill: 'none' }, gHot);
    var hotMound = makeMound(gHot);
    var steam = se('g', { class: 'steam' }, gHot);
    var steamPaths = [];
    for (var i = 0; i < 3; i++) {
      var sg = se('g', {}, steam);
      var sp = se('path', { class: 'steam-p s' + i, d: 'M0 0c-12-16 12-32 0-48c-12-16 12-32 0-48' }, sg);
      steamPaths.push({ g: sg, p: sp });
    }

    /* стакан со льдом */
    var gIce = se('g', { class: 'g-ice' }, svg);
    var iceLayers = makeLayers(gIce, id + '-ci');
    var cubes = [];
    var cubeG = se('g', { 'clip-path': 'url(#' + id + '-ci)' }, gIce);
    for (var j = 0; j < 4; j++) cubes.push(se('rect', { class: 'cube', rx: 7 }, cubeG));
    var iceGlass = se('path', { class: 'glass' }, gIce);
    var iceGloss = se('path', { class: 'gloss', fill: 'none' }, gIce);
    var iceMound = makeMound(gIce);
    var straw = se('line', { class: 'straw' }, gIce);
    var straw2 = se('line', { class: 'straw2' }, gIce);

    function glassPath(cx, yt, yb, wt, wb, r) {
      var xl1 = cx - wt / 2, xr1 = cx + wt / 2, xl2 = cx - wb / 2, xr2 = cx + wb / 2;
      return 'M' + xl1 + ' ' + yt + 'L' + xr1 + ' ' + yt + 'L' + xr2 + ' ' + (yb - r) +
        'Q' + xr2 + ' ' + yb + ' ' + (xr2 - r) + ' ' + yb + 'L' + (xl2 + r) + ' ' + yb +
        'Q' + xl2 + ' ' + yb + ' ' + xl2 + ' ' + (yb - r) + 'Z';
    }
    function stack(layers, order, p, g, level) {
      var sum = 0, k;
      for (k = 0; k < order.length; k++) sum += Math.max(0, p.f[order[k]] || 0);
      var H = g.h * level, cursor = g.yb;
      for (k = 0; k < order.length; k++) {
        var key = order[k], f = sum > 0 ? Math.max(0, p.f[key] || 0) / sum : 0, hh = f * H;
        var r = layers.rects[key];
        r.setAttribute('x', g.cx - g.wt / 2 - 6);
        r.setAttribute('width', g.wt + 12);
        r.setAttribute('y', (cursor - hh).toFixed(2));
        r.setAttribute('height', Math.max(0, hh + (hh > 0.4 ? 0.6 : 0)).toFixed(2));
        r.setAttribute('fill', rgbCss(p.c[key]));
        cursor -= hh;
      }
      layers.shade.setAttribute('x', g.cx - g.wt / 2);
      layers.shade.setAttribute('width', g.wt);
      layers.shade.setAttribute('y', (g.yb - H).toFixed(2));
      layers.shade.setAttribute('height', H.toFixed(2));
      return g.yb - H;
    }
    function widthAt(g, y) { return g.wb + (g.wt - g.wb) * ((g.yb - y) / g.h); }
    function mound(m, g, yTop, amount) {
      var w = widthAt(g, yTop) * 0.82;
      var rx = [w * 0.5, w * 0.37, w * 0.2], ry = [15, 14, 12], cy = [-7, -22, -36];
      for (var i = 0; i < 3; i++) {
        m.e[i].setAttribute('cx', g.cx); m.e[i].setAttribute('cy', cy[i] + yTop);
        m.e[i].setAttribute('rx', rx[i].toFixed(1)); m.e[i].setAttribute('ry', ry[i]);
      }
      m.g.setAttribute('opacity', Math.min(1, amount * 1.4).toFixed(2));
      m.g.setAttribute('transform', 'translate(' + g.cx + ' ' + yTop + ') scale(' + (0.5 + 0.5 * amount).toFixed(3) + ') translate(' + (-g.cx) + ' ' + (-yTop) + ')');
    }

    function render(p) {
      /* горячая */
      var s = p.s;
      var hh = 195 * s + 25, wt = 220 * s + 28;
      var gh = { cx: 182, yb: 398, h: hh, wt: wt, wb: wt * 0.58 };
      gh.yt = gh.yb - gh.h;
      var rad = 26 * s + 6;
      var d = glassPath(gh.cx, gh.yt, gh.yb, gh.wt, gh.wb, rad);
      clipHPath.setAttribute('d', d); hotGlass.setAttribute('d', d);
      var yTopH = stack(hotLayers, HOT_ORDER, p, gh, 0.86);
      saucer.setAttribute('cx', gh.cx); saucer.setAttribute('cy', gh.yb + 6); saucer.setAttribute('rx', (wt * 0.78).toFixed(1)); saucer.setAttribute('ry', 11);
      saucer2.setAttribute('cx', gh.cx); saucer2.setAttribute('cy', gh.yb + 3); saucer2.setAttribute('rx', (wt * 0.5).toFixed(1)); saucer2.setAttribute('ry', 6);
      var y1 = gh.yt + 0.2 * gh.h, y2 = gh.yt + 0.7 * gh.h;
      function xr(y) { return gh.cx + gh.wb / 2 + (gh.wt - gh.wb) / 2 * ((gh.yb - y) / gh.h); }
      var hx1 = xr(y1) - 3, hx2 = xr(y2) - 3, off = wt * 0.26;
      handle.setAttribute('d', 'M' + hx1 + ' ' + y1 + 'C' + (hx1 + off) + ' ' + (y1 - gh.h * 0.06) + ' ' + (hx2 + off) + ' ' + (y2 + gh.h * 0.06) + ' ' + hx2 + ' ' + y2);
      handle.setAttribute('stroke-width', (7 * s + 4).toFixed(1));
      hotGloss.setAttribute('d', 'M' + (gh.cx - gh.wt / 2 + 14 * s) + ' ' + (gh.yt + 16) + 'L' + (gh.cx - gh.wb / 2 + 12 * s) + ' ' + (gh.yb - 30 * s));
      mound(hotMound, gh, yTopH, p.cream);
      var steamY = yTopH - 16 - p.cream * 44;
      steamPaths.forEach(function (sp, i) {
        sp.g.setAttribute('transform', 'translate(' + (gh.cx + (i - 1) * 34) + ' ' + steamY.toFixed(1) + ')');
      });
      gHot.setAttribute('opacity', (1 - p.ice).toFixed(3));
      gHot.style.visibility = p.ice > 0.999 ? 'hidden' : 'visible';

      /* со льдом */
      var si = p.si;
      var ih = 250 * si + 10, iw = 140 * si + 24;
      var gi = { cx: 200, yb: 424, h: ih, wt: iw, wb: iw * 0.74 };
      gi.yt = gi.yb - gi.h;
      var d2 = glassPath(gi.cx, gi.yt, gi.yb, gi.wt, gi.wb, 12);
      clipIPath.setAttribute('d', d2); iceGlass.setAttribute('d', d2);
      var yTopI = stack(iceLayers, ICE_ORDER, p, gi, 0.9);
      var q = 34 * si;
      var pos = [[-0.3, -6, -14], [0.04, -16, 10], [-0.12, 28, 20], [0.2, 30, -8]];
      cubes.forEach(function (c, i) {
        var cxx = gi.cx + pos[i][0] * gi.wt - q / 2, cyy = yTopI + pos[i][1];
        c.setAttribute('x', cxx.toFixed(1)); c.setAttribute('y', cyy.toFixed(1));
        c.setAttribute('width', q.toFixed(1)); c.setAttribute('height', q.toFixed(1));
        c.setAttribute('transform', 'rotate(' + pos[i][2] + ' ' + (cxx + q / 2).toFixed(1) + ' ' + (cyy + q / 2).toFixed(1) + ')');
      });
      iceGloss.setAttribute('d', 'M' + (gi.cx - gi.wt / 2 + 14) + ' ' + (gi.yt + 18) + 'L' + (gi.cx - gi.wb / 2 + 12) + ' ' + (gi.yb - 34));
      mound(iceMound, gi, yTopI, p.cream);
      var sx1 = gi.cx + gi.wb * 0.18, sy1 = gi.yb - 14, sx2 = gi.cx + gi.wt * 0.18 + 26, sy2 = gi.yt - 56 - p.cream * 30;
      [straw, straw2].forEach(function (l) {
        l.setAttribute('x1', sx1.toFixed(1)); l.setAttribute('y1', sy1.toFixed(1));
        l.setAttribute('x2', sx2.toFixed(1)); l.setAttribute('y2', sy2.toFixed(1));
      });
      gIce.setAttribute('opacity', p.ice.toFixed(3));
      gIce.style.visibility = p.ice < 0.001 ? 'hidden' : 'visible';
    }

    var cur = null, raf = 0;
    function clone(p) {
      var o = { ice: p.ice, s: p.s, si: p.si, cream: p.cream, f: {}, c: {} };
      for (var k in p.f) o.f[k] = p.f[k];
      for (var k2 in p.c) o.c[k2] = p.c[k2].slice();
      return o;
    }
    function set(target, instant) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!cur || instant || reduceMotion) { cur = clone(target); render(cur); return; }
      var from = clone(cur), t0 = null, dur = 420;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - t, 3);
        var o = { ice: from.ice + (target.ice - from.ice) * e, s: from.s + (target.s - from.s) * e, si: from.si + (target.si - from.si) * e, cream: from.cream + (target.cream - from.cream) * e, f: {}, c: {} };
        ['syrup', 'esp', 'water', 'milk', 'foam'].forEach(function (k) {
          o.f[k] = from.f[k] + (target.f[k] - from.f[k]) * e;
          o.c[k] = mixRgb(from.c[k], target.c[k], e);
        });
        cur = o; render(o);
        if (t < 1) raf = requestAnimationFrame(step); else { raf = 0; cur = clone(target); render(cur); }
      }
      raf = requestAnimationFrame(step);
    }
    return { set: set };
  }

  /* ===== Состояние конструктора ===== */
  var state = { drink: 'latte', size: 1, temp: 'hot', milk: 'cow', syrup: 'none', shot: false, cream: false };
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function drinkOf() { return byId(DRINKS, state.drink); }
  function sizeOf(d) { return d.sizes[Math.min(state.size, d.sizes.length - 1)]; }
  function isIce() { return state.temp === 'ice' && drinkOf().ice; }

  function unitPrice() {
    var d = drinkOf(), p = sizeOf(d).price;
    if (d.milk) p += byId(MILKS, state.milk).add;
    p += byId(SYRUPS, state.syrup).add;
    if (isIce()) p += byId(TEMPS, 'ice').add;
    if (d.shot && state.shot) p += ADD_SHOT;
    if (d.cream && state.cream) p += ADD_CREAM;
    return p;
  }
  function specText() {
    var d = drinkOf(), parts = [];
    var sz = sizeOf(d);
    parts.push(sz.ml + ' мл');
    parts.push(isIce() ? 'со льдом' : 'горячий');
    if (d.milk) parts.push(byId(MILKS, state.milk).name.toLowerCase() + ' молоко');
    if (state.syrup !== 'none') parts.push('сироп: ' + byId(SYRUPS, state.syrup).name.toLowerCase());
    if (d.shot && state.shot) parts.push('двойной шот');
    if (d.cream && state.cream) parts.push('сливки');
    return parts.join(' · ');
  }

  function cupParams(d, st, ice) {
    var sz = d.sizes[Math.min(st.size, d.sizes.length - 1)];
    var f = { syrup: 0, esp: 0, water: 0, milk: 0, foam: 0 };
    var c = { syrup: [240, 215, 138], esp: hexToRgb('#2f170c'), water: hexToRgb('#6d3f1f'), milk: hexToRgb('#c8975f'), foam: hexToRgb('#f3e6d3') };
    var k;
    for (k in d.layers) f[k] = d.layers[k];
    for (k in d.colors) c[k] = hexToRgb(d.colors[k]);
    if (d.shot && st.shot) f.esp += 0.08;
    var milk = byId(MILKS, st.milk);
    if (d.milk && !d.plain) {
      if (milk.tint) c.milk = mixRgb(c.milk, hexToRgb(milk.tint), 0.35);
      c.foam = hexToRgb(milk.foam);
    }
    if (st.syrup !== 'none') { f.syrup = 0.08; c.syrup = hexToRgb(byId(SYRUPS, st.syrup).color); }
    var cream = d.cream && st.cream ? 1 : 0;
    return {
      ice: ice ? 1 : 0,
      s: 0.55 + sz.ml / 450 * 0.55,
      si: 0.78 + sz.ml / 450 * 0.3,
      cream: cream, f: f, c: c
    };
  }

  /* ===== Группы переключателей (radiogroup) ===== */
  function RadioGroup(box, items, onPick) {
    var self = this;
    this.box = box; this.items = items; this.btns = [];
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.dataset.id = it.id; b.tabIndex = -1;
      b.className = box.dataset.kind === 'drink' ? 'drink' : 'pill';
      b.innerHTML = it.html;
      b.addEventListener('click', function () { if (!b.disabled) onPick(it.id); });
      b.addEventListener('keydown', function (e) {
        var key = e.key, dir = 0;
        if (key === 'ArrowRight' || key === 'ArrowDown') dir = 1;
        else if (key === 'ArrowLeft' || key === 'ArrowUp') dir = -1;
        else if (key === 'Home') dir = 'first';
        else if (key === 'End') dir = 'last';
        else return;
        e.preventDefault();
        var enabled = self.btns.filter(function (x) { return !x.disabled; });
        if (!enabled.length) return;
        var i = enabled.indexOf(b), to;
        if (dir === 'first') to = enabled[0];
        else if (dir === 'last') to = enabled[enabled.length - 1];
        else to = enabled[(i + dir + enabled.length) % enabled.length];
        onPick(to.dataset.id); to.focus();
      });
      box.appendChild(b); self.btns.push(b);
    });
  }
  RadioGroup.prototype.sync = function (selected, disabledMap) {
    var anyChecked = false, firstEnabled = null;
    this.btns.forEach(function (b) {
      var dis = !!(disabledMap && disabledMap[b.dataset.id]);
      b.disabled = dis;
      var on = b.dataset.id === selected && !dis;
      b.setAttribute('aria-checked', String(on));
      b.classList.toggle('on', on);
      if (on) anyChecked = true;
      if (!dis && !firstEnabled) firstEnabled = b;
    });
    this.btns.forEach(function (b) {
      b.tabIndex = (anyChecked ? b.getAttribute('aria-checked') === 'true' : b === firstEnabled) ? 0 : -1;
    });
  };
  RadioGroup.prototype.setItems = function (items, onPick) {
    this.box.innerHTML = '';
    RadioGroup.call(this, this.box, items, onPick);
  };

  var optDrink = $('#opt-drink'), optSize = $('#opt-size'), optTemp = $('#opt-temp'), optMilk = $('#opt-milk'), optSyrup = $('#opt-syrup'), optExtra = $('#opt-extra');
  optDrink.dataset.kind = 'drink';

  var drinkGroup = new RadioGroup(optDrink, DRINKS.map(function (d) {
    return { id: d.id, html: '<span class="d-name">' + d.name + '</span><span class="d-from">от ' + rub(d.sizes[0].price) + '</span>' };
  }), function (id) { pickDrink(id); });

  var sizeGroup = null;
  function buildSizes() {
    var d = drinkOf();
    var items = d.sizes.map(function (s, i) {
      return { id: String(i), html: '<span>' + (s.label ? s.label + ' · ' : '') + s.ml + ' мл</span>' };
    });
    if (!sizeGroup) { sizeGroup = new RadioGroup(optSize, items, pickSize); }
    else { sizeGroup.setItems(items, pickSize); }
  }
  var tempGroup = new RadioGroup(optTemp, TEMPS.map(function (t) {
    return { id: t.id, html: '<span>' + t.name + (t.add ? ' <small>+' + t.add + ' ₽</small>' : '') + '</span>' };
  }), function (id) { state.temp = id; update(); });
  var milkGroup = new RadioGroup(optMilk, MILKS.map(function (m) {
    return { id: m.id, html: '<span>' + m.name + (m.add ? ' <small>+' + m.add + ' ₽</small>' : '') + '</span>' };
  }), function (id) { state.milk = id; update(); });
  var syrupGroup = new RadioGroup(optSyrup, SYRUPS.map(function (s) {
    return { id: s.id, html: '<span>' + s.name + (s.add ? ' <small>+' + s.add + ' ₽</small>' : '') + '</span>' };
  }), function (id) { state.syrup = id; update(); });

  var shotBtn = document.createElement('button');
  shotBtn.type = 'button'; shotBtn.className = 'pill'; shotBtn.setAttribute('aria-pressed', 'false');
  shotBtn.innerHTML = '<span>Ещё шот эспрессо <small>+' + ADD_SHOT + ' ₽</small></span>';
  shotBtn.addEventListener('click', function () { state.shot = !state.shot; update(); });
  var creamBtn = document.createElement('button');
  creamBtn.type = 'button'; creamBtn.className = 'pill'; creamBtn.setAttribute('aria-pressed', 'false');
  creamBtn.innerHTML = '<span>Взбитые сливки <small>+' + ADD_CREAM + ' ₽</small></span>';
  creamBtn.addEventListener('click', function () { state.cream = !state.cream; update(); });
  optExtra.appendChild(shotBtn); optExtra.appendChild(creamBtn);

  function pickDrink(id) {
    var prev = drinkOf(), next = byId(DRINKS, id);
    if (prev.id === next.id) return;
    state.drink = id;
    state.size = (prev.sizes.length === next.sizes.length) ? Math.min(state.size, next.sizes.length - 1) : next.def;
    if (!next.ice) state.temp = 'hot';
    if (!next.shot) state.shot = false;
    if (!next.cream) state.cream = false;
    buildSizes();
    update();
  }
  function pickSize(id) { state.size = parseInt(id, 10) || 0; update(); }

  var cup = createCup($('#cup'));
  var heroCup = createCup($('#hero-cup'));
  heroCup.set(cupParams(byId(DRINKS, 'latte'), { size: 1, milk: 'cow', syrup: 'none', shot: false, cream: false }, false), true);

  function showNote(el, text) { el.hidden = !text; el.textContent = text || ''; }
  var firstRender = true;
  function update() {
    var d = drinkOf();
    sizeGroup.sync(String(Math.min(state.size, d.sizes.length - 1)), null);
    var tDis = {}; tDis.ice = !d.ice;
    tempGroup.sync(isIce() ? 'ice' : 'hot', tDis);
    showNote($('#n-temp'), d.ice ? '' : 'Эспрессо подаём только горячим.');
    var mDis = {}; MILKS.forEach(function (m) { mDis[m.id] = !d.milk; });
    milkGroup.sync(state.milk, mDis);
    showNote($('#n-milk'), d.milk ? '' : 'В этом напитке молоко не используется.');
    syrupGroup.sync(state.syrup, null);
    shotBtn.disabled = !d.shot; creamBtn.disabled = !d.cream;
    shotBtn.setAttribute('aria-pressed', String(!!(d.shot && state.shot)));
    creamBtn.setAttribute('aria-pressed', String(!!(d.cream && state.cream)));
    shotBtn.classList.toggle('on', !!(d.shot && state.shot));
    creamBtn.classList.toggle('on', !!(d.cream && state.cream));
    showNote($('#n-extra'), (!d.shot && !d.cream) ? 'Для этого напитка добавки недоступны.' : '');

    var spec = specText(), price = unitPrice();
    $('#b-name').textContent = d.name;
    $('#b-desc').textContent = d.desc;
    $('#b-spec').textContent = spec;
    $('#b-price').textContent = rub(price);
    $('#cup').setAttribute('aria-label', 'Ваш напиток: ' + d.name + ', ' + spec);
    drinkGroup.sync(state.drink, null);
    cup.set(cupParams(d, state, isIce()), firstRender);
    firstRender = false;
  }
  buildSizes();
  update();

  /* ===== Корзина ===== */
  var cart = [];
  var cartList = $('#cart-list'), cartEmpty = $('#cart-empty'), cartTotalRow = $('#cart-total-row'), cartTotal = $('#cart-total');
  var live = $('#live');
  function cartCount() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function cartSum() { return cart.reduce(function (s, i) { return s + i.qty * i.price; }, 0); }

  function renderCart(focusKey, focusAct) {
    cartList.innerHTML = '';
    cart.forEach(function (it) {
      var li = document.createElement('li');
      li.className = 'ci';
      var main = document.createElement('div'); main.className = 'ci-main';
      var h = document.createElement('p'); h.className = 'ci-t'; h.textContent = it.title; main.appendChild(h);
      if (it.detail) { var p = document.createElement('p'); p.textContent = it.detail; main.appendChild(p); }
      var qty = document.createElement('div'); qty.className = 'qty'; qty.setAttribute('role', 'group'); qty.setAttribute('aria-label', 'Количество: ' + it.title);
      var minus = document.createElement('button'); minus.type = 'button'; minus.className = 'q-btn'; minus.dataset.key = it.key; minus.dataset.act = 'minus';
      minus.setAttribute('aria-label', 'Убрать одну порцию: ' + it.title); minus.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"/></svg>';
      var num = document.createElement('span'); num.className = 'q-num'; num.textContent = String(it.qty);
      var plus = document.createElement('button'); plus.type = 'button'; plus.className = 'q-btn'; plus.dataset.key = it.key; plus.dataset.act = 'plus';
      plus.setAttribute('aria-label', 'Добавить ещё одну порцию: ' + it.title); plus.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10"/></svg>';
      plus.disabled = it.qty >= CONFIG.maxQty;
      qty.appendChild(minus); qty.appendChild(num); qty.appendChild(plus);
      var pr = document.createElement('span'); pr.className = 'ci-p'; pr.textContent = rub(it.price * it.qty);
      li.appendChild(main); li.appendChild(qty); li.appendChild(pr);
      cartList.appendChild(li);
    });
    var n = cartCount(), sum = cartSum();
    cartEmpty.hidden = n > 0; cartList.hidden = n === 0; cartTotalRow.hidden = n === 0;
    cartTotal.textContent = rub(sum);
    $('#nav-count').textContent = String(n);
    $('#nav-count').hidden = n === 0;
    $('#nav-count-sr').textContent = n ? ': ' + n + ' ' + plural(n, 'позиция', 'позиции', 'позиций') + ', ' + rub(sum) : '';
    $('#cb-count').textContent = n + ' ' + plural(n, 'позиция', 'позиции', 'позиций');
    $('#cb-total').textContent = rub(sum);
    updateBar();
    if (n > 0) clearCartError();
    if (focusKey) {
      var t = cartList.querySelector('[data-key="' + focusKey.replace(/"/g, '\\"') + '"][data-act="' + focusAct + '"]');
      if (t && !t.disabled) t.focus();
      else {
        var other = cartList.querySelector('[data-key="' + focusKey.replace(/"/g, '\\"') + '"]:not(:disabled)');
        if (other) other.focus();
      }
    }
  }
  cartList.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.q-btn') : null;
    if (!b || b.disabled) return;
    var key = b.dataset.key, act = b.dataset.act, idx = -1;
    cart.forEach(function (it, i) { if (it.key === key) idx = i; });
    if (idx < 0) return;
    if (act === 'plus') { if (cart[idx].qty < CONFIG.maxQty) cart[idx].qty++; }
    else {
      cart[idx].qty--;
      if (cart[idx].qty <= 0) {
        var nextKey = cart[idx + 1] ? cart[idx + 1].key : (cart[idx - 1] ? cart[idx - 1].key : null);
        var removed = cart[idx].title;
        cart.splice(idx, 1);
        live.textContent = 'Убрано из заказа: ' + removed;
        renderCart(nextKey, 'minus');
        if (!nextKey) { cartEmpty.setAttribute('tabindex', '-1'); cartEmpty.focus(); }
        return;
      }
    }
    renderCart(key, act);
  });

  function addToCart(item) {
    var found = null;
    cart.forEach(function (it) { if (it.key === item.key) found = it; });
    if (found) { if (found.qty < CONFIG.maxQty) found.qty++; }
    else cart.push({ key: item.key, title: item.title, detail: item.detail || '', price: item.price, qty: 1 });
    renderCart();
    live.textContent = 'Добавлено в заказ: ' + item.title + '. Всего ' + cartCount() + ' ' + plural(cartCount(), 'позиция', 'позиции', 'позиций') + ', ' + rub(cartSum());
    var bump = $('#nav-cart'); bump.classList.remove('bump'); void bump.offsetWidth; bump.classList.add('bump');
  }
  function flash(btn, textOn, textOff) {
    btn.classList.add('added');
    if (textOn !== undefined) btn.querySelector('.b-label').textContent = textOn;
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.classList.remove('added');
      if (textOff !== undefined) btn.querySelector('.b-label').textContent = textOff;
    }, 1300);
  }

  /* кнопка «Добавить в заказ» в конструкторе */
  var bAdd = $('#b-add');
  bAdd.innerHTML = '<span class="b-label">Добавить в заказ</span>';
  bAdd.addEventListener('click', function () {
    var d = drinkOf(), spec = specText();
    addToCart({ key: 'drink|' + d.id + '|' + spec, title: d.name, detail: spec.replace(/ · /g, ', '), price: unitPrice() });
    flash(bAdd, 'Добавлено', 'Добавить в заказ');
  });

  /* меню: кнопки «+» */
  var iconPlus = '<svg class="i-plus" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10"/></svg><svg class="i-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';
  $all('.mi').forEach(function (li) {
    var name = li.dataset.name, price = parseInt(li.dataset.price, 10);
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'add'; b.innerHTML = iconPlus;
    b.setAttribute('aria-label', 'Добавить в заказ: ' + name + ', ' + price + ' рублей');
    b.addEventListener('click', function () {
      addToCart({ key: 'menu|' + name, title: name, detail: '', price: price });
      flash(b);
    });
    li.appendChild(b);
  });
  /* зерно */
  $all('.bean').forEach(function (li) {
    var name = li.dataset.name, price = parseInt(li.dataset.price, 10);
    var btn = $('.add-bean', li), sel = $('.grind-sel', li);
    btn.innerHTML = '<span class="b-label">В заказ</span>';
    btn.setAttribute('aria-label', 'Добавить в заказ зерно ' + name + ', 250 г, ' + price + ' рублей');
    btn.addEventListener('click', function () {
      var grind = sel.value;
      addToCart({ key: 'bean|' + name + '|' + grind, title: 'Зерно ' + name + ', 250 г', detail: 'помол: ' + grind.toLowerCase(), price: price });
      flash(btn, 'Добавлено', 'В заказ');
    });
  });

  /* плавающая панель заказа */
  var cartbar = $('#cartbar');
  var orderVisible = false;
  function updateBar() {
    var on = cartCount() > 0 && !orderVisible;
    cartbar.classList.toggle('on', on);
    $('#cb-go').tabIndex = on ? 0 : -1;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { orderVisible = e.isIntersecting; });
      updateBar();
    }, { threshold: 0.12 }).observe($('#zakaz'));
  }

  /* ===== Время выдачи ===== */
  function shopNow() {
    var now = new Date();
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: CONFIG.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { y: +o.year, m: +o.month, d: +o.day, min: (+o.hour) * 60 + (+o.minute) };
    } catch (e) {
      return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(), min: now.getHours() * 60 + now.getMinutes() };
    }
  }
  function dayLabel(base, plus) {
    var dt = new Date(Date.UTC(base.y, base.m - 1, base.d + plus));
    return pad(dt.getUTCDate()) + '.' + pad(dt.getUTCMonth() + 1);
  }
  function hm(min) { return Math.floor(min / 60) + ':' + pad(min % 60); }
  var fTime = $('#f-time'), fName = $('#f-name'), fPhone = $('#f-phone'), fComment = $('#f-comment');
  var dayInputs = $all('input[name="day"]');
  function currentDay() { var c = dayInputs.filter(function (i) { return i.checked; })[0]; return c ? c.value : 'today'; }

  function todaySlots(now) {
    var last = CONFIG.closeMinutes - CONFIG.lastPickupBeforeClose;
    var start = Math.ceil((now.min + CONFIG.leadMinutes) / CONFIG.stepMinutes) * CONFIG.stepMinutes;
    if (start < CONFIG.openMinutes) start = CONFIG.openMinutes;
    var out = [];
    for (var t = start; t <= last; t += CONFIG.stepMinutes) out.push(t);
    return out;
  }
  function tomorrowSlots() {
    var last = CONFIG.closeMinutes - CONFIG.lastPickupBeforeClose, out = [];
    for (var t = CONFIG.openMinutes; t <= last; t += CONFIG.stepMinutes) out.push(t);
    return out;
  }
  function openNowFlag(now) { return now.min >= CONFIG.openMinutes && now.min < CONFIG.closeMinutes; }

  function fillTimes() {
    var now = shopNow(), prev = fTime.value;
    var tSlots = todaySlots(now);
    var todayInput = dayInputs.filter(function (i) { return i.value === 'today'; })[0];
    todayInput.disabled = tSlots.length === 0;
    todayInput.closest('label').classList.toggle('dis', todayInput.disabled);
    if (todayInput.disabled && todayInput.checked) dayInputs.filter(function (i) { return i.value === 'tomorrow'; })[0].checked = true;
    var day = currentDay();
    var slots = day === 'today' ? tSlots : tomorrowSlots();
    fTime.innerHTML = '';
    var ph = document.createElement('option'); ph.value = ''; ph.textContent = 'Выберите время'; fTime.appendChild(ph);
    var asapOk = day === 'today' && openNowFlag(now) && tSlots.length > 0;
    if (asapOk) {
      var a = document.createElement('option'); a.value = 'asap'; a.textContent = 'Как можно скорее (через ~15 минут)'; fTime.appendChild(a);
    }
    slots.forEach(function (t) {
      var o = document.createElement('option'); o.value = hm(t); o.textContent = hm(t); fTime.appendChild(o);
    });
    var keep = Array.prototype.some.call(fTime.options, function (o) { return o.value === prev && prev !== ''; });
    if (keep) fTime.value = prev;
    else if (asapOk) fTime.value = 'asap';
    else fTime.value = '';
    $('#h-time').textContent = 'Время по Казани, сейчас у нас ' + hm(now.min) + '. Заказ готовим за 10–15 минут.';
  }
  dayInputs.forEach(function (i) { i.addEventListener('change', function () { fTime.value = ''; fillTimes(); clearError(fTime); }); });
  fTime.addEventListener('change', function () { clearError(fTime); });

  /* открыто / закрыто */
  function updateOpen() {
    var now = shopNow(), badge = $('#open-badge'), txt = $('#open-text');
    var isOpen = openNowFlag(now);
    badge.classList.toggle('is-open', isOpen);
    if (isOpen) txt.textContent = 'Открыто до ' + hm(CONFIG.closeMinutes);
    else if (now.min < CONFIG.openMinutes) txt.textContent = 'Откроемся сегодня в ' + hm(CONFIG.openMinutes);
    else txt.textContent = 'Сейчас закрыто, откроемся завтра в ' + hm(CONFIG.openMinutes);
  }

  /* ===== Телефон: +7 (9XX) XXX-XX-XX ===== */
  function digitsOf(v) {
    var d = v.replace(/\D/g, '');
    if (/^\s*\+7/.test(v)) d = d.slice(1);
    if (d.charAt(0) === '8') d = d.slice(1);
    if (d.length > 10 && d.charAt(0) === '7') d = d.slice(1);
    return d.slice(0, 10);
  }
  function maskPhone(d) {
    if (!d) return '';
    var out = '+7 (' + d.slice(0, 3);
    if (d.length >= 3) out += ')';
    if (d.length > 3) out += ' ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    return out;
  }
  var lastDigits = '';
  fPhone.addEventListener('input', function (e) {
    var raw = fPhone.value;
    var d = digitsOf(raw);
    var deleting = !!(e.inputType && e.inputType.indexOf('delete') === 0);
    if (deleting && d === lastDigits && d) { d = d.slice(0, -1); }
    lastDigits = d;
    if (d) { fPhone.value = maskPhone(d); }
    else if (!deleting && /^\s*\+7?\s*$/.test(raw)) { fPhone.value = raw.trim(); }
    else { fPhone.value = ''; }
    clearError(fPhone);
  });
  fName.addEventListener('input', function () { clearError(fName); });

  /* ===== Проверка и отправка ===== */
  var form = $('#order-form');
  function errEl(el) { return document.getElementById('e-' + el.id.replace('f-', '')); }
  function setError(el, text) {
    var e = errEl(el);
    el.setAttribute('aria-invalid', 'true');
    if (e) { e.textContent = text; el.setAttribute('aria-describedby', e.id); }
  }
  function clearError(el) {
    var e = errEl(el);
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
    if (e) e.textContent = '';
  }
  function clearCartError() { $('#e-cart').textContent = ''; }
  function validate() {
    var first = null;
    function bad(el, t) { setError(el, t); if (!first) first = el; }
    [fName, fPhone, fTime].forEach(clearError);
    clearCartError();
    if (cartCount() === 0) { $('#e-cart').textContent = 'Добавьте в заказ хотя бы одну позицию.'; first = cartEmpty; cartEmpty.setAttribute('tabindex', '-1'); }
    if (fName.value.trim().length < 2) bad(fName, 'Введите имя, чтобы мы знали, как к вам обратиться.');
    if (digitsOf(fPhone.value).length !== 10) bad(fPhone, 'Введите телефон полностью: 10 цифр после +7.');
    if (!fTime.value) bad(fTime, 'Выберите время, когда заберёте заказ.');
    return first;
  }
  function whenText() {
    var now = shopNow(), day = currentDay();
    var label = day === 'today' ? 'сегодня (' + dayLabel(now, 0) + ')' : 'завтра (' + dayLabel(now, 1) + ')';
    return label + ', ' + (fTime.value === 'asap' ? 'как можно скорее, через ~15 минут' : fTime.value);
  }
  function buildMessage() {
    var lines = [
      'Здравствуйте! Заказ с сайта ' + CONFIG.shopName + '.',
      '',
      'Заберу: ' + whenText(),
      'Имя: ' + fName.value.trim(),
      'Телефон: ' + fPhone.value,
      '',
      'Заказ:'
    ];
    cart.forEach(function (it) {
      lines.push('— ' + it.title + (it.detail ? ' (' + it.detail + ')' : '') + (it.qty > 1 ? ' ×' + it.qty : '') + ' — ' + rub(it.price * it.qty));
    });
    lines.push('Итого: ' + rub(cartSum()) + ', оплата на кассе');
    var c = fComment.value.trim();
    if (c) lines.push('', 'Комментарий: ' + c);
    return lines.join('\n').replace(/ /g, ' ');
  }

  var done = $('#done');
  var copyState = $('#copy-state');
  function copyText(text, onOk, onFail) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var good = false;
      try { good = document.execCommand('copy'); } catch (e) { good = false; }
      document.body.removeChild(ta);
      if (good) onOk(); else onFail();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onOk, fallback);
    } else { fallback(); }
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = validate();
    if (bad) { bad.focus(); return; }
    var text = buildMessage();
    $('#done-text').textContent = text;
    $('#tg-link').href = 'https://t.me/' + CONFIG.telegram;
    $('#wa-link').href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text);
    copyState.textContent = '';
    done.hidden = false;
    done.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    copyText(text,
      function () { copyState.textContent = 'Текст скопирован. В Telegram вставьте его в чат (Ctrl+V или долгое нажатие).'; },
      function () { copyState.textContent = 'Скопируйте текст кнопкой выше и отправьте его в чат.'; });
  });
  $('#copy-btn').addEventListener('click', function () {
    copyText($('#done-text').textContent,
      function () { copyState.textContent = 'Текст скопирован. Вставьте его в чат.'; },
      function () { copyState.textContent = 'Не удалось скопировать. Выделите текст выше и скопируйте вручную.'; });
  });

  /* ===== Контакты и старт ===== */
  $('#c-tg').href = 'https://t.me/' + CONFIG.telegram;
  $('#c-wa').href = 'https://wa.me/' + CONFIG.whatsapp;
  var y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());
  renderCart();
  fillTimes();
  updateOpen();
  setInterval(function () { fillTimes(); updateOpen(); }, 60000);
})();
