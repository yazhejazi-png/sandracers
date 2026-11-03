/* Sand Racers leaderboard client. Anonymous: no names are sent or shown.
   ENDPOINT stays '' until the shared server is connected; then it works on its own. */
(function () {
  var ENDPOINT = ''; // e.g. 'https://sr-scores.<account>.workers.dev'
  var BOARDS = {
    dune: [['dune:habtain', 'حبتين', 'asc'], ['dune:zarqa', 'الزرقا', 'asc'], ['dune:habba', 'حبة ونص', 'asc']],
    zarqa: [['zarqa:s1', 'المرحلة ١', 'desc'], ['zarqa:s2', 'المرحلة ٢', 'desc'], ['zarqa:s3', 'المرحلة ٣', 'desc'], ['zarqa:s4', 'المرحلة ٤ · جدة ليل', 'desc']]
  };
  var GAMES = { dune: 'أول مرة أغرز', zarqa: 'الدوريات' };
  var game, cur, panel, ls = {
    get: function (k, d) { try { var v = localStorage.getItem('sr-lb-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('sr-lb-' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var pid = ls.get('pid', null);
  if (!pid) { pid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); ls.set('pid', pid); }
  var fmtT = function (s) { var m = Math.floor(s / 60); return m + ':' + (s - m * 60 < 10 ? '0' : '') + (s - m * 60).toFixed(1); };
  var fmt = function (b, v) { return b[2] === 'asc' ? fmtT(v) : Math.round(v).toLocaleString('en-US'); };
  var better = function (b, a, c) { return b[2] === 'asc' ? a < c : a > c; };
  function find(id) { var l = BOARDS[game] || []; for (var i = 0; i < l.length; i++) if (l[i][0] === id) return l[i]; }

  function submit(id, v, extra) {
    var b = find(id) || (function () { for (var g in BOARDS) for (var i = 0; i < BOARDS[g].length; i++) if (BOARDS[g][i][0] === id) return BOARDS[g][i]; })();
    if (!b || !(v > 0)) return;
    var mine = ls.get('mine', {});
    if (!mine[id] || better(b, v, mine[id])) { mine[id] = v; ls.set('mine', mine); }
    if (ENDPOINT) try { fetch(ENDPOINT + '/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ board: id, pid: pid, v: v, x: extra || null }) }).catch(function () {}); } catch (e) {}
  }

  function css() {
    var s = document.createElement('style');
    s.textContent = '#sr-lb-btn{position:fixed;top:8px;inset-inline-start:8px;z-index:2147483600;font:700 14px/1 inherit;padding:9px 12px;border-radius:999px;border:1px solid #c9a37a;background:#2a1d14;color:#f2c98f;cursor:pointer}' +
      '#sr-lb{position:fixed;inset:0;z-index:2147483601;background:rgba(10,6,3,.78);display:flex;align-items:center;justify-content:center;direction:rtl}#sr-lb[hidden]{display:none}' +
      '#sr-lb .c{width:min(92vw,420px);max-height:86vh;overflow:auto;background:#241912;color:#f6e9d8;border:1px solid #6b4a30;border-radius:18px;padding:16px;font-family:inherit}' +
      '#sr-lb h3{margin:0 0 10px;font-size:18px}#sr-lb .t{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}' +
      '#sr-lb .t button,#sr-lb .a button{font:inherit;font-size:13px;padding:7px 11px;border-radius:999px;border:1px solid #6b4a30;background:#33241a;color:#f6e9d8;cursor:pointer}' +
      '#sr-lb .t button.on{background:#e8bb86;color:#2a1d14}#sr-lb ol{margin:0;padding:0;list-style:none}' +
      '#sr-lb li{display:flex;justify-content:space-between;padding:7px 4px;border-bottom:1px solid #3d2c20;font-variant-numeric:tabular-nums}#sr-lb li.me{color:#f2c98f;font-weight:800}' +
      '#sr-lb .n{opacity:.7;font-size:12px;margin:8px 0}#sr-lb .a{display:flex;gap:8px;margin-top:10px}';
    document.head.appendChild(s);
  }
  function ui() {
    css();
    var b = document.createElement('button'); b.id = 'sr-lb-btn'; b.type = 'button'; b.textContent = '🏆 الهاي سكور';
    b.onclick = open; document.body.appendChild(b);
    panel = document.createElement('div'); panel.id = 'sr-lb'; panel.hidden = true;
    panel.innerHTML = '<div class="c"><h3></h3><div class="t"></div><ol></ol><p class="n"></p><div class="a"><button type="button" data-r>🔄 تحديث</button><button type="button" data-x>إغلاق</button></div></div>';
    panel.querySelector('h3').textContent = '🏆 ' + GAMES[game];
    panel.querySelector('[data-x]').onclick = function () { panel.hidden = true; };
    panel.querySelector('[data-r]').onclick = load;
    panel.onclick = function (e) { if (e.target === panel) panel.hidden = true; };
    document.body.appendChild(panel);
    var t = panel.querySelector('.t');
    BOARDS[game].forEach(function (b) { var x = document.createElement('button'); x.type = 'button'; x.textContent = b[1]; x.dataset.id = b[0]; x.onclick = function () { cur = b[0]; load(); }; t.appendChild(x); });
  }
  function open() { panel.hidden = false; load(); }
  function row(ol, i, label, val, me) { var li = document.createElement('li'); if (me) li.className = 'me'; var a = document.createElement('span'), v = document.createElement('span'); a.textContent = (i ? i + '. ' : '') + label; v.textContent = val; li.appendChild(a); li.appendChild(v); ol.appendChild(li); }
  function load() {
    var b = find(cur), ol = panel.querySelector('ol'), n = panel.querySelector('.n');
    [].forEach.call(panel.querySelectorAll('.t button'), function (x) { x.classList.toggle('on', x.dataset.id === cur); });
    var mine = ls.get('mine', {})[cur];
    ol.innerHTML = '';
    if (!ENDPOINT) {
      n.textContent = 'الترتيب المشترك لسه ما انربط. هذا رقمك أنت على هذا الجهاز بس.';
      if (mine) row(ol, 0, 'رقمك', fmt(b, mine), true); else row(ol, 0, 'ما في رقم لسه', '—');
      return;
    }
    n.textContent = 'جاري التحميل…';
    fetch(ENDPOINT + '/top?board=' + encodeURIComponent(cur)).then(function (r) { return r.json(); }).then(function (d) {
      ol.innerHTML = ''; n.textContent = d.top.length ? 'أفضل ١٠ لاعبين (بدون أسماء)' : 'ما في أرقام لسه، كن أول واحد!';
      d.top.forEach(function (e, i) { row(ol, i + 1, e.pid === pid ? 'أنت' : 'لاعب ' + (e.tag || ''), fmt(b, e.v), e.pid === pid); });
      if (mine && !d.top.some(function (e) { return e.pid === pid; })) row(ol, 0, 'رقمك', fmt(b, mine), true);
    }).catch(function () { n.textContent = 'ما قدرت أوصل للسيرفر. جرّب التحديث.'; if (mine) row(ol, 0, 'رقمك', fmt(b, mine), true); });
  }

  // his own scores from screenshots, loaded once on his devices with #yaz-seed in the address
  function seed() {
    if (!/yaz-seed/.test(location.hash)) return;
    [['dune:habtain', 82.1], ['dune:zarqa', 89.6], ['zarqa:s4', 24710]].forEach(function (s) { submit(s[0], s[1]); });
  }
  window.SRLB = { init: function (g) { game = g; cur = BOARDS[g][0][0]; var go = function () { ui(); seed(); }; if (document.body) go(); else addEventListener('DOMContentLoaded', go); }, submit: submit };
})();
