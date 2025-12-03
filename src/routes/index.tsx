import { Cart } from '@pages/Cart';
import { Catalog } from '@pages/Catalog';
import { Home } from '@pages/Home';
import { Join } from '@pages/Join';
import { Login } from '@pages/Login';
import { MyOrder } from '@pages/MyOrder';
import { Order } from '@pages/Order';
import { Profile } from '@pages/Profile';
import { Home as StaffHome } from '@pages/staff/Home';
import { Inventory } from '@pages/staff/Inventory';
import { Login as StaffLogin } from '@pages/staff/Login';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { AuthInitializer } from '@/components/AuthInitializer';
import { AuthInitializer as StaffAuthInitializer } from '@/components/staff/AuthInitializer';

const router = createBrowserRouter([
  {
    path: '/',
    Component: AuthInitializer,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: 'join',
        Component: Join,
      },
      {
        path: 'login',
        Component: Login,
      },
      {
        path: 'catalog',
        Component: Catalog,
      },
      {
        path: 'cart',
        Component: Cart,
      },
      {
        path: 'profile',
        Component: Profile,
      },
      {
        path: 'orders',
        children: [
          {
            index: true, // /orders
            Component: Order,
          },
          {
            path: 'me', // /orders/me
            Component: MyOrder,
          },
        ],
      },
      {
        path: 'staff',
        Component: StaffAuthInitializer,
        children: [
          {
            index: true,
            Component: StaffHome,
          },
          {
            path: 'login',
            Component: StaffLogin,
          },
          {
            path: 'inventory',
            Component: Inventory,
          },
        ],
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
