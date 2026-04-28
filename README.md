# 라스트원 넥스트원 — 보충수업 신청 시스템 v2

Vite + React + TypeScript · Upstash Redis · Vercel 배포

---

## 로컬 실행

```bash
npm install
# .env.local 파일 생성 (아래 참조)
npm run dev
```

### .env.local (로컬 전용, git에 올리지 마세요)
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
ADMIN_PASSWORD=your-password
```

---

## 배포 순서

### 1. Upstash Redis 생성
1. [console.upstash.com](https://console.upstash.com) → Create Database
2. Region: `ap-northeast-1` (도쿄 추천)
3. REST URL과 REST Token 복사

### 2. GitHub Push
```bash
git add .
git commit -m "feat: Redis + 세션 관리 + 결제수단 업데이트"
git push origin main
```

### 3. Vercel 배포
1. [vercel.com](https://vercel.com) → Import `luazencloud-design/lastone-booking`
2. **Environment Variables** 탭에서 3개 추가:

| Key | Value |
|-----|-------|
| `UPSTASH_REDIS_REST_URL` | Upstash에서 복사한 REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash에서 복사한 REST Token |
| `ADMIN_PASSWORD` | 관리자 비밀번호 (원하는 값) |

3. **Deploy** 클릭

> Vercel + Upstash 공식 연동을 쓰면 환경변수가 자동 주입됩니다.
> Vercel 대시보드 → Integrations → Upstash 검색

---

## 이후 코드 변경 → 배포
```bash
git add .
git commit -m "변경 내용"
git push origin main   # → Vercel 자동 재배포
```

---

## 아키텍처

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Vite + React 18 + TypeScript |
| API | Vercel Serverless Functions (`/api/`) |
| 데이터베이스 | Upstash Redis (멀티기기 공유) |
| 인증 | Vercel 환경변수 `ADMIN_PASSWORD` |
| 차트 | Chart.js 4 + react-chartjs-2 |

