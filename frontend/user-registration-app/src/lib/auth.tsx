import { useCallback, useEffect, useState, ReactNode } from 'react';
import { AuthState, LoginCredentials, LoginResponse, User } from '../types/auth.types';
import { axiosInstance, clearTokens, setAccessToken } from './axios';
import { AuthContext } from './authContext';
import { useNavigate } from 'react-router-dom';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
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
        try {
            // Gọi API đăng nhập
            const response = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
            const { user, accessToken } = response.data;
            console.log('Login Response accessToken:', accessToken);

            // Chỉ lưu access token trong memory
            setAccessToken(accessToken);
            setState({
                user,
                isAuthenticated: true,
                isLoading: false,
            });

            // Chuyển hướng sau khi đăng nhập thành công
            navigate('/home');
        } catch (error) {
            // Xóa tokens nếu đăng nhập thất bại
            clearTokens();
            throw error;
        }
    }, [navigate]);

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

    // Tạo object chứa các giá trị và function cần chia sẻ
    const value = {
        ...state,
        login,
        logout,
        updateUser,
    };

    // Hiển thị loading state
    if (state.isLoading) {
        return null;
    }

    // Render AuthContext.Provider với value
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};