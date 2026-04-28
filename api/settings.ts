import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis, KEYS, checkAdmin } from './_redis'
import type { Settings } from '../src/types'

const DEFAULT_SETTINGS: Settings = {
  className: '라스트원 넥스트원 보충',
  defaultPrice: 20000,
  smartStoreUrl: '',
  bankName: '',
  bankAccount: '',
  bankHolder: '',
  paymentMethods: { card: true, easypay: true, transfer: true },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-password')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const raw = await redis.get<Settings>(KEYS.settings)
    return res.json(raw ?? DEFAULT_SETTINGS)
  }

  if (req.method === 'PUT') {
    if (!checkAdmin(req)) return res.status(401).json({ error: '인증 필요' })
    const settings: Settings = { ...DEFAULT_SETTINGS, ...req.body }
    await redis.set(KEYS.settings, settings)
    return res.json(settings)
  }

  res.status(405).end()
}
