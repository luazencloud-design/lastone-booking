import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis, KEYS, checkAdmin } from './_redis'
import type { Session } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-password')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const raw = await redis.get<Session[]>(KEYS.sessions)
    return res.json(raw ?? [])
  }

  if (req.method === 'POST') {
    if (!checkAdmin(req)) return res.status(401).json({ error: '인증 필요' })
    const session: Session = req.body
    const sessions = (await redis.get<Session[]>(KEYS.sessions)) ?? []
    sessions.push(session)
    await redis.set(KEYS.sessions, sessions)
    return res.json(session)
  }

  if (req.method === 'DELETE') {
    if (!checkAdmin(req)) return res.status(401).json({ error: '인증 필요' })
    const { id } = req.body ?? {}
    const sessions = (await redis.get<Session[]>(KEYS.sessions)) ?? []
    await redis.set(KEYS.sessions, sessions.filter((s: Session) => s.id !== id))
    // Also remove associated bookings
    const bookings = (await redis.get<any[]>(KEYS.bookings)) ?? []
    await redis.set(KEYS.bookings, bookings.filter((b: any) => b.sessionId !== id))
    return res.json({ ok: true })
  }

  res.status(405).end()
}
