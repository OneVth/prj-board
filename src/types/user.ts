/**
 * User Type Definitions
 */

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}
