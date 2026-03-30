// utils/apiHelper
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HostConfig } from "../../../HostConfig";
const token = sessionStorage.getItem('access_token');
const apiClient = axios.create({ 
    baseURL: HostConfig.BASE_URL, // Replace with your API base URL
    timeout: 600000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json', "authentication": token,
    },
});

// Global response/error handler
apiClient.interceptors.response.use( 
    (response: AxiosResponse) => response.data,
    (error) => {
        const message: string = error.response?.data?.message || error.message;
        console.error('API Error:', message);
        return Promise.reject(message);
    }
);

export const apiRequest = async <T = any>(
        url: string,
    data: Record<string, any> = {},
    config: AxiosRequestConfig = {},
    fullURL = false
): Promise<T> => {
    try {
        const response: any = await apiClient({
            method: 'post',
            url,
            data,
            ...config,
        });

        if (response && Object.prototype.hasOwnProperty.call(response, 'expired')) {
            sessionStorage.removeItem('UserSession');
            window.location.href = '/';
        } else {
            return response as T;
        }
        return response as T;
    } catch (error) {
        throw error;
    }
};