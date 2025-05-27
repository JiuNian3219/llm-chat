import { ICON_SIZE_MAP } from "../const";

/**
 * 获取图标大小
 * @param {"minuscule" | "small" | "medium" | "large"} size - 图标大小，可选值为 "small"、"medium" 或 "large"
 * @returns
 */
export function getIconSize(size) {
  return ICON_SIZE_MAP[size] || ICON_SIZE_MAP.medium;
}
