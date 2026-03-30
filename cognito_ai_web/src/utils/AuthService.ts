import axios from 'axios';

class AuthService {
    private static instance: AuthService;

    private constructor() {}

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async keyLogin(): Promise<boolean> {
        try {
            window.location.href = `/api/auth/login`;
            return true;
        } catch (error) {
            console.error('Failed to redirect to login page:', error);
            return false;
        }
    }

    public async checkSession(): Promise<boolean> {
        try {
            const token = sessionStorage.getItem('access_token');
            if (!token) {
                return false;
            }

            const response = await axios.get('/api/auth/session/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data && response.data.email;
        } catch (error) {
            console.error('Error checking session:', error);
            return false;
        }
    }

    public async logout(): Promise<void> {
        try {
            const token = sessionStorage.getItem('access_token');
            if (token) {
                await axios.get('/api/auth/logout', {
                    headers: {
                        Authorization: `${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            sessionStorage.removeItem('access_token');
            window.location.href = '/api/auth/login';
        }
    }
}

export default AuthService.getInstance();