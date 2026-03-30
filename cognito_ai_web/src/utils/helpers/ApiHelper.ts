import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HostConfig } from '../../../HostConfig';
import { getCsrfToken } from "../csrf";

const apiClient = axios.create({
  baseURL: HostConfig.BASE_URL,
  timeout: 600000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 */
apiClient.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();

  if (method !== "get") {
    const token = getCsrfToken();

    if (!token) {
      throw new Error("❌ CSRF not initialized");
    }

    config.headers = config.headers || {};
    (config.headers as any)["X-CSRF-Token"] = token;

    console.log("🚀 CSRF attached:", token);
  }

  return config;
});

/**
 * RESPONSE INTERCEPTOR
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    console.error("❌ API Error:", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

/**
 * POST helper
 */
export const apiRequest = async <T = any>(
  url: string,
  data: Record<string, any> = {},
  config: AxiosRequestConfig = {}
): Promise<T> => {
  return apiClient.post(url, data, config) as Promise<T>;
};

export default apiClient;