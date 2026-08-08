import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export type RecipientReturnMessage = {
  id: string
  sender_kind: "artist" | "recipient"
  body: string
  created_at: string
}

export type RecipientConversationReturn = {
  conversation: {
    id: string
    package_id: string
    status: "active" | "archived" | "blocked" | "reported"
    last_message_at: string | null
    created_at: string
  }
  recipient: {
    email: string
    display_name: string
    organization_name: string
  }
  context: {
    artistName: string
    opportunityTitle: string
  }
  messages: RecipientReturnMessage[]
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("application-conversation", { body })
  if (error) throw error
  if (data?.error) {
    const requestError = new Error(data.message || data.error)
    requestError.name = data.error
    throw requestError
  }
  return data as T
}

export async function loadRecipientConversationReturn(conversationId: string) {
  return invoke<RecipientConversationReturn>({
    action: "resume_recipient_conversation",
    conversation_id: conversationId,
  })
}

export async function sendRecipientConversationReturnMessage(conversationId: string, body: string) {
  return invoke<{ message: RecipientReturnMessage }>({
    action: "send_recipient_reply",
    conversation_id: conversationId,
    body,
  })
}

export async function requestRecipientConversationReturn(email: string, conversationId: string) {
  const supabase = getSupabaseBrowserClient()
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim().replace(/^\/+|\/+$/g, "")
  const path = `${basePath ? `/${basePath}` : ""}/application-review/conversation/`
  const redirect = new URL(path, window.location.origin)
  redirect.searchParams.set("conversation", conversationId)
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: redirect.toString(),
      shouldCreateUser: false,
    },
  })
  if (error) throw error
}
