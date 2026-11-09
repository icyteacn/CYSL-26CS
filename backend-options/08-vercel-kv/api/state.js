// Vercel Serverless Function：GET 读 / PUT 写单 JSON 文档（Vercel KV 存）
// 依赖：项目里 `npm i @vercel/kv`，控制台建 KV 库并 Connect 到本项目
import { kv } from '@vercel/kv';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Write-Token',
};

export default async function handler(req, res) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const doc = await kv.get('doc');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=30');
    return res.status(200).send(doc ? JSON.stringify(doc) : '{}');
  }

  if (req.method === 'PUT') {
    if (req.headers['x-write-token'] !== process.env.WRITE_TOKEN)
      return res.status(403).send('forbidden');
    const prev = await kv.get('doc');
    if (prev) await kv.set('doc.prev', prev);
    await kv.set('doc', req.body);
    await kv.set('updatedAt', new Date().toISOString());
    return res.status(200).json({ ok: true });
  }

  res.status(404).send('not found');
}
