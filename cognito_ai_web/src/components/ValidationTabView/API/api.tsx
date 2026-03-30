// import axios, { AxiosInstance } from "axios";



// const api: AxiosInstance = axios.create({
//   // baseURL: API_BASE_URL,
// });

// export default api;

import axios, { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
    // baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
        if (!config.headers) config.headers = {};
        config.headers['authentication'] = token;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;