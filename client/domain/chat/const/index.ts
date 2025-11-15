type UploadLimits = { fileSize: number; allowedTypes: string[]; maxFileCount: number };

export const UPLOAD_LIMITS: UploadLimits = {
  fileSize: 1024 * 1024 * 5, // 单个文件大小限制在5MB
  allowedTypes: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/pdf",
    "text/csv",

    // 编程文件
    "text/javascript",
    "text/x-c",
    "text/x-python",
    "text/x-java",
    "text/plain",
    "text/css",
    "text/html",
    "application/json",
    "text/markdown",

    // 图片类型
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic", 
    "image/heif",
    "image/bmp",
    "image/x-photo-cd",
    "image/tiff",
  ],
  maxFileCount: 10 // 最多上传10个文件
}