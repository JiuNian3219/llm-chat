import request from "@/base/utils/request";
import api from "@/domain/chat/const/api";
import { UPLOAD_LIMITS } from "@/domain/chat/const";
import { useFileStore } from "@/domain/chat/stores/fileStore";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { isImageType } from "@/domain/chat/utils";
import { UploadStatus, type ChatFile } from "@/src/types/chat";
import type { CancelResponse, UploadResponse } from "@/src/types/services";
import { message as antdMessage } from "antd";
import { isCancel } from "axios";

const { coze } = api;
const fileStore = () => useFileStore.getState();
const convStore = () => useConversation.getState();

// ─── 校验 ────────────────────────────────────────────────────────────────────

interface ValidationResult {
  valid: File[];
  errors: string[];
}

export function validateFiles(incoming: File[]): ValidationResult {
  const existing = fileStore().files;
  const valid: File[] = [];
  const errors: string[] = [];

  const remainingSlots = UPLOAD_LIMITS.maxFileCount - existing.length;
  if (remainingSlots <= 0) {
    errors.push(`最多上传 ${UPLOAD_LIMITS.maxFileCount} 个文件`);
    return { valid, errors };
  }

  const candidates = incoming.slice(0, remainingSlots);
  if (incoming.length > remainingSlots) {
    errors.push(
      `已选择 ${incoming.length} 个文件，超出剩余可上传数量 ${remainingSlots}，仅上传前 ${remainingSlots} 个`,
    );
  }

  const existingNames = new Set(existing.map((f) => `${f.name}_${f.size}`));

  for (const file of candidates) {
    const key = `${file.name}_${file.size}`;
    if (existingNames.has(key)) {
      errors.push(`"${file.name}" 已在上传队列中，跳过重复文件`);
      continue;
    }
    if (file.size > UPLOAD_LIMITS.fileSize) {
      const limitMB = (UPLOAD_LIMITS.fileSize / 1024 / 1024).toFixed(0);
      errors.push(`"${file.name}" 超过 ${limitMB}MB 大小限制`);
      continue;
    }
    existingNames.add(key);
    valid.push(file);
  }

  return { valid, errors };
}

// ─── 底层 API ────────────────────────────────────────────────────────────────

function uploadFileByCoze(
  file: File,
  conversationId: string | undefined,
  signal?: AbortSignal,
): Promise<{ data: UploadResponse }> {
  const { url, method } = coze.upload;
  const formData = new FormData();
  formData.append("file", file);
  if (conversationId) {
    formData.append("conversationId", conversationId);
  }
  return request(url, {
    method,
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
    signal,
  }) as Promise<{ data: UploadResponse }>;
}

function cancelFileUploadByCoze(
  fileId: string,
  filename: string,
): Promise<{ data: CancelResponse }> {
  const { url, method } = coze.cancelUpload;
  return request(url, {
    method,
    data: { fileId, filename },
  }) as Promise<{ data: CancelResponse }>;
}

// ─── 业务操作 ─────────────────────────────────────────────────────────────────

/**
 * 校验并上传文件列表。
 * 自动拦截超大文件、超量文件和重复文件，并通过 antdMessage 反馈。
 */
export function uploadFiles(rawFiles: File[]): void {
  if (!rawFiles || rawFiles.length === 0) return;

  const { valid, errors } = validateFiles(rawFiles);
  for (const err of errors) {
    antdMessage.warning(err);
  }
  if (valid.length === 0) return;

  const newChatFiles: ChatFile[] = valid.map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: isImageType(file.type) ? "image" : "file",
    status: UploadStatus.Uploading,
    file,
  }));

  fileStore().addFiles(newChatFiles);

  const conversationId = convStore().currentConversationId ?? undefined;

  for (const chatFile of newChatFiles) {
    const controller = new AbortController();
    fileStore().setAbortController(chatFile.id, controller);

    uploadFileByCoze(chatFile.file!, conversationId, controller.signal)
      .then((response) => {
        const { id: serverId, url } = response.data || {};
        fileStore().updateFile(chatFile.id, {
          id: serverId,
          status: UploadStatus.Done,
          url,
        });
        fileStore().removeAbortController(chatFile.id);
        antdMessage.success(`文件上传成功: ${chatFile.name}`);
      })
      .catch((error) => {
        if (isCancel(error)) {
          return;
        }
        fileStore().removeFile(chatFile.id);
        fileStore().removeAbortController(chatFile.id);
        antdMessage.error(
          `文件上传失败: ${chatFile.name}，${error?.message || "请稍后再试"}`,
        );
      });
  }
}

/**
 * 取消文件上传。
 * - 如果 HTTP 请求仍在进行中，先 abort 请求再通知后端
 * - 如果已上传完成，直接通知后端取消
 */
export function cancelFileUpload(fileId: string, filename: string): void {
  if (!fileId || !filename) return;

  const { abortControllers } = fileStore();
  const controller = abortControllers[fileId];

  if (controller) {
    controller.abort();
    fileStore().removeAbortController(fileId);
    fileStore().removeFile(fileId);
    return;
  }

  fileStore().updateFile(fileId, { status: UploadStatus.Canceling });

  cancelFileUploadByCoze(fileId, filename)
    .then((result) => {
      if (result.data?.status === "canceled") {
        fileStore().removeFile(fileId);
      } else {
        throw new Error("取消文件上传失败");
      }
    })
    .catch(() => {
      fileStore().updateFile(fileId, { status: UploadStatus.Done });
      antdMessage.error(`取消文件上传失败: ${filename}`);
    });
}
