import { useNavigate } from 'react-router';

import { LogInOutBtn } from '@/components/LogInOutBtn';

export function CatalogHeader() {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 border-b bg-white/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/cart')}
            className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white"
          >
            장바구니
          </button>
          <button
            onClick={() => navigate('/orders/me')}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            나의 주문
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            나의 정보
          </button>
        </div>
        <LogInOutBtn />
      </div>
    </div>
  );
}
