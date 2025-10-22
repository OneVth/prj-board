import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Send } from "lucide-react";
import { postService } from "../services/postService";
import { useAuth } from "../contexts/AuthContext";
import { PostForm, Header } from "../components";
import { Button } from "../components/ui/button";
import type { PostFormData } from "../types/post";

// ============================================
// New 컴포넌트
// ============================================

function New() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 제출 핸들러
  const handleSubmit = async (data: PostFormData) => {
    if (!accessToken) {
      setError("You must be logged in to create a post");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newPost = await postService.createPost(data, accessToken);
      navigate(`/article/${newPost.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
      setSubmitting(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    navigate("/");
  };

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header />

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-sm"
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Button
            onClick={handleCancel}
            disabled={submitting}
            variant="ghost"
            size="sm"
            className="rounded-full"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            New Post
          </h1>
          <Button
            onClick={() => {
              const form = document.querySelector("form");
              form?.requestSubmit();
            }}
            disabled={submitting}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Posting..." : "Post"}</span>
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <PostForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitButtonText="Post"
          isSubmitting={submitting}
          error={error}
        />
      </main>
    </div>
  );
}

export default New;
