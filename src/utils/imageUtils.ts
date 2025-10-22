/**
 * Image utility functions for base64 conversion and resizing
 */

/**
 * Convert File to base64 string
 * @param file - Image file to convert
 * @returns Promise<string> - Base64 encoded string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Resize image to specified dimensions using Canvas API
 * @param base64Image - Base64 encoded image string
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @returns Promise<string> - Resized base64 encoded string
 */
export function resizeImage(
  base64Image: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions and draw resized image
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };

    img.onerror = (error) => reject(error);
  });
}

/**
 * Validate image file
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5MB)
 * @returns Object with validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPG, PNG, and GIF are allowed.",
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Create thumbnail from image
 * @param base64Image - Base64 encoded image string
 * @returns Promise<string> - Thumbnail base64 encoded string (800x800)
 */
export function createThumbnail(base64Image: string): Promise<string> {
  return resizeImage(base64Image, 800, 800);
}
