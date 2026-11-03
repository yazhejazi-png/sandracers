/* footer.js (3 Nov 2026): the shared social footer. Hand-written: edit it freely.
   Yazeed, 3 Nov 03:20Z: Instagram, TikTok and YouTube, each one with the account's logo and the platform's logo side by side,
   always the very last thing at the bottom of every page, and never moving when new things are added.
   How it works: every page loads this one file (<script src="/theme/footer.js" defer></script>). It puts the footer at the end of <body>
   and puts it back at the end if anything is ever added after it, so the footer is the last thing whatever a page grows into.
   Colours come from the page's theme tokens (--fg, --line, --focus) and the logo is the cut-out one in the tone of the theme (light or dark file),
   so it follows the colour the visitor picked. A NEW page must add the same script tag. Game play pages (/games/<name>/) are full-screen
   apps and do not load it; the Games page itself does. The accounts: one list below, nothing else to edit. */
(function () {
  'use strict';
  if (window.__srFooter) return;
  window.__srFooter = true;
  var d = document;
  var EN = (d.documentElement.lang || '').toLowerCase().indexOf('en') === 0;

  var ACCOUNTS = [
    { id: 'instagram', href: 'https://www.instagram.com/sand_racers/', ar: 'إنستقرام', en: 'Instagram', handle: '@sand_racers' },
    { id: 'tiktok', href: 'https://www.tiktok.com/@sand_racers', ar: 'تيك توك', en: 'TikTok', handle: '@sand_racers' },
    { id: 'youtube', href: 'https://www.youtube.com/@Sand_Racer', ar: 'يوتيوب', en: 'YouTube', handle: '@Sand_Racer' }
  ];

  /* the platform marks, one colour (the page's text colour), drawn on a 24 x 24 grid */
  var GLYPH = {
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5.2"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" stroke="none"/>',
    tiktok: '<path d="M14.3 3.2v10.6a3.9 3.9 0 1 1-3.9-3.9"/><path d="M14.3 3.2c.35 2.6 2.1 4.4 5.2 4.7"/>',
    youtube: '<rect x="2.2" y="5.2" width="19.6" height="13.6" rx="4"/><path d="M10 9.2v5.6l5-2.8z" fill="currentColor" stroke-width="1.2"/>'
  };

  var CSS =
    '#sr-social{box-sizing:border-box;display:block;clear:both;width:100%;margin:0;padding:14px 8px;' +
    'border-top:1px solid var(--line,#E6D0AE);background:transparent;color:var(--fg,var(--ink,#291C13));direction:ltr;text-align:center}' +
    '#sr-social .srf-row{display:flex;justify-content:center;align-items:center;flex-wrap:nowrap;gap:clamp(0px,1.5vw,12px)}' +
    '#sr-social a{display:inline-flex;align-items:center;gap:9px;box-sizing:border-box;min-height:48px;padding:6px 12px;border-radius:12px;color:inherit;' +
    'text-decoration:none;-webkit-tap-highlight-color:transparent;transition:opacity .15s}' +
    '#sr-social a:hover{opacity:.75}' +
    '#sr-social a:focus-visible{outline:2px solid var(--focus,currentColor);outline-offset:2px}' +
    '#sr-social .srf-mk{display:block;flex:none;width:36px;height:auto}' +
    '#sr-social .srf-d{display:none}' +
    '#sr-social .srf-dv{display:block;flex:none;width:1px;height:26px;background:var(--line,currentColor)}' +
    '#sr-social .srf-pf{display:block;flex:none;width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    ':root[data-theme="dark"] #sr-social .srf-l{display:none}' +
    ':root[data-theme="dark"] #sr-social .srf-d{display:block}' +
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #sr-social .srf-l{display:none}:root:not([data-theme="light"]) #sr-social .srf-d{display:block}}' +
    '@media (max-width:420px){#sr-social a{gap:7px;padding:6px 8px}#sr-social .srf-mk{width:32px}#sr-social .srf-pf{width:25px;height:25px}#sr-social .srf-dv{height:22px}}' +
    '@media (max-width:340px){#sr-social{padding-inline:2px}#sr-social a{gap:5px;padding:6px 5px}#sr-social .srf-mk{width:28px}#sr-social .srf-pf{width:22px;height:22px}}' +
    '@media print{#sr-social{display:none}}';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  function build() {
    var st = d.createElement('style');
    st.id = 'sr-social-css';
    st.textContent = CSS;
    (d.head || d.documentElement).appendChild(st);

    var nav = d.createElement('nav');
    nav.id = 'sr-social';
    nav.setAttribute('aria-label', EN ? 'Follow Sand Racers' : 'تابع ساند ريسرز');
    var h = '<div class="srf-row">';
    for (var i = 0; i < ACCOUNTS.length; i++) {
      var a = ACCOUNTS[i];
      var name = (EN ? a.en : a.ar) + ': ' + a.handle;
      h += '<a href="' + esc(a.href) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(name) + '" title="' + esc(name) + '" data-platform="' + a.id + '">' +
        '<img class="srf-mk srf-l" src="/img/social/mark-light.webp" width="36" height="37" alt="" draggable="false">' +
        '<img class="srf-mk srf-d" src="/img/social/mark-dark.webp" width="36" height="37" alt="" draggable="false">' +
        '<span class="srf-dv" aria-hidden="true"></span>' +
        '<svg class="srf-pf" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + GLYPH[a.id] + '</svg>' +
        '</a>';
    }
    nav.innerHTML = h + '</div>';
    return nav;
  }

  function start() {
    var b = d.body;
    if (!b || d.getElementById('sr-social')) return;
    var el = build();
    b.appendChild(el);
    /* keep it the last thing on the page: if anything is added after it, move it back to the end.
       (If another script ever fights over the last place, stop after 30 moves a second instead of looping.) */
    if (!window.MutationObserver) return;
    var n = 0, t0 = Date.now();
    var mo = new MutationObserver(function () {
      if (b.lastElementChild === el) return;
      if (Date.now() - t0 > 1000) { t0 = Date.now(); n = 0; }
      if (++n > 30) { mo.disconnect(); return; }
      b.appendChild(el);
    });
    mo.observe(b, { childList: true });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start);
  else start();
})();
