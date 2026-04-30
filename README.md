# 📚 라스트원 넥스트원 — 보충수업 신청 시스템 (lastone-booking)

> **학생용 보충수업 예약 + 관리자 대시보드 — Vite/React/TS + Vercel + Upstash Redis**
> 학생이 3단계로 신청하고, 관리자는 세션·신청·설정을 한 곳에서 관리합니다.

- **GitHub:** [luazencloud-design/lastone-booking](https://github.com/luazencloud-design/lastone-booking)
- **버전:** v2 (Redis 연동, 세션 관리, 결제수단, 로고 업데이트)
- **기술 스택:** Vite 5 + React 18 + TypeScript 5 · Chart.js 4 · Upstash Redis (REST) · Vercel Serverless

---

## 📋 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [파일 구성](#-파일-구성)
3. [데이터 모델](#-데이터-모델)
4. [학생 신청 흐름 (3단계)](#-학생-신청-흐름-3단계)
5. [관리자 화면 (4탭)](#-관리자-화면-4탭)
6. [API 엔드포인트](#-api-엔드포인트)
7. [Redis 키 스키마](#-redis-키-스키마)
8. [다운로드 방법](#-다운로드-방법)
9. [외부 서비스 연동 (Upstash + Vercel)](#-외부-서비스-연동-upstash--vercel)
10. [로컬 실행](#-로컬-실행)
11. [Vercel 배포](#-vercel-배포)
12. [트러블슈팅 + 진단](#-트러블슈팅--진단)
13. [후임자 메모](#-후임자-메모)

---

## 🎯 프로젝트 개요

**핵심 기능:**
- **학생용**: 세션 선택 → 정보 입력 → 결제수단 선택 후 신청
- **관리자용**: 세션 CRUD, 신청 조회/삭제, 대시보드 차트, 결제수단/계좌 설정
- **결제수단 4종**: 신용/체크카드(스마트스토어) · 간편결제(스마트스토어) · 무통장입금(계좌안내) · 무료
- **실시간 좌석 추적**: 신청 시 `bookedCount` 자동 증가, 진행바 색상 변화 (파랑 → 주황 → 빨강)

---

## 📁 파일 구성

```
lastone-booking/
├── public/                       정적 자산
│   ├── logo.png
│   └── favicon.svg
├── src/                          React 프론트엔드
│   ├── main.tsx                  React DOM 마운트
│   ├── App.tsx                   탭 전환 + 상태 관리 (학생/관리자)
│   ├── api.ts                    fetch 래퍼 (모든 API 호출)
│   ├── types.ts                  Session / Booking / Settings TypeScript 타입
│   ├── styles/
│   │   └── global.css            CSS 변수 기반 (다크모드 자동 지원)
│   └── components/
│       ├── StudentView.tsx       ⭐ 학생용 3단계 폼
│       ├── AdminView.tsx         관리자 진입점 (비밀번호 로그인)
│       ├── AdminDashboard.tsx    Chart.js 2개 (Bar + Doughnut) + 메트릭
│       ├── AdminSessions.tsx     세션 CRUD + 목록
│       ├── AdminBookings.tsx     신청 조회/삭제
│       └── AdminSettings.tsx     결제수단/계좌/스마트스토어 설정
├── api/                          Vercel Serverless Functions
│   ├── _redis.js                 Upstash Redis 연결 + checkAdmin 헬퍼
│   ├── auth.js                   POST /api/auth (관리자 비밀번호 검증)
│   ├── sessions.js               GET/POST/DELETE 세션 (DELETE 시 연쇄: 관련 신청도 삭제)
│   ├── bookings.js               GET/POST/DELETE 신청 (POST는 학생, GET/DELETE는 관리자)
│   ├── settings.js               GET/PUT 설정
│   ├── ping.js                   헬스체크 (의존성 0)
│   └── test.js                   진단 (환경변수 + Redis 읽기/쓰기 검증)
├── index.html                    Vite 진입점
├── vite.config.ts                React 플러그인 + base '/'
├── tsconfig.json                 strict: true, JSX: react-jsx
├── package.json                  React 18 / Vite 5 / Chart.js / Upstash
├── vercel.json                   /api/* 외 모든 경로 → /index.html (SPA)
└── README.md                     이 문서
```

---

## 🔢 데이터 모델

### Session (보충수업 세션)
```ts
{
  id: 'sl_1714320000000',         // 'sl_' + Date.now()
  subject: '수학',
  date: '2026-05-15',              // YYYY-MM-DD
  startTime: '14:00',              // HH:MM
  durationMinutes: 120,
  capacity: 20,
  bookedCount: 8,
  isFree: false,
  customPriceEnabled: false,
  price: 20000                     // 0 = 무료
}
```

### Booking (학생 신청)
```ts
{
  id: 'bk_1714320123456',
  sessionId: 'sl_1714320000000',
  name: '홍길동',
  phone: '010-1234-5678',
  paymentMethod: 'transfer',       // 'card'|'easypay'|'transfer'|'free'
  orderNumber: '홍길동',           // 카드/간편결제는 주문번호, 무통장은 입금자명
  createdAt: '2026-04-30T10:35:23Z'
}
```

### Settings (시스템 설정)
```ts
{
  className: '라스트원 넥스트원 보충',
  defaultPrice: 20000,
  smartStoreUrl: 'https://smartstore.naver.com/...',
  bankName: '국민은행',
  bankAccount: '000-1234-56789',
  bankHolder: '홍길동',
  paymentMethods: { card: true, easypay: true, transfer: true }
}
```

---

## 🧑‍🎓 학생 신청 흐름 (3단계)

```
[Step 1] 세션 선택
  ├─ 과목별 그룹화 표시
  ├─ 진행바 색상: <70% 파랑 / 70~99% 주황 / 100% 빨강
  └─ 마감 시 클릭 불가

[Step 2] 정보 입력
  ├─ 이름 (필수)
  ├─ 연락처 (필수)
  └─ 무료 세션이면 Step 3 건너뜀 → 즉시 제출

[Step 3] 결제 수단 선택 (유료 세션만)
  ├─ 신용/체크카드 (card) → 스마트스토어 링크 → 주문번호 입력
  ├─ 간편결제 (easypay)   → 스마트스토어 링크 → 주문번호 입력
  ├─ 무통장입금 (transfer) → 계좌정보 표시 → 입금자명 입력 (기본값: 수강생 이름)
  └─ 무료 (free)           → 입력 불필요

[제출]
  → POST /api/bookings { sessionId, name, phone, paymentMethod, orderNumber }
  → 서버: 세션 존재 확인 → 마감 확인 → bookedCount 증가
  → 성공 화면 (이름/과목/시간/결제수단)
```

---

## 👨‍💼 관리자 화면 (4탭)

### 1) Dashboard (대시보드)

**메트릭 4개:** 총 신청 / 예상 수입 / 충원율 / 오늘 신청

**Chart.js 2개:**
- Bar Chart — 세션별 신청/잔여
- Doughnut Chart — 전체 좌석 (filled vs remaining)

**최근 신청 5개** 미리보기.

### 2) Sessions (세션 관리)

세션 추가 폼:
```
과목 / 날짜 / 시작시간 / 소요시간 / 정원
isFree (무료 토글) / customPriceEnabled (가격 직접 설정)
실시간 미리보기 + [추가] 버튼
```

**가격 결정 로직:**
```js
if (isFree) → 0
else if (customPriceEnabled) → customPrice
else → settings.defaultPrice
```

**세션 삭제 시 연쇄:** 해당 sessionId 신청도 모두 삭제.

### 3) Bookings (신청 현황)

전체 신청 목록 (최신순), 예상 수입 합계, 개별 삭제 (bookedCount 자동 감소).

### 4) Settings (설정)

- 수업명, 기본 보충비
- 결제수단 토글 (card/easypay/transfer)
- 스마트스토어 URL
- 계좌정보 (bankName/bankAccount/bankHolder)

---

## 🛠 API 엔드포인트

| 메서드 | 경로 | 인증 | 동작 |
|--------|------|------|------|
| POST | `/api/auth` | - | 비밀번호 검증 (`{ ok: true }` or `401`) |
| GET | `/api/sessions` | - | 모든 세션 (학생도 조회) |
| POST | `/api/sessions` | `x-admin-password` | 새 세션 추가 |
| DELETE | `/api/sessions` | `x-admin-password` | 세션 삭제 + 관련 신청 연쇄 삭제 |
| GET | `/api/bookings` | `x-admin-password` ⚠️ | 신청 조회 (관리자만) |
| POST | `/api/bookings` | - | 학생 신청 (마감 검사 + bookedCount 증가) |
| DELETE | `/api/bookings` | `x-admin-password` | 신청 삭제 + bookedCount 감소 |
| GET | `/api/settings` | - | 설정 조회 (없으면 기본값) |
| PUT | `/api/settings` | `x-admin-password` | 설정 수정 |
| GET | `/api/ping` | - | 헬스체크 |
| GET | `/api/test` | - | 진단 (환경변수 + Redis 읽기/쓰기) |

---

## 💾 Redis 키 스키마

| 키 | 값 | 설명 |
|---|----|----|
| `ln:sessions` | `Session[]` | 모든 세션 (배열) |
| `ln:bookings` | `Booking[]` | 모든 신청 (배열) |
| `ln:settings` | `Settings` | 시스템 설정 (객체) |
| `ln:_test` | string | 헬스체크 임시 키 (TTL 30초) |

> ⚠️ **동시성 주의**: 두 학생이 동시에 마지막 자리에 신청하면 race condition 가능 (배열 전체를 읽기→쓰기 패턴). 좌석 1개 남았을 때 0~1명만 등록되는 게 아니라 둘 다 등록될 수 있음. Watch/Multi/Exec나 큐 시스템 고려 필요 (현재는 미해결).

---

## 📥 다운로드 방법

```bash
git clone https://github.com/luazencloud-design/lastone-booking.git
cd lastone-booking
npm install
```

---

## 🔑 외부 서비스 연동 (Upstash + Vercel)

### 1. Upstash Redis 생성

1. [console.upstash.com](https://console.upstash.com) → **Create Database**
2. Region: `ap-northeast-1` (Tokyo) 권장
3. **REST API** 탭에서 다음 2개 복사:
   - `UPSTASH_REDIS_REST_URL` (`https://xxx.upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN`
4. 무료 한도: 10,000 commands/일, 256MB — 일반 운영 충분

### 2. 환경변수 (Vercel Settings → Environment Variables)

| Name | Value | 필수 |
|------|-------|------|
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` | ✅ |
| `UPSTASH_REDIS_REST_TOKEN` | `AXXX...` | ✅ |
| `ADMIN_PASSWORD` | 직접 정한 강력한 비밀번호 | ✅ |

### 3. Vercel + Upstash 공식 연동 (추천)

Vercel 대시보드 → **Integrations** → "Upstash" 검색 → 설치하면 환경변수가 **자동 주입**.

---

## 💻 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. .env.local 생성 (git에 안 올림)
cat > .env.local <<EOF
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXX...
ADMIN_PASSWORD=test1234
EOF

# 3. 개발 서버 시작
npm run dev
# → http://localhost:5173

# 4. API 동작 확인
curl http://localhost:5173/api/ping
curl http://localhost:5173/api/test
```

> ⚠️ Vite의 `npm run dev`는 정적 파일만 서빙합니다. API를 로컬에서 테스트하려면 `vercel dev` 사용 권장.

```bash
npm i -g vercel
vercel dev   # 포트 3000 + API 통합
```

---

## 🚀 Vercel 배포

### STEP 1 — GitHub Push

```bash
git add .
git commit -m "feat: Redis + 세션 관리 + 결제수단"
git push origin main
```

### STEP 2 — Vercel Import

1. [vercel.com/new](https://vercel.com/new)
2. **Import** `luazencloud-design/lastone-booking`
3. **Environment Variables** 에서 위 3개(`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_PASSWORD`) 추가
4. **Deploy**

### STEP 3 — 배포 후 검증

```bash
curl https://your-domain.vercel.app/api/ping
# → {"ok":true,"time":"...","message":"API 라우팅 정상"}

curl https://your-domain.vercel.app/api/test
# → 모든 검사가 ok: true 인지 확인
```

### STEP 4 — 코드 변경 → 자동 재배포

```bash
git add .
git commit -m "변경 내용"
git push origin main   # → Vercel 자동 재배포
```

---

## 🛠 트러블슈팅 + 진단

### `/api/test` 활용

배포 후 `https://your-domain.vercel.app/api/test`로 한 번에 진단:

```json
{
  "env_ADMIN_PASSWORD": { "ok": true },
  "env_UPSTASH_URL": { "ok": true },
  "env_UPSTASH_TOKEN": { "ok": true },
  "redis_write": { "ok": true },
  "redis_read": { "ok": true },
  "data_sessions": { "ok": true, "count": 3 },
  "data_bookings": { "ok": true, "count": 12 }
}
```

| 증상 | 원인 / 해결 |
|------|-------------|
| `/api/auth` 401 | `ADMIN_PASSWORD` 환경변수 미설정 또는 오타. Vercel Settings 확인 + Redeploy |
| 세션 조회 빈 배열 | Redis 키가 다를 수 있음. `/api/test`의 `data_sessions.value` 확인 |
| `redis_write: ok=false` | Upstash URL/Token 오타 또는 Upstash 계정 차단. Upstash 대시보드 확인 |
| HTTP/2 에러 | Vercel rewrites 문제. `vercel.json`의 `/((?!api).*)` 패턴 확인 |
| 동시 신청 시 좌석 초과 | Race condition (현재 미해결). 큐/락 시스템 고려 필요 |
| 빌드 실패 (TypeScript) | `tsconfig.json` `strict: true`. 타입 에러 모두 fix 후 재배포 |

---

## 📝 후임자 메모

### 자주 변경하는 곳

| 변경 항목 | 위치 |
|----------|------|
| 결제수단 추가 | `src/types.ts` `PaymentMethod`, `src/components/StudentView.tsx` `PaymentStep`, `src/components/AdminSettings.tsx` |
| 진행바 색상 임계 | `src/components/StudentView.tsx` `pct >= 100/70` 조건 |
| Redis 키 prefix | `api/_redis.js` `KEYS.{sessions,bookings,settings}` |
| 기본 설정 | `api/settings.js` `DEFAULT_SETTINGS` |
| Chart.js 차트 종류 | `src/components/AdminDashboard.tsx` |
| 세션 ID 생성 방식 | `'sl_' + Date.now()` (현재) — UUID 도입 검토 |

### 알려진 제약

1. **Race Condition** — 동시 신청 시 좌석 초과 등록 가능 (Upstash REST 트랜잭션 미사용)
2. **백업 부재** — Upstash 자체 백업만 의존. 정기 export 권장
3. **관리자 단일 비밀번호** — 다중 관리자 / 권한 구분 미구현
4. **검색/필터 부재** — 관리자가 신청자 검색하려면 브라우저 Ctrl+F 사용
5. **알림 미구현** — 신청 성공 시 SMS/이메일 미발송 (학생은 화면 결과만 확인)

### 보안 주의

- `ADMIN_PASSWORD`는 메모리에만 저장 (`adminPw` state) — 새로고침 시 재로그인
- 비밀번호는 헤더 `x-admin-password` 로 전송 (HTTPS 필수)
- 비밀번호 자체를 저장하지 않음 (검증만 수행)
- 학생 개인정보(이름/연락처)는 Redis에 평문 저장 — GDPR 등 규제 대상이면 암호화 검토

### 인수인계 체크리스트

- [ ] GitHub repo collaborator 권한 받음
- [ ] Upstash 계정 + Redis 인스턴스 생성
- [ ] Vercel 프로젝트 멤버 추가됨
- [ ] 환경변수 3개 (URL, TOKEN, ADMIN_PASSWORD) 설정 + Redeploy
- [ ] `/api/test` 모두 ok 확인
- [ ] 학생 신청 테스트 (Step 1→2→3)
- [ ] 관리자 로그인 + 세션 추가/삭제
- [ ] 결제 수단 토글 / 계좌 설정
- [ ] 대시보드 차트 정상 표시
- [ ] 모바일 화면 (max-width 680px) 확인

### 의존성

```
React 18.3.1, TypeScript 5.5.3, Vite 5.4.2
Chart.js 4.4.0 + react-chartjs-2 5.2.0
@upstash/redis 1.34.0
@vercel/node 5.7.13
```

---

*라스트원 넥스트원 보충수업 신청 시스템 v2 — Vite/React/TS · Upstash Redis · Vercel*
