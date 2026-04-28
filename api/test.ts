import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis } from './_redis'

/**
 * 진단 엔드포인트 — 배포 후 브라우저에서 /api/test 접속
 * 모든 검사가 통과하면 서비스 정상 동작
 *
 * ⚠️  확인 후 이 파일은 삭제하거나 접근을 막는 것을 권장합니다.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const results: Record<string, { ok: boolean; value?: string; error?: string }> = {}

  // ── 1. 환경변수 확인 ────────────────────────────────────────────────────────
  const adminPw    = process.env.ADMIN_PASSWORD
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  results.env_ADMIN_PASSWORD = adminPw
    ? { ok: true,  value: `설정됨 (${adminPw.length}자)` }
    : { ok: false, error: 'Vercel 환경변수에 ADMIN_PASSWORD 없음' }

  results.env_UPSTASH_URL = redisUrl
    ? { ok: true,  value: redisUrl.slice(0, 40) + '...' }
    : { ok: false, error: 'Vercel 환경변수에 UPSTASH_REDIS_REST_URL 없음' }

  results.env_UPSTASH_TOKEN = redisToken
    ? { ok: true,  value: `설정됨 (${redisToken.length}자)` }
    : { ok: false, error: 'Vercel 환경변수에 UPSTASH_REDIS_REST_TOKEN 없음' }

  // ── 2. Redis 연결 및 쓰기 테스트 ────────────────────────────────────────────
  if (redisUrl && redisToken) {
    try {
      const testKey = 'ln:_diagnostics_test'
      const testVal = `ok_${Date.now()}`
      await redis.set(testKey, testVal, { ex: 30 }) // 30초 후 자동 삭제
      results.redis_write = { ok: true, value: `키 "${testKey}" 쓰기 성공` }

      // ── 3. Redis 읽기 테스트 ──────────────────────────────────────────────
      const readback = await redis.get<string>(testKey)
      results.redis_read = readback === testVal
        ? { ok: true,  value: `읽기 성공: "${readback}"` }
        : { ok: false, error: `값 불일치 — 기록: "${testVal}", 읽기: "${readback}"` }

      // ── 4. 실제 데이터 키 존재 확인 ──────────────────────────────────────
      const sessions = await redis.get('ln:sessions')
      const bookings = await redis.get('ln:bookings')
      const settings = await redis.get('ln:settings')

      results.data_sessions = { ok: true, value: sessions ? `${JSON.stringify(sessions).slice(0,60)}...` : '(비어있음 — 정상)' }
      results.data_bookings = { ok: true, value: bookings ? `${JSON.stringify(bookings).slice(0,60)}...` : '(비어있음 — 정상)' }
      results.data_settings = { ok: true, value: settings ? `${JSON.stringify(settings).slice(0,60)}...` : '(비어있음 — 정상)' }

    } catch (e: any) {
      results.redis_write = { ok: false, error: `Redis 오류: ${e.message}` }
    }
  } else {
    results.redis_write = { ok: false, error: 'Redis 환경변수 누락으로 테스트 불가' }
    results.redis_read  = { ok: false, error: 'Redis 환경변수 누락으로 테스트 불가' }
  }

  // ── 결과 집계 ──────────────────────────────────────────────────────────────
  const allOk = Object.values(results).every(r => r.ok)

  return res.status(allOk ? 200 : 500).json({
    status:  allOk ? '✅ 모든 검사 통과 — 서비스 정상' : '❌ 일부 검사 실패 — 아래 내용 확인',
    checks:  results,
    timestamp: new Date().toISOString(),
  })
}
