/**
 * 댓글 데이터 타입
 * 백엔드 API에서 반환되는 댓글 객체의 구조
 */
export interface Comment {
  readonly id: string; // MongoDB ObjectId를 문자열로 변환
  readonly postId: string; // 댓글이 속한 게시글 ID
  content: string; // 댓글 내용
  author: string; // 작성자 이름 (임시)
  readonly createdAt: string; // 댓글 생성 날짜; ISO 8601 날짜 문자열
  likes: number; // 좋아요 수
}

/**
 * 댓글 작성 시 사용하는 폼 데이터 타입
 * id, postId, createdAt, likes는 서버에서 자동 생성
 */
export interface CommentFormData {
  content: string;
  author: string;
}
