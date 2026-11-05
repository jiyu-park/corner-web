# corner-web

공유 오피스 "모퉁이"의 코어 웹(고객용)입니다. 회원가입, 멤버십 신청, 회의실 예약·취소를 합니다.

- Next.js (App Router) + TypeScript
- 백엔드: `corner-backend` (NestJS). 이 앱은 DB에 직접 접근하지 않고 백엔드 API만 부릅니다.

## 실행

```bash
cp .env.example .env.local   # 백엔드 주소를 적는다
npm install
npm run dev                  # http://localhost:3101
```

## 설정값

| 이름 | 설명 |
|---|---|
| `NEXT_PUBLIC_API_URL` | 백엔드 주소 (예: Render 주소). 브라우저에서 쓰는 값이라 비밀값을 넣지 않는다 |
| `NEXT_PUBLIC_DEMO_EMAIL`, `NEXT_PUBLIC_DEMO_PASSWORD` | (선택) 로그인 화면에 보여 줄 체험용 고객 계정. 가상 데이터용 계정만 넣는다 |

## 배포 (Vercel)

1. Vercel에서 이 저장소를 Import 한다. (Framework: Next.js, 기본 설정 그대로)
2. Environment Variables에 `NEXT_PUBLIC_API_URL` 을 배포된 백엔드 주소로 넣는다.
3. 배포된 주소를 백엔드의 `FRONTEND_URL`에 추가한다. (CORS)

## 화면

| 경로 | 내용 |
|---|---|
| `/signup`, `/login` | 가입·로그인 |
| `/` | 내 현황: 시간 지갑, 멤버십 신청·변경 |
| `/rooms` | 회의실 시간표와 예약 |
| `/reservations` | 내 예약, 취소, 인원 수정 |

서버가 규칙을 거절하면 "DB가 거절했어요" 또는 "백엔드가 거절했어요" 배지와 함께 이유를 보여 줍니다.
모든 데이터는 가상입니다.
