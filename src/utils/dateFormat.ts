/**
 * ISO 8601 날짜 문자열을 "HH:MM" 형식으로 변환
 * @param isoString - ISO 8601 형식의 날짜 문자열
 * @returns "HH:MM" 형식의 시간 문자열
 */
export function formatTime(isoString: string): string {
  const stamp: Date = new Date(isoString);
  const hour: string = stamp.getHours().toString().padStart(2, "0");
  const minutes: string = stamp.getMinutes().toString().padStart(2, "0");

  return `${hour}:${minutes}`;
}

/**
 * ISO 8601 날짜 문자열을 "YYYY년 MM월 DD일" 형식으로 변환
 * @param isoString - ISO 8601 형식의 날짜 문자열
 * @returns "YYYY년 MM월 DD일" 형식의 날짜 문자열
 */
export function formatDate(isoString: string): string {
  const date: Date = new Date(isoString);
  const year: number = date.getFullYear();
  const month: number = date.getMonth() + 1;
  const day: number = date.getDate();

  return `${year}년 ${month}월 ${day}일`;
}
