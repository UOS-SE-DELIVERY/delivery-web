# 미스터 대박 디너 서비스 (Delivery Web)

프리미엄 디너 배달 서비스를 위한 고객 및 직원용 웹 애플리케이션입니다.

## 📋 프로젝트 개요

특별한 날을 위한 프리미엄 디너 주문 및 배달 관리 시스템으로, 고객용 주문 인터페이스와 직원용 관리 대시보드를 제공합니다.

## ✨ 주요 기능

### 고객 기능

- **디너 카탈로그**: 다양한 디너 메뉴 및 스타일 선택
- **음성 주문**: Web Speech API를 활용한 음성 기반 챗봇 주문
- **장바구니**: 디너 옵션 및 아이템 커스터마이징
- **주문 관리**: 실시간 주문 상태 확인 및 주문 내역 조회
- **프로필 관리**: 배송지, 개인정보 관리
- **회원 인증**: 로그인/회원가입

### 직원 기능

- **실시간 주문 모니터링**: SSE(Server-Sent Events)를 통한 실시간 주문 수신
- **주문 상태 관리**: 주문 접수부터 배달 완료까지 상태 업데이트
- **재고 관리**: 아이템 재고 조회 및 수정
- **주문 상세 조회**: 디너 구성, 옵션, 배송 정보 확인

## 🛠 기술 스택

- **Framework**: [React 18](https://react.dev/) with TypeScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting**: [ESLint](https://eslint.org/)
- **Formatting**: [Prettier](https://prettier.io/)

## 📁 프로젝트 구조

```
src/
├── api/              # API 클라이언트 및 엔드포인트
│   ├── auth/        # 고객 인증 API
│   ├── catalog/     # 카탈로그 API
│   ├── order/       # 주문 API
│   └── staff/       # 직원용 API (인증, 재고, 주문, SSE)
├── components/      # React 컴포넌트
│   ├── catalog/     # 카탈로그 관련 컴포넌트 (ChatbotOrder, DinnerModal)
│   ├── order/       # 주문 관련 컴포넌트
│   ├── profile/     # 프로필 관련 컴포넌트
│   └── staff/       # 직원용 컴포넌트 (Header, OrderModal, AuthInitializer)
├── hooks/           # 커스텀 React 훅
│   ├── useAuthErrorHandler.ts
│   └── useStaffAuthErrorHandler.ts
├── routes/          # 라우팅 설정 및 페이지
│   ├── index.tsx   # 라우트 설정
│   └── pages/      # 페이지 컴포넌트
│       ├── Cart.tsx
│       ├── Catalog.tsx
│       ├── Order.tsx
│       ├── MyOrder.tsx
│       ├── Profile.tsx
│       └── staff/  # 직원 페이지 (Home, Inventory, Login)
├── store/           # Zustand 스토어
│   ├── authStore.ts
│   ├── cartStore.ts
│   └── staffAuthStore.ts
├── types/           # TypeScript 타입 정의
│   ├── cart.ts
│   ├── dinner.ts
│   ├── item.ts
│   ├── order.ts
│   └── profile.ts
└── utils/           # 유틸리티 함수
```

## 🚀 시작하기

### 사전 요구사항

- [Node.js](https://nodejs.org/) (v18 이상 권장)
- [Yarn](https://yarnpkg.com/)

### 설치

저장소를 클론한 후 프로젝트 디렉토리로 이동하여 의존성을 설치합니다.

```bash
yarn install
```

### 개발 서버 실행

다음 명령어로 개발 서버를 시작합니다:

```bash
yarn dev
```

애플리케이션이 개발 모드로 시작됩니다. 브라우저에서 [http://localhost:5173](http://localhost:5173)를 열어 확인할 수 있습니다.

### 환경 설정

백엔드 API 서버가 다음 주소에서 실행 중이어야 합니다:

- 메인 API: `http://localhost:8000/api`
- 챗봇 API: `http://localhost:9000`

## 📜 사용 가능한 스크립트

- `yarn dev`: 개발 모드로 앱 실행
- `yarn build`: 프로덕션 빌드 생성 (`dist` 폴더)
- `yarn lint`: ESLint로 코드 검사
- `yarn preview`: 프로덕션 빌드 로컬 미리보기
- `yarn format`: Prettier로 코드 포맷팅

## 🔑 주요 기능 상세

### 음성 주문 챗봇

- Web Speech API 기반 음성 인식
- 마이크 권한 및 장치 접근 사전 확인
- 음성/텍스트 입력 모드 지원
- 주문 완료 시 자동 주문 생성 및 페이지 이동

### 실시간 주문 관리

- Server-Sent Events(SSE)를 통한 실시간 주문 스트림
- Bootstrap, order_created, order_updated 이벤트 처리
- 주문 상태 변경 (대기중 → 접수 → 준비중 → 배달중 → 완료)

### 인증 및 권한 관리

- 고객/직원 분리된 인증 시스템
- 401/403 에러 자동 처리 및 리다이렉트
- 컴포넌트 레벨 에러 핸들링 훅

## 🌐 라우트 구조

### 고객 라우트

- `/` - 홈
- `/catalog` - 디너 카탈로그
- `/cart` - 장바구니
- `/orders` - 주문하기
- `/orders/me` - 내 주문 내역
- `/profile` - 프로필 관리
- `/login` - 로그인
- `/join` - 회원가입

### 직원 라우트

- `/staff` - 주문 관리 대시보드
- `/staff/inventory` - 재고 관리
- `/staff/login` - 직원 로그인

## 🎨 UI/UX 특징

- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **테마 시스템**: 다크/라이트 모드 지원을 위한 ThemeProvider 기반 구축 (추후 구현 예정)
- **접근성**: 시맨틱 HTML 및 ARIA 레이블
- **최적화**: 컴포넌트 메모이제이션 및 지연 로딩

## 📄 라이선스

이 프로젝트는 UOS-SE-DELIVERY 팀의 소유입니다.
