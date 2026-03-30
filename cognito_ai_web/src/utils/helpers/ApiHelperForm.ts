import axios, { AxiosResponse } from 'axios';

const apiClient = axios.create({
    baseURL: window.location.origin,
    timeout: 600000,
    withCredentials: true,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('access_token');
    console.log('Interceptor running, token:', token); // check if this prints every time
    if (token) {
        if (!config.headers) config.headers = {};
        config.headers['authentication'] = token;
        console.log('Added Authorization header:', config.headers['Authorization']);
    }
    return config;
});

// Global response handler
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    (error) => {
        const message: string = error.response?.data?.message || error.message;
        console.error('API Error:', message);
        return Promise.reject(message);
    }
);

// Send FormData via POST using axios.post(url, data, config)
export const apiRequestForm = async <T = any>(
    url: string,
    data: FormData,
): Promise<T> => {
    try {
        console.log('Sending POST request to:', url);
        const response = await apiClient.post(url, data, {
            // No need to set headers.Content-Type here, axios sets it automatically for FormData
        });
        return response as T;
    } catch (error) {
        throw error;
    }
};
