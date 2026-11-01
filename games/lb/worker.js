// Cloudflare Worker + KV (free plan). Bind a KV namespace named SCORES. Anonymous: stores only a random player id and a number.
const BOARDS = { 'dune:habtain': 'asc', 'dune:zarqa': 'asc', 'dune:habba': 'asc', 'zarqa:s1': 'desc', 'zarqa:s2': 'desc', 'zarqa:s3': 'desc', 'zarqa:s4': 'desc' };
const LIM = { asc: [20, 600], desc: [1, 400000] }; // sane range so fake values are dropped
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'content-type': 'application/json' };
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: cors });
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (u.pathname === '/top') {
      const b = u.searchParams.get('board'); if (!BOARDS[b]) return J({ error: 'board' }, 400);
      const d = (await env.SCORES.get(b, 'json')) || [];
      return J({ top: d.slice(0, 10).map(e => ({ pid: e.pid, v: e.v, tag: e.pid.slice(0, 3).toUpperCase() })) });
    }
    if (u.pathname === '/submit' && req.method === 'POST') {
      let x; try { x = await req.json(); } catch (e) { return J({ error: 'json' }, 400); }
      const dir = BOARDS[x.board], v = +x.v, pid = String(x.pid || '').slice(0, 16);
      if (!dir || !pid || !(v >= LIM[dir][0] && v <= LIM[dir][1])) return J({ error: 'bad' }, 400);
      let d = (await env.SCORES.get(x.board, 'json')) || [];
      const i = d.findIndex(e => e.pid === pid);
      if (i >= 0) { if (dir === 'asc' ? v < d[i].v : v > d[i].v) d[i].v = v; } else d.push({ pid, v });
      d.sort((a, b) => dir === 'asc' ? a.v - b.v : b.v - a.v);
      await env.SCORES.put(x.board, JSON.stringify(d.slice(0, 100)));
      return J({ ok: true });
    }
    return J({ error: 'nf' }, 404);
  }
};
