import { useState, useRef } from "react";
import type { PostFormData } from "../../types/post";
import { fileToBase64, validateImageFile, createThumbnail } from "../../utils/imageUtils";

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
        <div
          className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400"
          role="alert"
        >
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Title Input */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={TITLE_MAX_LENGTH}
            className="w-full bg-transparent text-2xl font-bold placeholder-gray-600 focus:outline-none border-none"
            disabled={isSubmitting}
            autoFocus
          />
          {/* Character Counter */}
          <div className="text-right text-sm text-gray-500 mt-1">
            {title.length} / {TITLE_MAX_LENGTH}
          </div>
        </div>

        {/* Content Textarea */}
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-64 bg-transparent text-lg placeholder-gray-600 focus:outline-none resize-none border-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Image Preview */}
        {image && (
          <div className="mb-6 relative">
            <img
              src={image}
              alt="Preview"
              className="w-full rounded-lg border border-gray-800"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isSubmitting || processingImage}
              className="absolute top-2 right-2 p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
              title="Remove image"
            >
              <span className="text-xl">❌</span>
            </button>
          </div>
        )}

        {/* Image Error */}
        {imageError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            {imageError}
          </div>
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

        {/* Icon Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={handleImageButtonClick}
            disabled={isSubmitting || processingImage}
            className={`p-2 transition-colors ${
              processingImage
                ? "text-gray-700 cursor-not-allowed"
                : "text-gray-500 hover:text-gray-300"
            }`}
            title={processingImage ? "Processing..." : "Upload image"}
          >
            <span className="text-2xl">{processingImage ? "⏳" : "🖼️"}</span>
          </button>
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
            disabled
            title="Emoji picker (coming soon)"
          >
            <span className="text-2xl">😊</span>
          </button>
        </div>

        {/* Hidden Submit Button (triggered by header button) */}
        <button type="submit" className="hidden" disabled={isSubmitDisabled} />
      </form>
    </>
  );
}

export default PostForm;
export type { PostFormProps };
