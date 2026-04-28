module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  let body = req.body
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}') } catch { body = {} }
  }

  const { password } = body || {}
  const adminPw = process.env.ADMIN_PASSWORD

  if (!adminPw) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.' })
  }
  if (String(password).trim() === String(adminPw).trim()) {
    return res.json({ ok: true })
  }
  return res.status(401).json({ error: '비밀번호가 틀렸습니다.' })
}
