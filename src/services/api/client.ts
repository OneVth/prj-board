/**
 * API Client - 공통 HTTP 요청 처리
 */

/**
 * API 에러 클래스
 * 서버로부터 받은 에러 정보를 구조화
 */
export class ApiError extends Error {
  statusCode: number;
  detail?: string;

  constructor(statusCode: number, message: string, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

/**
 * API 응답 처리 헬퍼 함수
 * 모든 서비스에서 공통으로 사용
 *
 * @param response - Fetch API Response 객체
 * @returns 파싱된 JSON 데이터
 * @throws ApiError - HTTP 에러 발생 시
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `HTTP error! status: ${response.status}`;

    throw new ApiError(response.status, errorMessage, errorData.detail);
  }
  return response.json();
}
