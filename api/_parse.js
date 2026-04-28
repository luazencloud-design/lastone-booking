// body가 Content-Type 없이 오거나 string으로 올 경우를 대비한 파싱 헬퍼
function parseBody(req) {
  let body = req.body
  if (body && typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  return body || {}
}
module.exports = { parseBody }
