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
   * 댓글 작성 (인증 필요)
   * @param postId - 게시글 ID
   * @param commentData - 댓글 데이터 (content)
   * @param accessToken - JWT 액세스 토큰
   */
  async createComment(
    postId: string,
    commentData: CommentFormData,
    accessToken: string
  ): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(commentData),
    });
    return handleResponse<Comment>(response);
  },

  /**
   * 댓글 삭제 (인증 필요, 본인만 가능)
   * @param commentId - 댓글 ID
   * @param accessToken - JWT 액세스 토큰
   */
  async deleteComment(commentId: string, accessToken: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    await handleResponse<{ message: string }>(response);
  },
};
