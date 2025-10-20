/**
 * 게시글 데이터 타입
 * 백엔드 API에서 반환되는 게시글 객체의 구조
 */
export interface Post {
  readonly id: string; // MongoDB ObjectId를 문자열로 변환
  title: string; // 게시글 제목
  content: string; // 게시글 본문
  readonly created_at: string; // 게시글 생성 날짜; ISO 8601 날짜 문자열
  likes: number; // 좋아요 수
}

/**
 * 게시글 작성/수정 시 사용하는 폼 데이터 타입
 * id, created_at, likes는 서버에서 자동 생성
 */
export interface PostFormData {
  title: string;
  content: string;
}

/**
 * 페이지네이션된 게시글 목록 응답 타입
 * GET /api/posts 엔드포인트의 응답 구조
 */
export interface PostListResponse {
  posts: Post[]; // 게시글 배열
  totalPosts: number; // 전체 게시글 수
  currentPage: number; // 현재 페이지 번호
  totalPages: number; // 전체 페이지 수
}
