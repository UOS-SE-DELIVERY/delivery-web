import { Package, ShoppingBag, Ticket } from 'lucide-react';
import { NavLink } from 'react-router';

import { LogInOutBtn } from '@/components/staff/LogInOutBtn';

export function StaffHeader() {
  return (
    <header className="bg-card border-border sticky top-0 z-50 border-b shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-primary h-8 w-8" />
          <h1 className="text-foreground text-xl font-bold">Staff Dashboard</h1>
        </div>

        <nav className="flex items-center gap-4">
          <NavLink
            to="/staff"
            end
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Package className="h-4 w-4" />
            주문 관리
          </NavLink>

          <NavLink
            to="/staff/inventory"
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <ShoppingBag className="h-4 w-4" />
            재고 관리
          </NavLink>

          <NavLink
            to="/staff/coupons"
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Ticket className="h-4 w-4" />
            쿠폰 관리
          </NavLink>

          <LogInOutBtn />
        </nav>
      </div>
    </header>
  );
}
