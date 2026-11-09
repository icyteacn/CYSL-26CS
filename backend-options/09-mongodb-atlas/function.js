// MongoDB Atlas App Services HTTPS Endpoint 函数（粘贴进 endpoint 编辑器）
// 路由：GET /state 读 / PUT /state 写（X-Write-Token）
// endpoint 选 "Return type: JSON"，鉴权按需开 API Key
exports = async function (payload) {
  const db = context.services.get('mongodb-atlas').db('cysl').collection('state');
  const { httpMethod, headers, body } = payload;
  const token = (headers['X-Write-Token'] || [])[0];

  if (httpMethod === 'GET') {
    const doc = await db.findOne({ _id: 1 });
    return { statusCode: 200, body: doc ? doc.doc : {} };
  }
  if (httpMethod === 'PUT') {
    if (token !== context.values.get('WRITE_TOKEN'))
      return { statusCode: 403, body: 'forbidden' };
    const data = JSON.parse(body.text());
    await db.updateOne({ _id: 1 },
      { $set: { doc: data, updated_at: new Date() } }, { upsert: true });
    return { statusCode: 200, body: { ok: true } };
  }
  return { statusCode: 404, body: 'not found' };
};
// 部署前：App Services → Values → 创建 Secret/Value 名 WRITE_TOKEN（支委口令）
