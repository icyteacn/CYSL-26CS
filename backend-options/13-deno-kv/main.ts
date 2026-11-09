// Deno Deploy：GET/PUT /state（Deno KV 存）
// 部署：deployctl deploy --project=xxx main.ts
// 环境变量：WRITE_TOKEN=支委口令
const kv = await Deno.openKv();
const TOKEN = Deno.env.get('WRITE_TOKEN');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Write-Token',
};

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  if (url.pathname === '/state' && req.method === 'GET') {
    const doc = await kv.get(['doc']);
    return new Response(doc.value ? JSON.stringify(doc.value) : '{}', {
      headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8',
                 'Cache-Control': 'public, max-age=30' },
    });
  }

  if (url.pathname === '/state' && req.method === 'PUT') {
    if (req.headers.get('x-write-token') !== TOKEN)
      return new Response('forbidden', { status: 403, headers: cors });
    const body = await req.text();
    if (body.length > 1_000_000)
      return new Response('too large', { status: 413, headers: cors });
    const prev = await kv.get(['doc']);
    if (prev.value) await kv.set(['doc.prev'], prev.value);
    await kv.set(['doc'], JSON.parse(body));
    await kv.set(['updatedAt'], new Date().toISOString());
    return new Response('{"ok":true}', { headers: cors });
  }

  return new Response('not found', { status: 404, headers: cors });
});
