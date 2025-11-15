import { ICON_SIZE_MAP } from "../const";

export type IconSize = "minuscule" | "small" | "medium" | "large";

export function getIconSize(size?: IconSize): number {
  return ICON_SIZE_MAP[(size as IconSize) || "medium"] || ICON_SIZE_MAP.medium;
}
