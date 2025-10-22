import { useState, useEffect, useRef } from "react";

// ============================================
// Props 타입 정의
// ============================================

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSortChange: (sortBy: string) => void;
  initialQuery?: string;
  initialSort?: string;
}

// ============================================
// SearchBar 컴포넌트
// ============================================

function SearchBar({
  onSearch,
  onSortChange,
  initialQuery = "",
  initialSort = "date",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState(initialSort);
  const debounceTimerRef = useRef<number | null>(null);

  // 검색어 변경 시 debounce 적용
  useEffect(() => {
    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 500ms 후에 검색 실행
    debounceTimerRef.current = window.setTimeout(() => {
      onSearch(query);
    }, 500);

    // cleanup: 컴포넌트 unmount 시 타이머 정리
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, onSearch]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    onSortChange(newSort);
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div className="border-b border-gray-800 bg-black sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-3">
        {/* Search Input */}
        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full bg-gray-900 text-white rounded-full px-4 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {/* Search Icon */}
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            🔍
          </span>
          {/* Clear Button */}
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="bg-gray-900 text-white rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="date">Latest</option>
            <option value="likes">Most Liked</option>
            <option value="comments">Most Commented</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
export type { SearchBarProps };
