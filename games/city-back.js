/* «مدينة ساند ريسرز 3D»: when a game was opened from a gate of the city (?city=1), a small button takes you back to the same gate. */
(function () {
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('city') !== '1') return;
    var m = location.pathname.match(/\/games\/([^\/]+)\//);
    if (!m) return;
    var a = document.createElement('a');
    a.href = '/games/city-3d/?from=' + encodeURIComponent(m[1]);
    a.textContent = '🏙 رجوع للمدينة';
    a.setAttribute('style', 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483000;padding:8px 16px;border-radius:999px;background:rgba(14,20,48,.86);color:#fff;font:700 14px/1 Tahoma,Arial,sans-serif;text-decoration:none;border:2px solid rgba(255,255,255,.45);box-shadow:0 3px 12px rgba(0,0,0,.4)');
    document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(a); });
    if (document.readyState !== 'loading') document.body.appendChild(a);
  } catch (e) { /* no button */ }
})();
