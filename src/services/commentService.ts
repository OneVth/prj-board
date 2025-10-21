import type { Comment, CommentFormData } from "../types/comment";

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
 * Comment Service - 모든 댓글 관련 API 호출
 */
export const commentService = {
  /**
   * 특정 게시글의 댓글 목록 조회
   * @param postId - 게시글 ID
   */
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
    return handleResponse<Comment[]>(response);
  },

  /**
   * 댓글 작성
   * @param postId - 게시글 ID
   * @param commentData - 댓글 데이터 (content, author)
   */
  async createComment(
    postId: string,
    commentData: CommentFormData
  ): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commentData),
    });
    return handleResponse<Comment>(response);
  },

  /**
   * 댓글 삭제
   * @param commentId - 댓글 ID
   */
  async deleteComment(commentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: "DELETE",
    });
    await handleResponse<{ message: string }>(response);
  },
};
