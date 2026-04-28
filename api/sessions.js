const { redis, KEYS, checkAdmin } = require('./_redis')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-password')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const raw = await redis.get(KEYS.sessions)
    return res.json(raw || [])
  }

  if (req.method === 'POST') {
    if (!checkAdmin(req)) return res.status(401).json({ error: '인증 필요' })
    const session = req.body
    const sessions = (await redis.get(KEYS.sessions)) || []
    sessions.push(session)
    await redis.set(KEYS.sessions, sessions)
    return res.json(session)
  }

  if (req.method === 'DELETE') {
    if (!checkAdmin(req)) return res.status(401).json({ error: '인증 필요' })
    const { id } = req.body || {}
    const sessions = (await redis.get(KEYS.sessions)) || []
    await redis.set(KEYS.sessions, sessions.filter(s => s.id !== id))
    const bookings = (await redis.get(KEYS.bookings)) || []
    await redis.set(KEYS.bookings, bookings.filter(b => b.sessionId !== id))
    return res.json({ ok: true })
  }

  res.status(405).end()
}
