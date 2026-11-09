/**
 * Cloudflare Worker + D1：/state 单文档读写（与 02-KV 版 API 相同）
 * 绑定：D1 database 名为 DB（wrangler.toml）
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Write-Token',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    if (url.pathname === '/state' && request.method === 'GET') {
      const row = await env.DB.prepare('SELECT doc FROM state WHERE id=1').first();
      return new Response(row?.doc || '{}', {
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8',
                   'Cache-Control': 'public, max-age=30' },
      });
    }

    if (url.pathname === '/state' && request.method === 'PUT') {
      if (request.headers.get('X-Write-Token') !== env.WRITE_TOKEN)
        return new Response('forbidden', { status: 403, headers: cors });
      const body = await request.text();
      if (body.length > 1_000_000)
        return new Response('too large', { status: 413, headers: cors });
      // 备份旧版本到 history
      await env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS state_history (ts TEXT, doc TEXT)').run();
      const old = await env.DB.prepare('SELECT doc FROM state WHERE id=1').first();
      if (old) await env.DB.prepare(
        'INSERT INTO state_history (ts,doc) VALUES (?,?)')
        .bind(new Date().toISOString(), old.doc).run();
      await env.DB.prepare(
        `INSERT INTO state (id, doc, updated_at) VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET doc=excluded.doc, updated_at=excluded.updated_at`)
        .bind(body, new Date().toISOString()).run();
      return new Response('{"ok":true}', { headers: cors });
    }

    return new Response('not found', { status: 404, headers: cors });
  },
};
