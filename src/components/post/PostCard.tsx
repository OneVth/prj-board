import { Link } from "react-router-dom";
import { formatTime } from "../../utils/dateFormat";
import type { Post } from "../../types/post";

// ============================================
// Props 타입 정의
// ============================================

interface PostCardProps {
  post: Post;
}

// ============================================
// PostCard 컴포넌트
// ============================================

function PostCard({ post }: PostCardProps) {
  return (
    <Link
      to={`/article/${post.id}`}
      className="block border-b border-gray-800 hover:bg-gray-900 transition-colors"
    >
      <article className="p-4">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
            {post.title[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{post.title}</p>
            <p className="text-sm text-gray-500">
              {formatTime(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Content Preview */}
        <p className="text-gray-300 mb-3 line-clamp-2">{post.content}</p>

        {/* Engagement Bar */}
        <div className="flex items-center gap-4 text-gray-500 text-sm">
          <span>❤️ {post.likes}</span>
          <span>💬 {post.commentCount}</span>
        </div>
      </article>
    </Link>
  );
}

export default PostCard;
export type { PostCardProps };
