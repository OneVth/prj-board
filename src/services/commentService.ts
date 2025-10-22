import type { Comment, CommentFormData } from "../types/comment";
import { API_BASE_URL, handleResponse } from "./api";

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
   * 댓글 좋아요 증가
   * @param commentId - 댓글 ID
   */
  async likeComment(commentId: string): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, {
      method: "PATCH",
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
