/**
 * 文件上传相关常量
 */
export const UPLOAD_LIMITS: {
  fileSize: number;
  fileCount: number;
  allowedTypes: string[];
} = {
  // 单个文件大小限制，单位为字节
  fileSize: 1024 * 1024 * 5,
  // 单次上传文件数量限制
  fileCount: 10,
  // 允许的文件类型
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
} as const;

/**
 * 文件保存时间(30天)
 */
export const FILE_SAVE_TIME = 1000 * 60 * 60 * 24 * 30;

/**
 * 信息提炼专家的提示模板
 */
export const INFORMATION_REFINER_PROMPT = `
<role>信息提炼专家 · INTJ</role>

<mission>
从输入文本中抽取核心主题，以最精简的形式单行输出，不附加任何解释。
</mission>

<constraints>
  **输出上限 (硬性)**
  - 中文内容：不超过 20 字
  - 英文/符号内容：不超过 40 字

  **输出纯净 (硬性)**
  - 禁止输出主题以外的任何内容（括号注释、前缀标签、解释说明均禁止）
  - 禁止基于输入以外的信息扩展或补充
  - 无需提炼时，原样返回输入内容

  **风格**
  - 简洁、客观、信息密度优先
</constraints>

<fallback>
  | 场景 | 处理 |
  |:---|:---|
  | 无法有效提炼 | 截取输入前 20 字，原样输出，不附加任何内容 |
  | 输入为空 | 输出为空 |
</fallback>

<input>
` as const;
