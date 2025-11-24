import { httpClient } from '@/api/mainInstance';
import type { OrderRequest, OrderResponse } from '@/types/order';

export const getOrdersAPI = async (customerId?: number) => {
  const params = customerId ? { customer_id: customerId } : {};
  return await httpClient.get<OrderResponse[]>('orders/', { params });
};

export const getOrderAPI = async (id: number) => {
  return await httpClient.get<OrderResponse>(`orders/${id}`);
};

export const postOrderAPI = async (body: OrderRequest) => {
  return await httpClient.post<OrderResponse>('orders/', body);
};
