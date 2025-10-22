import type { User } from "../types/user";
import type { Post } from "../types/post";
import type { Comment } from "../types/comment";
import { API_BASE_URL, handleResponse } from "./api";

/**
 * User Service - 모든 사용자 관련 API 호출
 */
export const userService = {
  /**
   * 사용자 프로필 조회
   * @param userId - 사용자 ID
   */
  async getUserProfile(userId: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    return handleResponse<User>(response);
  },

  /**
   * 사용자가 작성한 게시글 목록 조회
   * @param userId - 사용자 ID
   * @param limit - 최대 게시글 수 (기본값: 20)
   */
  async getUserPosts(userId: string, limit: number = 20): Promise<Post[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/posts?limit=${limit}`);
    return handleResponse<Post[]>(response);
  },

  /**
   * 사용자가 작성한 댓글 목록 조회
   * @param userId - 사용자 ID
   * @param limit - 최대 댓글 수 (기본값: 20)
   */
  async getUserComments(userId: string, limit: number = 20): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/comments?limit=${limit}`);
    return handleResponse<Comment[]>(response);
  },

  /**
   * 사용자 검색
   * @param query - 검색어 (username)
   * @param limit - 최대 결과 수 (기본값: 20)
   * @param accessToken - Access Token (선택, 인증된 경우 자신 제외)
   */
  async searchUsers(query: string, limit: number = 20, accessToken?: string): Promise<User[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const headers: HeadersInit = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/users/search?${params.toString()}`, {
      headers,
    });
    return handleResponse<User[]>(response);
  },

  /**
   * 사용자 팔로우
   * @param userId - 팔로우할 사용자 ID
   * @param accessToken - Access Token (필수)
   */
  async followUser(userId: string, accessToken: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return handleResponse<User>(response);
  },

  /**
   * 사용자 언팔로우
   * @param userId - 언팔로우할 사용자 ID
   * @param accessToken - Access Token (필수)
   */
  async unfollowUser(userId: string, accessToken: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return handleResponse<User>(response);
  },
};
