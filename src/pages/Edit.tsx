import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";
import { postService } from "../services/postService";
import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner, PostForm, Header } from "../components";
import { Button } from "../components/ui/button";
import type { Post, PostFormData } from "../types/post";

// ============================================
// Edit 컴포넌트
// ============================================

function Edit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  // 게시글 불러오기
  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        setError("Invalid post ID");
        return;
      }

      setLoading(true);

      try {
        const loadedPost = await postService.getPostById(id);
        setPost(loadedPost);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadPost();
    }
  }, [id]);

  // 폼 제출 핸들러
  const handleSubmit = async (data: PostFormData) => {
    if (!id) return;

    if (!accessToken) {
      setError("You must be logged in to edit a post");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updatedPost = await postService.updatePost(id, data, accessToken);
      navigate(`/article/${updatedPost.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
      setSubmitting(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    navigate(`/article/${id}`);
  };

  // ============================================
  // 렌더링
  // ============================================

  // Loading State
  if (loading) {
    return <LoadingSpinner />;
  }

  // Error State
  if (error && !post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4">
        <p className="text-red-400 text-xl mb-4">⚠️ {error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!post) {
    return null;
  }

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
            Edit Post
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
            <Save className="w-4 h-4" />
            <span>{submitting ? "Updating..." : "Update"}</span>
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <PostForm
          initialTitle={post.title}
          initialContent={post.content}
          initialImage={post.image}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitButtonText="Update"
          isSubmitting={submitting}
          error={error}
        />
      </main>
    </div>
  );
}

export default Edit;
