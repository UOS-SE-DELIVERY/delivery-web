import { httpClient } from '@/api/mainInstance';

export const getDinnerAPI = async (dinnerCode: string) => {
  return await httpClient.get(`catalog/dinners/${dinnerCode}`);
};
