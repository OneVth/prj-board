import { useEffect, useRef } from "react";

/**
 * Intersection Observer를 활용한 무한 스크롤 Hook
 *
 * @param callback - 스크롤 끝에 도달했을 때 실행할 함수
 * @param hasMore - 더 로드할 데이터가 있는지 여부
 * @param loading - 현재 로딩 중인지 여부
 * @returns observerTarget - 관찰 대상 요소에 연결할 ref
 *
 * @example
 * const { observerTarget } = useInfiniteScroll(loadMore, hasMore, loading);
 * return (
 *   <>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     <div ref={observerTarget} />
 *   </>
 * );
 */
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  loading: boolean
) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 로딩 중이거나 더 이상 데이터가 없으면 Observer 설정 안 함
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 0.1 } // 10% 보이면 트리거
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [callback, hasMore, loading]);

  return { observerTarget };
}
