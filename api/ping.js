// 의존성 없는 헬스체크 — /api/ping 접속 시 {"ok":true} 가 나오면 API 라우팅 정상
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json({ ok: true, time: new Date().toISOString(), message: 'API 라우팅 정상' })
}
