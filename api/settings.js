const { redis, KEYS, checkAdmin } = require('./_redis')
const { parseBody } = require('./_parse')

const DEFAULT_SETTINGS = {
  className: '라스트원 넥스트원 보충',
  defaultPrice: 20000,
  smartStoreUrl: '',
  bankName: '',
  bankAccount: '',
  bankHolder: '',
  paymentMethods: { card: true, easypay: true, transfer: true },
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-password')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const raw = await redis.get(KEYS.settings)
    // 구버전 데이터에 누락된 필드를 DEFAULT_SETTINGS로 채움
    return res.json({ ...DEFAULT_SETTINGS, ...(raw || {}) })
  }

  if (req.method === 'PUT') {
    if (!checkAdmin(req)) return res.status(401).json({ error: '인증 필요' })
    const settings = { ...DEFAULT_SETTINGS, ...parseBody(req) }
    await redis.set(KEYS.settings, settings)
    return res.json(settings)
  }

  res.status(405).end()
}
