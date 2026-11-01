# Shared high scores
- `lb.js`: client used by games/dune, games/zarqa, games/zarqa-wide. 🏆 button, tabs per car / stage, 🔄 refresh. Anonymous (random id, no names).
- `worker.js`: Cloudflare Worker + KV (free plan). Deploy, bind KV as `SCORES`, then set `ENDPOINT` at the top of `lb.js`.
- Until ENDPOINT is set the panel shows only the player's own best on that device.
- Open any game once with `#yaz-seed` in the URL to load YAZ's screenshot scores (dune:habtain 1:22.1, dune:zarqa 1:29.6, zarqa:s4 24,710). The 23,150 and 1:42.0 were earlier, lower records.
- Boards: dune:habtain|zarqa|habba (fastest time), zarqa:s1..s4 (highest score).
