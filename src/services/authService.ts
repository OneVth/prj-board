import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
} from "../types/user";
import { API_BASE_URL, handleResponse } from "./api";

/**
 * Auth Service - 모든 인증 관련 API 호출
 */
export const authService = {
  /**
   * 회원가입
   * @param data - 회원가입 정보 (username, email, password)
   * @returns 생성된 사용자 정보
   */
  async register(data: RegisterRequest): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse<UserResponse>(response);
  },

  /**
   * 로그인
   * @param data - 로그인 정보 (email, password)
   * @returns access_token (refresh_token은 HttpOnly 쿠키로 자동 저장)
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 쿠키 전송을 위해 필요
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  /**
   * 현재 로그인한 사용자 정보 조회
   * @param accessToken - Access Token
   * @returns 사용자 정보
   */
  async getCurrentUser(accessToken: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return handleResponse<User>(response);
  },

  /**
   * Access Token 갱신
   * @returns 새로운 access_token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // refresh_token 쿠키 전송
    });
    return handleResponse<AuthResponse>(response);
  },

  /**
   * 로그아웃
   * @returns 로그아웃 성공 메시지
   */
  async logout(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include", // refresh_token 쿠키 전송
    });
    return handleResponse<{ message: string }>(response);
  },
};
