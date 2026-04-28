const { redis } = require('./_redis')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const results = {}

  const adminPw    = process.env.ADMIN_PASSWORD
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  results.env_ADMIN_PASSWORD = adminPw
    ? { ok: true,  value: `설정됨 (${adminPw.length}자)` }
    : { ok: false, error: 'ADMIN_PASSWORD 환경변수 없음' }

  results.env_UPSTASH_URL = redisUrl
    ? { ok: true,  value: redisUrl.slice(0, 40) + '...' }
    : { ok: false, error: 'UPSTASH_REDIS_REST_URL 환경변수 없음' }

  results.env_UPSTASH_TOKEN = redisToken
    ? { ok: true,  value: `설정됨 (${redisToken.length}자)` }
    : { ok: false, error: 'UPSTASH_REDIS_REST_TOKEN 환경변수 없음' }

  if (redisUrl && redisToken) {
    try {
      const testKey = 'ln:_test'
      const testVal = `ok_${Date.now()}`
      await redis.set(testKey, testVal, { ex: 30 })
      results.redis_write = { ok: true, value: '쓰기 성공' }

      const readback = await redis.get(testKey)
      results.redis_read = readback === testVal
        ? { ok: true,  value: `읽기 성공: "${readback}"` }
        : { ok: false, error: `값 불일치 — 기록: "${testVal}", 읽기: "${readback}"` }

      const sessions = await redis.get('ln:sessions')
      const bookings = await redis.get('ln:bookings')
      results.data_sessions = { ok: true, value: sessions ? `${JSON.stringify(sessions).slice(0,60)}...` : '(비어있음)' }
      results.data_bookings = { ok: true, value: bookings ? `${JSON.stringify(bookings).slice(0,60)}...` : '(비어있음)' }
    } catch (e) {
      results.redis_write = { ok: false, error: `Redis 오류: ${e.message}` }
    }
  } else {
    results.redis_write = { ok: false, error: '환경변수 누락으로 테스트 불가' }
  }

  const allOk = Object.values(results).every(r => r.ok)
  return res.status(allOk ? 200 : 500).json({
    status: allOk ? '✅ 모든 검사 통과' : '❌ 일부 검사 실패',
    checks: results,
    timestamp: new Date().toISOString(),
  })
}
