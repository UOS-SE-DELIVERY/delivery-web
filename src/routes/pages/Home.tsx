export function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="bg-card outline-border dark:bg-card dark:outline-border/10 animate-fade-in mb-8 rounded-xl p-6 shadow-lg outline dark:shadow-none dark:-outline-offset-1">
        <h1 className="text-primary mb-4 text-center text-4xl font-bold">
          미스터 대박 디너 서비스
        </h1>
        <p className="text-muted-foreground mb-6 text-center text-lg">
          특별한 날, 집에서 편안하게 최고의 만찬을!
          <br />
          <span className="text-accent font-semibold">
            “당신의 남편, 아내, 엄마, 아버지 또는 친구를 감동시켜라”
          </span>
        </p>
      </div>
      <section className="mb-8">
        <h2 className="text-secondary mb-2 text-xl font-semibold">
          주요 디너 메뉴
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          <li className="bg-popover border-border rounded-lg border p-4 shadow">
            <span className="text-primary font-bold">발렌타인 디너</span>
            <br />
            하트와 큐피드 장식, 와인과 스테이크
          </li>
          <li className="bg-popover border-border rounded-lg border p-4 shadow">
            <span className="text-primary font-bold">프렌치 디너</span>
            <br />
            커피, 와인, 샐러드, 스테이크
          </li>
          <li className="bg-popover border-border rounded-lg border p-4 shadow">
            <span className="text-primary font-bold">잉글리시 디너</span>
            <br />
            에그 스크램블, 베이컨, 빵, 스테이크
          </li>
          <li className="bg-popover border-border rounded-lg border p-4 shadow">
            <span className="text-primary font-bold">샴페인 축제 디너</span>
            <br />
            샴페인, 바게트빵, 커피, 와인, 스테이크 (2~4인)
          </li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-secondary mb-2 text-xl font-semibold">
          서빙 스타일
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          <li className="bg-muted border-border rounded-lg border p-4">
            <span className="text-primary font-bold">심플(Simple)</span>
            <br />
            플라스틱 접시/컵, 종이 냅킨, 플라스틱 쟁반
          </li>
          <li className="bg-muted border-border rounded-lg border p-4">
            <span className="text-primary font-bold">그랜드(Grand)</span>
            <br />
            도자기 접시/컵, 면 냅킨, 나무 쟁반
          </li>
          <li className="bg-muted border-border rounded-lg border p-4">
            <span className="text-primary font-bold">디럭스(Deluxe)</span>
            <br />
            꽃병, 도자기 접시/컵, 린넨 냅킨, 나무 쟁반
          </li>
        </ul>
        <p className="text-muted-foreground mt-2 text-sm">
          샴페인 축제 디너는 그랜드 또는 디럭스 스타일만 선택 가능합니다.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-secondary mb-2 text-xl font-semibold">주문 안내</h2>
        <ul className="text-foreground list-disc space-y-1 pl-5">
          <li>회원가입 후 로그인하면 주문 가능</li>
          <li>웹/앱/음성인식으로 주문 지원</li>
          <li>주문 후 메뉴 추가/변경/삭제 가능</li>
          <li>이전 주문 내역을 통해 빠른 재주문 가능</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-secondary mb-2 text-xl font-semibold">회원 혜택</h2>
        <ul className="text-foreground list-disc space-y-1 pl-5">
          <li>단골 고객 할인 제공</li>
          <li>주문 시 주소, 연락처 등 자동 입력</li>
        </ul>
      </section>
      <footer className="text-muted-foreground mt-10 text-center text-sm">
        미스터 대박은{' '}
        <span className="text-primary font-bold">10명의 직원</span>이
        15:30~22:00 근무하며, 최고의 만찬을 안전하게 배달합니다.
      </footer>
      <div className="mt-8 flex justify-center">
        <button className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-lg px-6 py-2 font-semibold shadow transition-all">
          주문하러 가기
        </button>
      </div>
    </main>
  );
}
