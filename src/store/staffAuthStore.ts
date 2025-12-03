import { create } from 'zustand';
import { combine, devtools } from 'zustand/middleware';

const initialState = {
  isLogin: false,
};

export const useStaffAuthStore = create(
  devtools(
    combine(initialState, set => ({
      storeLogin: () => {
        set({ isLogin: true });
      },
      storeLogout: () => {
        set({ isLogin: false });
      },
    })),
  ),
);
