import axios, { AxiosRequestConfig } from 'axios';

const createClient = (config?: AxiosRequestConfig) => {
  const instance = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 1000 * 10,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    ...config,
  });

  return instance;
};

export const httpClient = createClient();
