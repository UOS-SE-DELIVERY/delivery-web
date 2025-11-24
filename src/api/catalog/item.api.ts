import { httpClient } from '@/api/mainInstance';

export const getCatalogItemsAPI = async (itemCode: string) => {
  return await httpClient.get(`catalog/items/${itemCode}`);
};
