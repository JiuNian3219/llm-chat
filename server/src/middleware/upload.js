import multer from "multer";
import { UPLOAD_LIMITS } from "../services/utils/constants.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // 生成唯一的文件名，避免文件覆盖
    const uniqueSuffix =
      Date.now() + "-" + crypto.randomUUID();
    const fileExt = file.originalname.split('.').pop();
    cb(null, uniqueSuffix + '.' + fileExt);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_LIMITS.fileSize, // 单个文件大小限制
  },
  fileFilter: (req, file, cb) => {
    if (UPLOAD_LIMITS.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的文件类型"));
    }
  },
});

export const uploadMiddleware = upload.single("file");
