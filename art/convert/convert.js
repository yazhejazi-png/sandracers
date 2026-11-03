/* Photo -> art style, 100% in the browser. No fetch, no upload, no storage:
   the photo is decoded to a canvas, filtered, and only saved if the user taps Save. */
(() => {
  const EN = document.documentElement.lang === "en";
  const L = (ar, en) => (EN ? en : ar);
  const MAX = 1000;
  const $ = id => document.getElementById(id);
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  /* ---------- helpers ---------- */
  const lumaOf = (d, n) => { const g = new Float32Array(n); for (let i = 0; i < n; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; return g; };
  function boxBlur(src, w, h, r) {
    const tmp = new Float32Array(src.length), out = new Float32Array(src.length), k = 2 * r + 1;
    for (let y = 0; y < h; y++) { let s = 0; const o = y * w;
      for (let x = -r; x <= r; x++) s += src[o + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) { tmp[o + x] = s / k; s += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)]; } }
    for (let x = 0; x < w; x++) { let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) { out[y * w + x] = s / k; s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
    return out;
  }
  function edges(g, w, h) {
    const e = new Float32Array(g.length);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1] + g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1];
      const gy = -g[i - w - 1] - 2 * g[i - w] - g[i - w + 1] + g[i + w - 1] + 2 * g[i + w] + g[i + w + 1];
      e[i] = Math.min(1, Math.hypot(gx, gy) / 255);
    }
    return e;
  }
  function gradMap(t, stops) { // t 0..1, stops array of [r,g,b]
    const p = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1), i = Math.floor(p), f = p - i;
    const a = stops[i], b = stops[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  function levels(t, n) { return Math.min(n - 1, Math.max(0, Math.floor(t * n))); }
  function kuwahara(d, w, h, r) {
    const W = w + 1, size = W * (h + 1);
    const sR = new Float64Array(size), sG = new Float64Array(size), sB = new Float64Array(size), sL = new Float64Array(size), sQ = new Float64Array(size);
    for (let y = 0; y < h; y++) { let a = 0, b = 0, c = 0, l = 0, q = 0;
      for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, lu = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        a += d[i]; b += d[i + 1]; c += d[i + 2]; l += lu; q += lu * lu;
        const j = (y + 1) * W + x + 1, u = y * W + x + 1;
        sR[j] = sR[u] + a; sG[j] = sG[u] + b; sB[j] = sB[u] + c; sL[j] = sL[u] + l; sQ[j] = sQ[u] + q; } }
    const rect = (T, x0, y0, x1, y1) => T[(y1 + 1) * W + x1 + 1] - T[y0 * W + x1 + 1] - T[(y1 + 1) * W + x0] + T[y0 * W + x0];
    const out = new Uint8ClampedArray(d.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let best = 1e18, br = 0, bg = 0, bb = 0;
      for (let q = 0; q < 4; q++) {
        const x0 = Math.max(0, q & 1 ? x : x - r), x1 = Math.min(w - 1, q & 1 ? x + r : x);
        const y0 = Math.max(0, q & 2 ? y : y - r), y1 = Math.min(h - 1, q & 2 ? y + r : y);
        const n = (x1 - x0 + 1) * (y1 - y0 + 1), mL = rect(sL, x0, y0, x1, y1) / n;
        const v = rect(sQ, x0, y0, x1, y1) / n - mL * mL;
        if (v < best) { best = v; br = rect(sR, x0, y0, x1, y1) / n; bg = rect(sG, x0, y0, x1, y1) / n; bb = rect(sB, x0, y0, x1, y1) / n; }
      }
      const i = (y * w + x) * 4; out[i] = br; out[i + 1] = bg; out[i + 2] = bb; out[i + 3] = 255;
    }
    return out;
  }
  const paint = (img, fn) => { const d = img.data, n = img.width * img.height; for (let k = 0; k < n; k++) { const c = fn(k); d[k * 4] = c[0]; d[k * 4 + 1] = c[1]; d[k * 4 + 2] = c[2]; d[k * 4 + 3] = 255; } };
  const contrast = (v, c) => (v - 128) * c + 128;
  const sat = (r, g, b, s) => { const l = 0.299 * r + 0.587 * g + 0.114 * b; return [l + (r - l) * s, l + (g - l) * s, l + (b - l) * s]; };

  /* ---------- styles ---------- */
  const DUNE = ["#291C13", "#A65E22", "#D48741", "#FDBF6A", "#FBF3E6"].map(hex);
  const STYLES = [
    { id: "dune", ar: "ألوان الكثبان", en: "Dune colours", run(img) {
      const d = img.data, n = img.width * img.height, g = lumaOf(d, n);
      paint(img, k => gradMap(Math.min(1, Math.max(0, (g[k] - 20) / 215)), DUNE)); } },
    { id: "sketch", ar: "دفتر الرسم", en: "Notebook sketch", run(img) {
      const w = img.width, h = img.height, n = w * h, g = boxBlur(lumaOf(img.data, n), w, h, 1), e = edges(g, w, h), paper = hex("#E9D8B4"), ink = hex("#5A3A1E");
      paint(img, k => { const t = Math.min(1, e[k] * 3.2 + Math.max(0, (150 - g[k]) / 400) * (((k % img.width) + Math.floor(k / img.width)) % 5 === 0 ? 1.6 : 0.4));
        return [paper[0] + (ink[0] - paper[0]) * t, paper[1] + (ink[1] - paper[1]) * t, paper[2] + (ink[2] - paper[2]) * t]; }); } },
    { id: "stencil", ar: "المجهول (ستنسل)", en: "The Unknown (stencil)", run(img) {
      const n = img.width * img.height, g = boxBlur(lumaOf(img.data, n), img.width, img.height, 1), paper = hex("#F3EBDD"), mid = hex("#D48741"), blk = hex("#15110D");
      paint(img, k => (g[k] < 85 ? blk : g[k] < 165 ? mid : paper)); } },
    { id: "pop", ar: "بوب آرت", en: "Pop art", run(img) {
      const w = img.width, n = w * img.height, g = lumaOf(img.data, n), pal = ["#1B1B3A", "#E63946", "#FFD23F", "#F7F3E8"].map(hex), cell = Math.max(6, Math.round(w / 110));
      paint(img, k => { const t = levels(g[k] / 255, 4), x = k % w, y = (k / w) | 0, dx = (x % cell) - cell / 2, dy = (y % cell) - cell / 2;
        const dot = Math.hypot(dx, dy) < cell * 0.3 * (1.2 - g[k] / 255) * 1.6; return t === 2 && dot ? pal[1] : pal[t]; }); } },
    { id: "gold", ar: "الذهبي (فسيفساء)", en: "Golden mosaic", run(img) {
      const w = img.width, h = img.height, n = w * h, g = lumaOf(img.data, n), T = Math.max(6, Math.round(w / 90)), stops = ["#1E140D", "#6B4417", "#C8962E", "#F2D27A", "#FFF4D0"].map(hex), tile = new Float32Array(n);
      for (let ty = 0; ty < h; ty += T) for (let tx = 0; tx < w; tx += T) { let s = 0, c = 0;
        for (let y = ty; y < Math.min(h, ty + T); y++) for (let x = tx; x < Math.min(w, tx + T); x++) { s += g[y * w + x]; c++; }
        const m = s / c; for (let y = ty; y < Math.min(h, ty + T); y++) for (let x = tx; x < Math.min(w, tx + T); x++) tile[y * w + x] = m; }
      paint(img, k => { const x = k % w, y = (k / w) | 0; if (x % T === 0 || y % T === 0) return stops[0]; const sh = 1 - 0.18 * (((x % T) + (y % T)) / (2 * T));
        const c = gradMap(tile[k] / 255, stops); return [c[0] * sh, c[1] * sh, c[2] * sh]; }); } },
    { id: "wave", ar: "موجة الرمل", en: "Sand wave", run(img) {
      const w = img.width, h = img.height, n = w * h, g = boxBlur(lumaOf(img.data, n), w, h, 1), e = edges(g, w, h), pal = ["#0B1D3A", "#1F4E79", "#73B2D5", "#F3EAD3"].map(hex);
      paint(img, k => (e[k] > 0.22 ? pal[0] : pal[levels(g[k] / 255, 4)])); } },
    { id: "oil", ar: "زيتي", en: "Oil paint", run(img) {
      const r = Math.max(3, Math.round(img.width / 220)), o = kuwahara(img.data, img.width, img.height, r), d = img.data;
      for (let i = 0; i < d.length; i += 4) { const c = sat(o[i], o[i + 1], o[i + 2], 1.35); d[i] = contrast(c[0], 1.1); d[i + 1] = contrast(c[1], 1.1); d[i + 2] = contrast(c[2], 1.1); } } },
    { id: "anime", ar: "أنمي", en: "Anime", run(img) {
      // cel shading: flat smoothed colour, 4 light bands that keep the hue, thin clean ink lines
      const w = img.width, h = img.height, n = w * h, o = kuwahara(img.data, w, h, 3), d = img.data, L = lumaOf(o, n);
      const lines = edges(boxBlur(L, w, h, 1), w, h), bands = [0.2, 0.42, 0.68, 0.9];
      for (let k = 0; k < n; k++) { const i = k * 4, l = Math.max(8, L[k]) / 255;
        let q = bands[3]; for (let b = 0; b < 3; b++) if (l < (bands[b] + bands[b + 1]) / 2) { q = bands[b]; break; }
        const f = q / l, c = sat(o[i] * f, o[i + 1] * f, o[i + 2] * f, 1.3);
        if (lines[k] > 0.16) { d[i] = 38; d[i + 1] = 26; d[i + 2] = 30; }
        else { d[i] = Math.min(255, c[0] + 10); d[i + 1] = Math.min(255, c[1] + 8); d[i + 2] = Math.min(255, c[2] + 6); } } } },
    { id: "davinci", ar: "دافنشي (دفتر الرسم)", en: "Da Vinci notebook", run(img) {
      const w = img.width, h = img.height, n = w * h, g = boxBlur(lumaOf(img.data, n), w, h, 1), e = edges(g, w, h), paper = hex("#E8D5AA"), ink = hex("#5E2F1B");
      paint(img, k => { const x = k % w, y = (k / w) | 0, T = Math.max(3, Math.round(w / 260)); let t = Math.min(1, e[k] * 3.5);
        if (g[k] < 185 && ((x + y) % (T * 2)) < T * 0.7) t = Math.max(t, 0.55 * (1 - g[k] / 185) + 0.25);
        if (g[k] < 115 && ((x - y + 4000) % (T * 2)) < T * 0.7) t = Math.max(t, 0.8);
        const v = 1 - 0.12 * Math.hypot(x / w - 0.5, y / h - 0.5) * 2;
        return [(paper[0] + (ink[0] - paper[0]) * t) * v, (paper[1] + (ink[1] - paper[1]) * t) * v, (paper[2] + (ink[2] - paper[2]) * t) * v]; }); } },
    { id: "vangogh", ar: "فان غوخ", en: "Van Gogh", run(img) {
      const w = img.width, h = img.height, n = w * h, src = new Uint8ClampedArray(img.data), g = boxBlur(lumaOf(src, n), w, h, 5);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const c = cv.getContext("2d");
      const base = kuwahara(src, w, h, 4); c.putImageData(new ImageData(base, w, h), 0, 0);
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const len = Math.max(10, Math.round(w / 60)), lw = Math.max(3, Math.round(w / 220)), count = Math.round(n / (len * lw) * 2.2);
      c.lineCap = "round";
      for (let s = 0; s < count; s++) { const x = (rnd() * w) | 0, y = (rnd() * h) | 0, k = y * w + x;
        const gx = g[Math.min(n - 1, k + 1)] - g[Math.max(0, k - 1)], gy = g[Math.min(n - 1, k + w)] - g[Math.max(0, k - w)];
        const a = (Math.abs(gx) + Math.abs(gy) > 1.5 ? Math.atan2(gy, gx) + Math.PI / 2 : 0) + 0.9 * Math.sin(x / (w / 9)) * Math.cos(y / (w / 9));
        const i = k * 4, cc = sat(src[i], src[i + 1], src[i + 2], 1.5), j = (rnd() - 0.5) * 26;
        c.strokeStyle = `rgb(${Math.max(0, Math.min(255, contrast(cc[0], 1.15) + j))|0},${Math.max(0, Math.min(255, contrast(cc[1], 1.15) + j))|0},${Math.max(0, Math.min(255, contrast(cc[2], 1.15) + j))|0})`;
        c.lineWidth = lw * (0.7 + rnd() * 0.8); c.beginPath(); c.moveTo(x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2); c.lineTo(x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2); c.stroke(); }
      img.data.set(c.getImageData(0, 0, w, h).data); } },
    { id: "street", ar: "بانكسي (ستنسل)", en: "Banksy stencil", run(img) {
      const w = img.width, h = img.height, n = w * h, d = img.data, g = boxBlur(lumaOf(d, n), w, h, 1), loc = boxBlur(g, w, h, Math.max(12, w >> 5));
      const paper = hex("#EDE6D6"), grey = hex("#8E8A82"), blk = hex("#14110F"), red = hex("#D6322B"); let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let k = 0; k < n; k++) { const i = k * 4, r = d[i], gg = d[i + 1], b = d[i + 2], t = g[k] - loc[k] * 0.55 - 40;
        let c = t < -18 ? blk : t < 30 ? grey : paper;
        if (c === grey && r > gg * 1.35 && r > b * 1.35) c = red;
        const sp = rnd() < 0.012 ? 28 : 0; d[i] = Math.max(0, c[0] - sp); d[i + 1] = Math.max(0, c[1] - sp); d[i + 2] = Math.max(0, c[2] - sp); } } },
    { id: "hokusai", ar: "الموجة العظيمة", en: "The Great Wave", run(img) {
      const w = img.width, h = img.height, n = w * h, g = boxBlur(lumaOf(img.data, n), w, h, 2), e = edges(g, w, h), T = Math.max(7, Math.round(w / 90));
      const pal = ["#0E2447", "#1B4A82", "#4A86B8", "#A9CBDD", "#F1E7CC"].map(hex);
      paint(img, k => { const x = k % w, y = (k / w) | 0; let l = levels(g[k] / 255, 5);
        if (l === 2 || l === 3) { const wv = Math.sin((x + 2 * Math.sin(y / T)) / T * 1.4 + y / (T * 3)); if (wv > 0.55) l -= 1; }
        return e[k] > 0.2 ? pal[0] : pal[l]; }); } },
    { id: "klimt", ar: "كليمت", en: "Klimt", run(img) {
      const w = img.width, h = img.height, n = w * h, d = img.data, T = Math.max(8, Math.round(w / 70)), gold = ["#2A1B08", "#8A5F14", "#D4A72C", "#F4D77A"].map(hex), L = lumaOf(d, n);
      for (let ty = 0; ty < h; ty += T) for (let tx = 0; tx < w; tx += T) { let r = 0, g = 0, b = 0, c = 0, l = 0;
        for (let y = ty; y < Math.min(h, ty + T); y++) for (let x = tx; x < Math.min(w, tx + T); x++) { const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; l += L[y * w + x]; c++; }
        r /= c; g /= c; b /= c; l /= c * 255; const sc = sat(r * 1.15, g * 1.1, b * 1.0, 1.6), gc = gradMap(l, gold), kind = Math.floor(((Math.sin(tx * 12.9 + ty * 78.2) * 43758.5) % 1 + 1) % 1 * 6), mix = kind < 2 ? 0.35 : 0.8;
        for (let y = ty; y < Math.min(h, ty + T); y++) for (let x = tx; x < Math.min(w, tx + T); x++) { const i = (y * w + x) * 4, ux = x - tx - T / 2, uy = y - ty - T / 2, rr = Math.hypot(ux, uy), ring = kind === 0 ? Math.abs(rr - T * 0.32) < T * 0.09 : kind === 1 ? rr < T * 0.2 : false;
          const edge = (x - tx === 0 || y - ty === 0) ? 0.7 : 1;
          for (let ch = 0; ch < 3; ch++) d[i + ch] = (ring ? gold[3][ch] : gc[ch] * (1 - mix) + sc[ch] * mix) * edge; } } } },
    { id: "blocks", ar: "مكعبات", en: "Blocks", run(img) {
      const w = img.width, h = img.height, B = Math.max(8, Math.round(w / 64)), d = img.data;
      for (let ty = 0; ty < h; ty += B) for (let tx = 0; tx < w; tx += B) { let r = 0, g = 0, b = 0, c = 0;
        for (let y = ty; y < Math.min(h, ty + B); y++) for (let x = tx; x < Math.min(w, tx + B); x++) { const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; c++; }
        r = Math.round(r / c / 48) * 48; g = Math.round(g / c / 48) * 48; b = Math.round(b / c / 48) * 48;
        for (let y = ty; y < Math.min(h, ty + B); y++) for (let x = tx; x < Math.min(w, tx + B); x++) { const i = (y * w + x) * 4, edge = (x - tx === 0 || y - ty === 0) ? 0.82 : 1;
          d[i] = r * edge; d[i + 1] = g * edge; d[i + 2] = b * edge; } } } },
  ];

  /* ---------- UI ---------- */
  const out = $("out"), ctx = out.getContext("2d", { willReadFrequently: true }), box = $("styles"), dl = $("dl"), hint = $("hint");
  let source = null, current = STYLES[0];

  function render() {
    if (!source) return;
    out.classList.add("busy");
    setTimeout(() => { // let the "busy" state paint first
      ctx.drawImage(source, 0, 0, out.width, out.height);
      const img = ctx.getImageData(0, 0, out.width, out.height);
      current.run(img); ctx.putImageData(img, 0, 0);
      out.classList.remove("busy"); dl.disabled = false;
      out.setAttribute("aria-label", L(current.ar, current.en));
    }, 20);
  }
  function pick(s) { current = s; [...box.children].forEach(b => b.setAttribute("aria-pressed", b.dataset.id === s.id ? "true" : "false")); render(); }
  STYLES.forEach(s => { const b = document.createElement("button"); b.type = "button"; b.dataset.id = s.id; b.textContent = L(s.ar, s.en); b.setAttribute("aria-pressed", s === current ? "true" : "false"); b.onclick = () => pick(s); box.appendChild(b); });

  async function load(file) {
    if (!file || !file.type.startsWith("image/")) return;
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) { hint.textContent = L("ما قدرت أفتح الصورة.", "Could not open that picture."); return; }
    const sc = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
    out.width = Math.round(bmp.width * sc); out.height = Math.round(bmp.height * sc);
    source = document.createElement("canvas"); source.width = out.width; source.height = out.height;
    source.getContext("2d").drawImage(bmp, 0, 0, out.width, out.height); bmp.close && bmp.close();
    hint.hidden = true; render();
  }
  $("file").addEventListener("change", e => { load(e.target.files[0]); e.target.value = ""; });
  const drop = $("drop");
  ["dragover", "dragenter"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); }));
  drop.addEventListener("drop", e => { e.preventDefault(); load(e.dataTransfer.files[0]); });
  dl.addEventListener("click", () => out.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "sand-racers-" + current.id + ".png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, "image/png"));

  /* language */
  if (EN) { document.querySelectorAll("[data-en]").forEach(n => { n.textContent = n.dataset.en; }); $("lang").textContent = "عربي"; }
  $("lang").addEventListener("click", () => { try { localStorage.setItem("sr-lang", EN ? "ar" : "en"); } catch (e) {} location.reload(); });
})();
