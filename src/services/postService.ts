import type { Post, PostFormData, PostListResponse } from "../types/post";

const API_BASE_URL = "http://localhost:8000/api";

/**
 * API 에러 처리 헬퍼 함수
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
}

/**
 * Post Service = 모든 게시글 관련 API 호출
 */
export const postService = {
  /**
   * 게시글 목록 조회 (페이지네이션)
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 게시글 수
   */
  async getAllPosts(page = 1, limit = 10): Promise<PostListResponse> {
    const response = await fetch(
      `${API_BASE_URL}/posts?page=${page}&limit=${limit}`
    );
    return handleResponse<PostListResponse>(response);
  },

  /**
   * 단일 게시글 조회
   * @param id - 게시글 ID
   */
  async getPostById(id: string): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`);
    return handleResponse<Post>(response);
  },

  /**
   * 게시글 생성
   * @param postData - 게시글 데이터 (title, content)
   */
  async createPost(postData: PostFormData): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    return handleResponse<Post>(response);
  },

  /**
   * 게시글 수정
   * @param id - 게시글 ID
   * @param postData - 수정할 데이터 (title, content 중 하나 이상)
   */
  async updatePost(id: string, postData: Partial<PostFormData>): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    return handleResponse<Post>(response);
  },

  /**
   * 게시글 삭제
   * @param id - 게시글 ID
   */
  async deletePost(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: "DELETE",
    });
    await handleResponse<{ message: string }>(response);
  },

  /**
   * 게시글 좋아요
   * @param id - 게시글 ID
   */
  async likePost(id: string): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/posts/${id}/like`, {
      method: "PATCH",
    });
    return handleResponse<Post>(response);
  },
};
