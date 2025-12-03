import { httpClient } from '@/api/mainInstance';
import { ItemDetail } from '@/types/item';

export const getCatalogItemsAPI = async (
  itemCode: string,
): Promise<ItemDetail> => {
  const response = await httpClient.get<ItemDetail>(
    `catalog/items/${itemCode}`,
  );
  return response.data;
};
