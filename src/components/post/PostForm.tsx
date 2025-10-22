import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Image, X } from "lucide-react";
import type { PostFormData } from "../../types/post";
import { fileToBase64, validateImageFile, createThumbnail } from "../../utils/imageUtils";
import { Button } from "../ui/button";

// ============================================
// Props 타입 정의
// ============================================

interface PostFormProps {
  initialTitle?: string;
  initialContent?: string;
  initialImage?: string | null;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
  submitButtonText: string;
  isSubmitting: boolean;
  error: string | null;
}

// ============================================
// PostForm 컴포넌트
// ============================================

function PostForm({
  initialTitle = "",
  initialContent = "",
  initialImage = null,
  onSubmit,
  onCancel: _onCancel,
  submitButtonText: _submitButtonText,
  isSubmitting,
  error,
}: PostFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [image, setImage] = useState<string | null>(initialImage);
  const [imageError, setImageError] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TITLE_MAX_LENGTH = 200;
  const CONTENT_MAX_LENGTH = 500;

  // 이미지 선택 핸들러
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setProcessingImage(true);

    try {
      // Validate file
      const validation = validateImageFile(file, 5);
      if (!validation.valid) {
        setImageError(validation.error || "Invalid image file");
        setProcessingImage(false);
        return;
      }

      // Convert to base64
      const base64 = await fileToBase64(file);

      // Create thumbnail
      const thumbnail = await createThumbnail(base64);

      setImage(thumbnail);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Failed to process image");
    } finally {
      setProcessingImage(false);
    }
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setImage(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 이미지 버튼 클릭 핸들러
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      image: image,
    });
  };

  // 제출 버튼 비활성화 조건
  const isSubmitDisabled = !title.trim() || !content.trim() || isSubmitting;

  return (
    <>
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400"
          role="alert"
        >
          ⚠️ {error}
        </motion.div>
      )}

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
      >
        {/* Gradient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-2xl blur-xl -z-10" />

        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              maxLength={TITLE_MAX_LENGTH}
              className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-500 focus:outline-none border-none focus:ring-0 transition-colors"
              disabled={isSubmitting}
              autoFocus
            />
            {/* Character Counter */}
            <div className="text-right text-xs text-gray-500 mt-2">
              {title.length} / {TITLE_MAX_LENGTH}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

          {/* Content Textarea */}
          <div className="mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={CONTENT_MAX_LENGTH}
              className="w-full h-64 bg-transparent text-lg text-white placeholder-gray-500 focus:outline-none resize-none border-none focus:ring-0 transition-colors"
              disabled={isSubmitting}
            />
            {/* Character Counter */}
            <div className="text-right text-xs text-gray-500 mt-2">
              {content.length} / {CONTENT_MAX_LENGTH}
            </div>
          </div>

          {/* Image Preview */}
          {image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 relative"
            >
              <img
                src={image}
                alt="Preview"
                className="w-full rounded-lg border border-white/10"
              />
              <Button
                type="button"
                onClick={handleRemoveImage}
                disabled={isSubmitting || processingImage}
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 rounded-full shadow-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Image Error */}
          {imageError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm"
            >
              {imageError}
            </motion.div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleImageSelect}
            className="hidden"
            disabled={isSubmitting || processingImage}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-6 border-t border-white/10">
            <Button
              type="button"
              onClick={handleImageButtonClick}
              disabled={isSubmitting || processingImage}
              variant="outline"
              size="sm"
              className="rounded-full border-white/20 bg-white/5 hover:bg-white/10"
            >
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">
                {processingImage ? "Processing..." : "Image"}
              </span>
            </Button>
          </div>

          {/* Hidden Submit Button (triggered by header button) */}
          <button type="submit" className="hidden" disabled={isSubmitDisabled} />
        </form>
      </motion.div>
    </>
  );
}

export default PostForm;
export type { PostFormProps };
