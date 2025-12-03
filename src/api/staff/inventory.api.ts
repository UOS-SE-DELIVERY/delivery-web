import { httpClient } from '@/api/mainInstance';

export const getInventoryItemsAPI = async (
  params?: GetInventoryItemsParams,
) => {
  const res = await httpClient.get<GetInventoryItemsResponse>(
    'staff/inventory/items',
    { params },
  );
  return res.data;
};

export const postInventoryItemsAPI = async (
  data: PostInventoryItemsPayload,
) => {
  const res = await httpClient.post<GetInventoryItemsResponse>(
    'staff/inventory/items',
    data,
  );
  return res.data;
};

export const patchInventoryItemAPI = async (
  code: string,
  data: PatchInventoryItemPayload,
) => {
  const res = await httpClient.patch<InventoryItem>(
    `staff/inventory/items/${encodeURIComponent(code)}`,
    data,
  );
  return res.data;
};

// 타입 선언부
export type GetInventoryItemsParams = {
  active?: boolean;
  q?: string;
};

export type InventoryItem = {
  code: string;
  name: string;
  active: boolean;
  qty: number;
  category: string;
  soldout_reason: string | null;
  price_cents: number;
  updated_at: string | null;
};

export type GetInventoryItemsResponse = {
  count: number;
  items: InventoryItem[];
};

export type UpdateInventoryItemPayload = {
  code: string;
  qty?: number;
  delta?: number;
  active?: boolean;
  reason?: string;
};

export type PostInventoryItemsPayload = {
  items: UpdateInventoryItemPayload[];
};

export type PatchInventoryItemPayload = Omit<
  UpdateInventoryItemPayload,
  'code'
>;
