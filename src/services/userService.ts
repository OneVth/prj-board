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
};
