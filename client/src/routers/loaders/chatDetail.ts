import server from "@/domain/chat/services";
import { redirect } from "react-router-dom";

export async function chatDetailLoader({ params }: any) {
  const id = params?.conversationId;
  if (!id) return null;
  try {
    await server.getConversationDetail(id);
    return null;
  } catch (e: any) {
    const msg = e?.message || "";
    if (/会话不存在/.test(msg)) {
      return redirect("/");
    }
    return null;
  }
}
