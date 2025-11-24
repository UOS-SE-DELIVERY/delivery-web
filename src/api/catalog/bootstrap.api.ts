import { httpClient } from '@/api/mainInstance';

export const getCatalogAPI = async () => {
  return await httpClient.get('catalog/bootstrap');
};
