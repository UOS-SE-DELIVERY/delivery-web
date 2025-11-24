import { Cart } from '@pages/Cart';
import { Catalog } from '@pages/Catalog';
import { Home } from '@pages/Home';
import { Join } from '@pages/Join';
import { Login } from '@pages/Login';
import { MyOrder } from '@pages/MyOrder';
import { Order } from '@pages/Order';
import { Profile } from '@pages/Profile';
import { createBrowserRouter, RouterProvider } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: 'join',
    element: <Join />,
  },
  {
    path: 'login',
    element: <Login />,
  },
  {
    path: 'catalog',
    element: <Catalog />,
  },
  {
    path: 'cart',
    element: <Cart />,
  },
  {
    path: 'profile',
    element: <Profile />,
  },
  {
    path: 'orders',
    children: [
      {
        index: true, // /orders
        element: <Order />,
      },
      {
        path: 'me', // /orders/me
        element: <MyOrder />,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
