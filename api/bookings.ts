import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis, KEYS, checkAdmin } from './_redis'
import type { Session, Booking } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-password')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    if (!checkAdmin(req)) return res.status(401).json({ error: '인증 필요' })
    const raw = await redis.get<Booking[]>(KEYS.bookings)
    return res.json(raw ?? [])
  }

  if (req.method === 'POST') {
    const booking: Booking = req.body
    const sessions = (await redis.get<Session[]>(KEYS.sessions)) ?? []
    const idx = sessions.findIndex((s: Session) => s.id === booking.sessionId)
    if (idx < 0) return res.status(404).json({ error: '세션을 찾을 수 없습니다.' })
    if (sessions[idx].bookedCount >= sessions[idx].capacity)
      return res.status(409).json({ error: '이미 마감된 세션입니다.' })

    sessions[idx].bookedCount += 1
    const bookings = (await redis.get<Booking[]>(KEYS.bookings)) ?? []
    bookings.push(booking)

    await Promise.all([
      redis.set(KEYS.sessions, sessions),
      redis.set(KEYS.bookings, bookings),
    ])
    return res.json(booking)
  }

  if (req.method === 'DELETE') {
    if (!checkAdmin(req)) return res.status(401).json({ error: '인증 필요' })
    const { id } = req.body ?? {}
    const bookings = (await redis.get<Booking[]>(KEYS.bookings)) ?? []
    const bk = bookings.find((b: Booking) => b.id === id)
    if (bk) {
      const sessions = (await redis.get<Session[]>(KEYS.sessions)) ?? []
      const idx = sessions.findIndex((s: Session) => s.id === bk.sessionId)
      if (idx >= 0 && sessions[idx].bookedCount > 0) sessions[idx].bookedCount -= 1
      await redis.set(KEYS.sessions, sessions)
    }
    await redis.set(KEYS.bookings, bookings.filter((b: Booking) => b.id !== id))
    return res.json({ ok: true })
  }

  res.status(405).end()
}
