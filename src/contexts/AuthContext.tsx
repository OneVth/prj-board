import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "../services/authService";
import type { User, LoginRequest, RegisterRequest } from "../types/user";

/**
 * AuthContext의 타입 정의
 */
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 * - Access Token은 메모리(state)에 저장
 * - Refresh Token은 HttpOnly 쿠키에 저장 (백엔드에서 자동 처리)
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 앱 시작 시 Refresh Token으로 인증 상태 복구
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Refresh Token이 쿠키에 있으면 새로운 Access Token 발급
        const authResponse = await authService.refreshToken();
        setAccessToken(authResponse.access_token);

        // 새로운 Access Token으로 사용자 정보 가져오기
        const userData = await authService.getCurrentUser(
          authResponse.access_token
        );
        setUser(userData);
      } catch (error) {
        // Refresh Token이 없거나 만료된 경우 - 로그인 필요
        console.log("No valid refresh token, user needs to login");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * 로그인 함수
   */
  const login = async (data: LoginRequest) => {
    try {
      // 로그인 API 호출 (Access Token 받고, Refresh Token은 쿠키에 자동 저장)
      const authResponse = await authService.login(data);
      setAccessToken(authResponse.access_token);

      // 사용자 정보 가져오기
      const userData = await authService.getCurrentUser(
        authResponse.access_token
      );
      setUser(userData);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  /**
   * 회원가입 함수
   */
  const register = async (data: RegisterRequest) => {
    try {
      // 회원가입 API 호출
      await authService.register(data);

      // 회원가입 후 자동 로그인
      await login({ email: data.email, password: data.password });
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  /**
   * 로그아웃 함수
   */
  const logout = async () => {
    try {
      // 로그아웃 API 호출 (서버에서 Refresh Token 쿠키 삭제)
      await authService.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      // 클라이언트 상태 초기화
      setUser(null);
      setAccessToken(null);
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * - AuthContext를 쉽게 사용하기 위한 커스텀 훅
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
