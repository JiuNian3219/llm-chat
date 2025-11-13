import { create } from "zustand";

/**
 * Chat 状态Store：
 * 统一管理聊天流程标志位与文件队列
 */

/**
 * @typedef {Object} ChatFile 聊天文件
 * @property {string} id 文件ID
 * @property {string} name 文件名
 * @property {number} size 文件大小
 * @property {"image"|"file"} type 文件类型
 * @property {"uploading"|"done"|"canceling"} status 文件状态
 * @property {File} [file] 文件对象
 * @property {string} [url] 文件URL
 */

/**
 * @typedef {Object} ChatStoreState 聊天状态
 * @property {ChatFile[]} files 聊天文件队列
 * @property {boolean} isFirst 是否是第一次聊天
 * @property {boolean} isChatCompleted 聊天是否完成
 * @property {boolean} isLoadingMessages 是否正在加载消息
 * @property {string|null} currentChatId 当前聊天ID
 * @property {(() => void)|null} cancelStreamRef 取消流式请求函数引用
 */

/**
 * @typedef {Object} ChatStoreActions 聊天状态操作
 * @property {(files: ChatFile[]) => void} setFiles 设置聊天文件队列
 * @property {(files: ChatFile[]) => void} addFiles 添加聊天文件到队列
 * @property {(id: string, partial: Partial<ChatFile>) => void} updateFile 更新聊天文件
 * @property {(id: string) => void} removeFile 从队列移除聊天文件
 * @property {(v: boolean) => void} setIsFirst 设置是否是第一次聊天
 * @property {(v: boolean) => void} setIsChatCompleted 设置聊天是否完成
 * @property {(v: boolean) => void} setIsLoadingMessages 设置是否正在加载消息
 * @property {(id: string|null) => void} setCurrentChatId 设置当前聊天ID
 * @property {(fn: (() => void)|null) => void} setCancelStreamRef 设置取消流式请求函数引用
 * @property {() => void} clearCancelStreamRef 清除取消流式请求函数引用
 * @property {() => void} resetFlowFlags 重置聊天流程标志位（不清除文件队列）
 */

export const useChatStore =
  (create((set, get) => ({
    files: /** @type {ChatFile[]} */ ([]),
    isFirst: false,
    isChatCompleted: true,
    isLoadingMessages: false,
    currentChatId: null,
    cancelStreamRef: null,

    setFiles: (files) => set({ files }),
    addFiles: (files) => set((state) => ({ files: state.files.concat(files || []) })),
    updateFile: (id, partial) =>
      set((state) => {
        const idx = state.files.findIndex((f) => f.id === id);
        if (idx === -1) return state;
        const next = state.files.slice();
        next[idx] = { ...next[idx], ...partial };
        return { files: next };
      }),
    removeFile: (id) =>
      set((state) => ({ files: state.files.filter((f) => f.id !== id) })),

    setIsFirst: (v) => set({ isFirst: !!v }),
    setIsChatCompleted: (v) => set({ isChatCompleted: !!v }),
    setIsLoadingMessages: (v) => set({ isLoadingMessages: !!v }),
    setCurrentChatId: (id) => set({ currentChatId: id || null }),

    setCancelStreamRef: (fn) => set({ cancelStreamRef: fn || null }),
    clearCancelStreamRef: () => set({ cancelStreamRef: null }),

    // 重置流程（不清除文件队列）
    resetFlowFlags: () =>
      set({ isChatCompleted: true, isLoadingMessages: false, currentChatId: null, cancelStreamRef: null }),
  })));