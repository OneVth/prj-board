import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle } from "lucide-react";
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
  const navigate = useNavigate();

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${post.authorId}`);
  };

  return (
    <Link to={`/article/${post.id}`} className="block">
      <motion.article
        className="relative p-4 border-b border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:from-white/[0.08] hover:to-white/[0.02] transition-all duration-300 group"
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
      >
        {/* Gradient border on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl" />
        </div>

        <div className="relative z-10">
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-3">
            <motion.button
              onClick={handleAuthorClick}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm shadow-lg shadow-purple-500/30 cursor-pointer"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              {post.authorUsername?.[0]?.toUpperCase() || "?"}
            </motion.button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAuthorClick}
                  className="font-semibold hover:text-purple-400 transition-colors cursor-pointer"
                >
                  {post.authorUsername || "Unknown"}
                </button>
                <span className="text-gray-600">·</span>
                <p className="text-sm text-gray-500">
                  {formatTime(post.createdAt)}
                </p>
              </div>
              <h3 className="font-semibold text-white mt-1 group-hover:text-purple-300 transition-colors">
                {post.title}
              </h3>
            </div>
          </div>

          {/* Content Preview */}
          <p className="text-gray-300 mb-3 line-clamp-2 leading-relaxed">
            {post.content}
          </p>

          {/* Image Thumbnail */}
          {post.image && (
            <motion.div
              className="mb-3 overflow-hidden rounded-lg"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full border border-white/10 max-h-96 object-cover"
              />
            </motion.div>
          )}

          {/* Engagement Bar */}
          <div className="flex items-center gap-6 text-gray-400 text-sm">
            <motion.div
              className="flex items-center gap-1.5 hover:text-pink-400 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <Heart className="w-4 h-4" />
              <span className="font-medium">{post.likes}</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">{post.commentCount}</span>
            </motion.div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

export default PostCard;
export type { PostCardProps };
