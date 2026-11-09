/**
 * Cloudflare Worker：单 JSON 文档的读/写
 * 绑定：KV namespace 名为 STATE（wrangler.toml）
 * 密钥：wrangler secret put WRITE_TOKEN
 *
 * GET  /state   → 返回 JSON 文档（公开只读）
 * PUT  /state   → 写 JSON 文档（需要 X-Write-Token 头）
 * GET  /state/history → （可选）最近写入时间戳
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS：允许网页端跨域（支部是自己的域名，可再收紧成具体 origin）
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Write-Token',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    if (url.pathname === '/state' && request.method === 'GET') {
      const doc = await env.STATE.get('doc', { type: 'text' });
      return new Response(doc || '{}', {
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
      // 备份上一次（简单历史，可省）
      const prev = await env.STATE.get('doc', { type: 'text' });
      if (prev) await env.STATE.put('doc.prev', prev);
      await env.STATE.put('doc', body);
      await env.STATE.put('updatedAt', new Date().toISOString());
      return new Response('{"ok":true}', { headers: cors });
    }

    if (url.pathname === '/state/history') {
      return new Response(JSON.stringify({
        updatedAt: await env.STATE.get('updatedAt', { type: 'text' }),
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    return new Response('not found', { status: 404, headers: cors });
  },
};
