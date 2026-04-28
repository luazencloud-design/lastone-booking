import type { VercelRequest, VercelResponse } from '@vercel/node'

// 의존성 없는 최소 헬스체크
// 배포 후 /api/ping 접속 → {"ok":true} 가 나오면 API 라우팅 정상
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json({ ok: true, time: new Date().toISOString(), message: 'API 라우팅 정상' })
}
