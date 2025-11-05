import { useCallback, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthState, LoginCredentials, LoginResponse, User } from '../types/auth.types';
import { axiosInstance, clearTokens, setAccessToken } from './axios';
import { AuthContext } from './authContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    // Kiểm tra session hiện tại khi component mount
    useEffect(() => {
        const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
        const initializeAuth = async () => {
            // Chiến lược chống logout ngẫu nhiên khi F5: thử /auth/me trước để interceptor tự refresh.
            try {
                const meFirst = await axiosInstance.get<{ user: User; accessToken?: string }>("/auth/me");
                const { user, accessToken: maybeNewAccessToken } = meFirst.data;
                if (maybeNewAccessToken) setAccessToken(maybeNewAccessToken);
                setState({ user, isAuthenticated: true, isLoading: false });
                return;
            } catch {
                // Thất bại đường 1: thử đợi ngắn rồi refresh tường minh + gọi lại /auth/me
            }

            try {
                await sleep(150);
                const refreshResp = await axiosInstance.post<{ accessToken: string; user?: User }>("/auth/refresh", {});
                const bootAccessToken = refreshResp.data.accessToken;
                const bootUser = refreshResp.data.user;
                setAccessToken(bootAccessToken);
                if (bootUser) {
                    setState({ user: bootUser, isAuthenticated: true, isLoading: false });
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (queryClient as any).setQueryData(['me'], { user: bootUser });
                    return;
                }
                const meResp = await axiosInstance.get<{ user: User; accessToken?: string }>("/auth/me");
                const { user, accessToken: maybeNewAccessToken } = meResp.data;
                if (maybeNewAccessToken) setAccessToken(maybeNewAccessToken);
                setState({ user, isAuthenticated: true, isLoading: false });
            } catch {
                // Cuối cùng coi như chưa đăng nhập
                clearTokens();
                setState({ user: null, isAuthenticated: false, isLoading: false });
            }
        };

        initializeAuth();
    }, []);

    // Xử lý đăng nhập
    const login = useCallback(async (credentials: LoginCredentials) => {
        console.log('Attempting login...', credentials.email);
        
        try {
            // Gọi API đăng nhập
            const response = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
            const { user, accessToken } = response.data;
            console.log('Login successful, got access token');

            // Chỉ lưu access token trong memory
            setAccessToken(accessToken);
            setState({
                user,
                isAuthenticated: true,
                isLoading: false,
            });

            // Chuyển hướng sau khi đăng nhập thành công
            navigate('/home');

            // Invalidate and refetch user data
            queryClient.invalidateQueries({ queryKey: ['me'] });
        } catch (error: unknown) {
            console.log('Login failed, processing error...', error);
            // Xóa tokens nếu đăng nhập thất bại
            clearTokens();
            
            // Kiểm tra xem có phải AxiosError không
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const serverMessage = error.response?.data?.message;
                
                console.error('API Error:', {
                    status,
                    message: serverMessage,
                    data: error.response?.data
                });

                // Xử lý các trường hợp lỗi cụ thể
                switch (status) {
                    case 400:
                        throw new Error(serverMessage || 'Invalid email or password format. Password must be at least 6 characters.');
                    case 401:
                        throw new Error(serverMessage || 'Incorrect email or password.');
                    case 404:
                        throw new Error('Account not found.');
                    case 429:
                        throw new Error('Too many login attempts. Please try again in a few minutes.');
                    default:
                        throw new Error(serverMessage || 'Login failed. Please try again.');
                }
            }
            
            // Nếu không phải AxiosError, throw error gốc hoặc error mới
            if (error instanceof Error) {
                throw error;
            }
            
            throw new Error('An unexpected error occurred');
        }
    }, [navigate, setState]);

    // Xử lý đăng xuất
    const logout = useCallback(() => {
            (async () => {
                try {
                    // Call backend to clear refresh token cookie
                    await axiosInstance.post('/auth/logout', {}, { withCredentials: true });
                } catch (err) {
                    // ignore errors during logout call
                } finally {
                    clearTokens();
                    setState({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                    // Remove cached user data
                    queryClient.removeQueries({ queryKey: ['me'] });
                    navigate('/login');
                }
            })();
    }, [navigate, queryClient]);

    // Cập nhật thông tin user
    const updateUser = useCallback((user: User) => {
        setState((prev) => ({
            ...prev,
            user,
        }));
    }, []);

    // Hiển thị loading state
    if (state.isLoading) {
        return null;
    }

    // Render AuthContext.Provider với value
    return (
        <AuthContext.Provider 
            value={{
                ...state,
                login,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};