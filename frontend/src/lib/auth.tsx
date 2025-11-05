import { useCallback, useEffect, useState, ReactNode } from 'react';
import { AuthState, LoginCredentials, LoginResponse, User } from '../types/auth.types';
import { axiosInstance, clearTokens, setAccessToken } from './axios';
import { AuthContext } from './authContext';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const navigate = useNavigate();
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    // Kiểm tra session hiện tại khi component mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Lấy thông tin user từ API (refresh token sẽ được gửi tự động qua cookie)
                const response = await axiosInstance.get<{ user: User; accessToken: string }>('/auth/me');
                const { user, accessToken } = response.data;

                // Lưu access token mới
                setAccessToken(accessToken);
                setState({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } catch (error) {
                // Xóa tokens nếu có lỗi và reset state
                clearTokens();
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
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
                    navigate('/login');
                }
            })();
    }, [navigate]);

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