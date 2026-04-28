const { redis, KEYS, checkAdmin } = require('./_redis')
const { parseBody } = require('./_parse')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-password')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    if (!checkAdmin(req)) return res.status(401).json({ error: '인증 필요' })
    const raw = await redis.get(KEYS.bookings)
    return res.json(raw || [])
  }

  if (req.method === 'POST') {
    const booking = parseBody(req)
    const sessions = (await redis.get(KEYS.sessions)) || []
    const idx = sessions.findIndex(s => s.id === booking.sessionId)
    if (idx < 0) return res.status(404).json({ error: '세션을 찾을 수 없습니다.' })
    if (sessions[idx].bookedCount >= sessions[idx].capacity)
      return res.status(409).json({ error: '이미 마감된 세션입니다.' })

    sessions[idx].bookedCount += 1
    const bookings = (await redis.get(KEYS.bookings)) || []
    bookings.push(booking)
    await Promise.all([
      redis.set(KEYS.sessions, sessions),
      redis.set(KEYS.bookings, bookings),
    ])
    return res.json(booking)
  }

  if (req.method === 'DELETE') {
    if (!checkAdmin(req)) return res.status(401).json({ error: '인증 필요' })
    const { id } = parseBody(req)
    const bookings = (await redis.get(KEYS.bookings)) || []
    const bk = bookings.find(b => b.id === id)
    if (bk) {
      const sessions = (await redis.get(KEYS.sessions)) || []
      const idx = sessions.findIndex(s => s.id === bk.sessionId)
      if (idx >= 0 && sessions[idx].bookedCount > 0) sessions[idx].bookedCount -= 1
      await redis.set(KEYS.sessions, sessions)
    }
    await redis.set(KEYS.bookings, bookings.filter(b => b.id !== id))
    return res.json({ ok: true })
  }

  res.status(405).end()
}
