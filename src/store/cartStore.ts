import { create } from 'zustand';
import { combine, devtools } from 'zustand/middleware';

import type { CartEntry, DinnerCart } from '@/types/cart';
import type { DefaultItem } from '@/types/dinner';

const initialState: { entries: CartEntry[] } = {
  entries: [],
};

export const useCartStore = create(
  devtools(
    combine(initialState, set => ({
      // actions for managing multiple dinner entries
      addEntry: (entry: CartEntry) =>
        set(state => ({ entries: [...state.entries, entry] })),

      updateEntry: (id: string, patch: Partial<CartEntry>) =>
        set(state => ({
          entries: state.entries.map(e =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),

      removeEntry: (id: string) =>
        set(state => ({ entries: state.entries.filter(e => e.id !== id) })),

      clearCart: () => set({ entries: [] }),

      // item actions scoped to an entry
      addItemToEntry: (entryId: string, item: DefaultItem) =>
        set(state => ({
          entries: state.entries.map(e =>
            e.id === entryId
              ? {
                  ...e,
                  dinner: {
                    ...e.dinner,
                    default_items: ((): DefaultItem[] => {
                      const exist = e.dinner.default_items.find(
                        i => i.item.code === item.item.code,
                      );
                      if (exist) {
                        return e.dinner.default_items.map(i =>
                          i.item.code === item.item.code
                            ? {
                                ...i,
                                default_qty: i.default_qty + item.default_qty,
                              }
                            : i,
                        );
                      }
                      return [...e.dinner.default_items, item];
                    })(),
                  },
                }
              : e,
          ),
        })),

      updateItemQtyInEntry: (entryId: string, code: string, qty: number) =>
        set(state => ({
          entries: state.entries.map(e => {
            if (e.id !== entryId) return e;
            return {
              ...e,
              dinner: {
                ...e.dinner,
                default_items: e.dinner.default_items.map(i =>
                  i.item.code === code ? { ...i, default_qty: qty } : i,
                ),
                items: e.dinner.items?.map(it =>
                  it.code === code ? { ...it, qty } : it,
                ),
              },
            };
          }),
        })),

      setItemOptionsInEntry: (
        entryId: string,
        code: string,
        options: number[],
      ) =>
        set(state => ({
          entries: state.entries.map(e =>
            e.id === entryId
              ? {
                  ...e,
                  dinner: {
                    ...e.dinner,
                    default_items: e.dinner.default_items.map(i =>
                      i.item.code === code ? { ...i, options } : i,
                    ),
                  },
                }
              : e,
          ),
        })),

      removeItemFromEntry: (entryId: string, code: string) =>
        set(state => ({
          entries: state.entries.map(e => {
            if (e.id !== entryId) return e;
            return {
              ...e,
              dinner: {
                ...e.dinner,
                default_items: e.dinner.default_items.filter(
                  i => i.item.code !== code,
                ),
                items: e.dinner.items?.filter(it => it.code !== code) ?? [],
              },
            };
          }),
        })),

      // convenience: add entry from dinner (generates id)
      addEntryFromDinner: (d: DinnerCart) =>
        set(state => ({
          entries: [
            ...state.entries,
            { id: `${d.dinner.code}-${Date.now()}`, dinner: d },
          ],
        })),
    })),
  ),
);

export default useCartStore;
