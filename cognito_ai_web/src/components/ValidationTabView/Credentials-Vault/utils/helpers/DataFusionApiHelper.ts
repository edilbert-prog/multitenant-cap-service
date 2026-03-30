// DataFusion API Helper - uses nginx proxy on port 5200
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HostConfig } from "../../../HostConfig";
const token = sessionStorage.getItem('access_token');
const dataFusionApiClient = axios.create({
    baseURL: HostConfig.DATAFUSION_API,
    timeout: 600000,
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json', "authentication": token,
        'Accept': 'application/json',
    },
});

// Global response/error handler for DataFusion APIs
dataFusionApiClient.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    (error) => {
        const message: string = error.response?.data?.message || error.message;
        console.error('DataFusion API Error:', message);
        return Promise.reject(message);
    }
);

export const dataFusionApiRequest = async <T = any>(
    url: string,
    data: Record<string, any> = {},
    config: AxiosRequestConfig = {}
): Promise<T> => { 
    try {
        console.log(`🔄 DataFusion API Request to ${HostConfig.DATAFUSION_API}${url}:`, {
            method: 'post',
            url,
            data,
            config,
        });

        const response: any = await dataFusionApiClient({
            method: 'post',
            url,
            data,
            ...config,
        });

        console.log(`✅ DataFusion API Response from ${url}:`, response);
        return response as T;
    } catch (error) {
        console.error(`❌ DataFusion API Error for ${url}:`, error);
        throw error;
    }
};