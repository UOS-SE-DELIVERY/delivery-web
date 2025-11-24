/* eslint-disable react/no-unescaped-entities */
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { useAuthStore } from '@/store/authStore';

export function Home() {
  useEffect(() => {}, []);
  const navigate = useNavigate();
  const isLogin = useAuthStore(s => s.isLogin);
  return (
    <main className="mx-auto max-w-4xl p-8">
      {/* 히어로 섹션 */}
      <div className="bg-card outline-border animate-fade-in mb-10 rounded-2xl p-8 shadow-xl outline">
        <h1 className="mb-4 text-center text-5xl font-bold tracking-tight">
          미스터 대박 디너 서비스
        </h1>
        <p className="text-muted-foreground mb-4 text-center text-xl">
          특별한 날, 집에서 편안하게 최고의 만찬을!
        </p>
        <p className="text-accent-foreground text-center text-lg font-semibold italic">
          "당신의 남편, 아내, 엄마, 아버지 또는 친구를 감동시켜라"
        </p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate('/catalog')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transform rounded-xl px-8 py-3 text-lg font-bold shadow-lg transition-all hover:scale-105"
          >
            ✨ 지금 주문하기
          </button>
        </div>
      </div>
      {/* 주요 디너 메뉴 */}
      <section className="mb-10">
        <h2 className="text-secondary-foreground mb-4 text-2xl font-bold">
          🍷 주요 디너 메뉴
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2">
          <li className="border-border transform rounded-xl border bg-gradient-to-br from-red-50 to-pink-50 p-5 shadow-md transition-all hover:scale-105 hover:shadow-lg">
            <span className="text-primary mb-2 block text-xl font-bold">
              💝 발렌타인 디너
            </span>
            <p className="text-muted-foreground text-sm">
              하트와 큐피드 장식, 와인과 스테이크
            </p>
          </li>
          <li className="border-border transform rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-md transition-all hover:scale-105 hover:shadow-lg">
            <span className="text-primary mb-2 block text-xl font-bold">
              🇫🇷 프렌치 디너
            </span>
            <p className="text-muted-foreground text-sm">
              커피, 와인, 샐러드, 스테이크
            </p>
          </li>
          <li className="border-border transform rounded-xl border bg-gradient-to-br from-yellow-50 to-orange-50 p-5 shadow-md transition-all hover:scale-105 hover:shadow-lg">
            <span className="text-primary mb-2 block text-xl font-bold">
              🍳 잉글리시 디너
            </span>
            <p className="text-muted-foreground text-sm">
              에그 스크램블, 베이컨, 빵, 스테이크
            </p>
          </li>
          <li className="border-border transform rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-md transition-all hover:scale-105 hover:shadow-lg">
            <span className="text-primary mb-2 block text-xl font-bold">
              🥂 샴페인 축제 디너
            </span>
            <p className="text-muted-foreground text-sm">
              샴페인, 바게트빵, 커피, 와인, 스테이크 (2인)
            </p>
          </li>
        </ul>
      </section>
      {/* 서빙 스타일 */}
      <section className="mb-10">
        <h2 className="text-secondary-foreground mb-4 text-2xl font-bold">
          🎨 서빙 스타일
        </h2>
        <ul className="grid gap-5 sm:grid-cols-3">
          <li className="bg-muted border-border rounded-xl border p-5 shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              <span className="text-lg font-bold">심플 (Simple)</span>
            </div>
            <p className="text-muted-foreground text-sm">
              플라스틱 접시/컵, 종이 냅킨, 플라스틱 쟁반
            </p>
          </li>
          <li className="bg-muted border-border rounded-xl border p-5 shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">👑</span>
              <span className="text-lg font-bold">그랜드 (Grand)</span>
            </div>
            <p className="text-muted-foreground text-sm">
              도자기 접시/컵, 면 냅킨, 나무 쟁반
            </p>
          </li>
          <li className="bg-muted border-border rounded-xl border p-5 shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">💎</span>
              <span className="text-lg font-bold">디럭스 (Deluxe)</span>
            </div>
            <p className="text-muted-foreground text-sm">
              꽃병, 도자기 접시/컵, 린넨 냅킨, 나무 쟁반
            </p>
          </li>
        </ul>
        <p className="text-muted-foreground mt-3 rounded-lg bg-yellow-50 p-3 text-sm">
          ⚠️ 샴페인 축제 디너는 그랜드 또는 디럭스 스타일만 선택 가능합니다.
        </p>
      </section>
      {/* 정보 섹션 */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="bg-card rounded-xl p-6 shadow-md">
          <h2 className="text-secondary-foreground mb-3 text-xl font-bold">
            📋 주문 안내
          </h2>
          <ul className="text-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>회원가입 후 로그인하면 주문 가능</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>웹/음성인식으로 주문 지원</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>주문 후 메뉴 추가/변경/삭제 가능</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>이전 주문 내역을 통해 빠른 재주문 가능</span>
            </li>
          </ul>
        </section>

        <section className="bg-card rounded-xl p-6 shadow-md">
          <h2 className="text-secondary-foreground mb-3 text-xl font-bold">
            🎁 회원 혜택
          </h2>
          <ul className="text-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>단골 고객 할인 제공</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>주문 시 주소, 연락처 등 자동 입력</span>
            </li>
          </ul>
        </section>
      </div>
      {/* 푸터 */}
      <footer className="text-muted-foreground mt-10 rounded-xl bg-gray-50 p-6 text-center">
        <p className="mb-2 text-lg font-medium">
          미스터 대박은{' '}
          <span className="text-primary font-bold">10명의 직원</span>이
          <span className="font-semibold"> 15:30~22:00 </span>
          근무하며,
        </p>
        <p className="text-base">최고의 만찬을 안전하게 배달합니다. 🚚</p>
      </footer>

      {/* 하단 액션 버튼 (로그인 미상태에서만 노출) */}
      {!isLogin && (
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {/* 로그인 강조 버튼 */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="bg-primary text-primary-foreground w-full rounded-xl px-8 py-3 text-lg font-bold shadow-lg transition-all hover:opacity-90 sm:w-auto"
          >
            로그인
          </button>
          {/* 보조: 회원가입 버튼 */}
          <button
            type="button"
            onClick={() => navigate('/join')}
            className="w-full rounded-xl border border-gray-300 bg-white px-8 py-3 text-lg font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 sm:w-auto"
          >
            회원가입
          </button>
        </div>
      )}
    </main>
  );
}
