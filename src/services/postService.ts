import type { Post, PostFormData, PostListResponse } from "../types/post";
import { API_BASE_URL, handleResponse } from "./api";

/**
 * Post Service = 모든 게시글 관련 API 호출
 */
export const postService = {
  /**
   * 게시글 목록 조회 (페이지네이션, 검색, 정렬)
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 게시글 수
   * @param searchQuery - 검색어 (선택)
   * @param sortBy - 정렬 기준 (date, likes, comments)
   * @param accessToken - Access Token (선택, is_liked 계산용)
   */
  async getAllPosts(
    page = 1,
    limit = 10,
    searchQuery = "",
    sortBy = "date",
    accessToken?: string
  ): Promise<PostListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sortBy,
    });

    if (searchQuery) {
      params.append("q", searchQuery);
    }

    const headers: HeadersInit = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/posts?${params.toString()}`, {
      headers,
    });
    return handleResponse<PostListResponse>(response);
  },

  /**
   * 단일 게시글 조회
   * @param id - 게시글 ID
   * @param accessToken - Access Token (선택, is_liked 계산용)
   */
  async getPostById(id: string, accessToken?: string): Promise<Post> {
    const headers: HeadersInit = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      headers,
    });
    return handleResponse<Post>(response);
  },

  /**
   * 게시글 생성 (인증 필요)
   * @param postData - 게시글 데이터 (title, content)
   * @param accessToken - Access Token
   */
  async createPost(postData: PostFormData, accessToken: string): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(postData),
    });
    return handleResponse<Post>(response);
  },

  /**
   * 게시글 수정 (인증 필요)
   * @param id - 게시글 ID
   * @param postData - 수정할 데이터 (title, content 중 하나 이상)
   * @param accessToken - Access Token
   */
  async updatePost(
    id: string,
    postData: Partial<PostFormData>,
    accessToken: string
  ): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(postData),
    });
    return handleResponse<Post>(response);
  },

  /**
   * 게시글 삭제 (인증 필요)
   * @param id - 게시글 ID
   * @param accessToken - Access Token
   */
  async deletePost(id: string, accessToken: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    await handleResponse<{ message: string }>(response);
  },

  /**
   * 게시글 좋아요 토글 (인증 필요)
   * @param id - 게시글 ID
   * @param accessToken - Access Token
   */
  async likePost(id: string, accessToken: string): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/posts/${id}/like`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return handleResponse<Post>(response);
  },

  /**
   * 팔로우한 사용자들의 게시글 목록 조회 (인증 필요)
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 게시글 수
   * @param sortBy - 정렬 기준 (date, likes, comments)
   * @param accessToken - Access Token
   */
  async getFollowingPosts(
    page = 1,
    limit = 10,
    sortBy = "date",
    accessToken: string
  ): Promise<PostListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sortBy,
    });

    const response = await fetch(`${API_BASE_URL}/posts/following?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return handleResponse<PostListResponse>(response);
  },
};
