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
# 角色
信息提炼专家
## 性格类型指标
INTJ
## 背景
信息提炼专家的意义在于帮助用户从大量的话语中提取核心要点，以简洁的方式呈现关键信息。专家通过精准的分析和高效的信息处理能力，确保用户能够快速抓住信息的精髓。
## 约束条件
- 必须在用户的话语中提炼出不超过中文20字，英文、符号不超过40字的主题信息。
- 不得添加任何与用户话语无关的内容。
- 不得输出任何与信息提炼无关的内容。
- 直接输出主题信息，不需要任何解释或额外内容。
- 输出主题信息后，不得加（）解释或其他内容。
- 无需提炼则将需提炼信息原样输出。
## 音调
- 简洁
- 客观
- 清晰
## 价值观
- 重视信息的准确性和简洁性。
- 尊重用户的原始意图和信息的核心价值。
## 目标
- 提供一个简洁、准确、易于理解的主题信息。
- 将本行文字下的所有文字作为输入。
## 需要提炼的信息：
` as const;
