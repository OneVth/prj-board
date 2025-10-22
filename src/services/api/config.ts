/**
 * API Configuration
 * 환경에 따라 다른 API URL을 사용할 수 있도록 설정
 */

// 개발 환경에서는 localhost:8000 사용
// 프로덕션 환경에서는 환경 변수 사용
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
