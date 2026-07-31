import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"
import {
  clearKleioActiveUserScope,
  clearKleioSensitiveBrowserState,
  setKleioActiveUserScope,
} from "@/lib/kleio-client-session"

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://trekynurdgxgtaaqqtyq.supabase.co"
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_XdYXvd0fQm3IJKxNrFXgUQ_M4RgDj1M"

let browserClient: SupabaseClient | null = null

export type KleioAccountRole = "artist" | "institution" | "collaborator"

export type KleioAccount = {
  user: User
  profile: {
    id: string
    role: KleioAccountRole
    display_name: string | null
    email: string | null
    avatar_url: string | null
    onboarding_completed: boolean
  }
}

export type InstitutionMessengerContext = {
  institution_id: string
  institution_name: string
  member_role: string
  member_status: string
}

export type InstitutionMessengerMember = {
  user_id: string
  display_name: string
  avatar_url: string | null
  institution_role: string
  membership_status: string
  department: string | null
}

export type InstitutionConversationSummary = {
  conversation_id: string
  institution_id: string
  conversation_kind: "direct" | "group"
  conversation_title: string
  counterpart_user_id: string | null
  counterpart_name: string
  counterpart_avatar_url: string | null
  counterpart_role: string
  latest_message_body: string | null
  latest_message_sender_id: string | null
  latest_message_at: string | null
  unread_count: number
}

export type InstitutionMessage = {
  id: string
  conversation_id: string
  sender_user_id: string
  body: string
  client_nonce: string | null
  created_at: string
}

export function isKleioEmailConfirmed(user: User) {
  return Boolean(user.email_confirmed_at ?? user.confirmed_at)
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("The KLEIO Supabase client is only available in the browser.")
  }

  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }

  return browserClient
}

export async function loadKleioAccount(): Promise<KleioAccount | null> {
  const supabase = getSupabaseBrowserClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    clearKleioActiveUserScope()
    return null
  }
  if (!isKleioEmailConfirmed(userData.user)) {
    await supabase.auth.signOut()
    clearKleioSensitiveBrowserState()
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, display_name, email, avatar_url, onboarding_completed")
    .eq("id", userData.user.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile) {
    clearKleioActiveUserScope()
    return null
  }

  setKleioActiveUserScope(userData.user.id)
  return {
    user: userData.user,
    profile: profile as KleioAccount["profile"],
  }
}

export async function signInKleioAccount(email: string, password: string): Promise<KleioAccount> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) throw error
  if (!data.user || !isKleioEmailConfirmed(data.user)) {
    await supabase.auth.signOut()
    clearKleioSensitiveBrowserState()
    throw new Error("Email not confirmed.")
  }

  const account = await loadKleioAccount()
  if (!account) {
    await supabase.auth.signOut()
    clearKleioSensitiveBrowserState()
    throw new Error("This account does not have a KLEIO profile yet.")
  }

  return account
}

export async function signOutKleioAccount(): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } finally {
    clearKleioSensitiveBrowserState()
  }
}

export async function loadInstitutionMessengerContexts(): Promise<InstitutionMessengerContext[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("get_my_institution_contexts")
  if (error) throw error
  return (data ?? []) as InstitutionMessengerContext[]
}

export async function loadInstitutionConversations(
  institutionId: string,
): Promise<InstitutionConversationSummary[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("list_my_institution_conversations", {
    target_institution_id: institutionId,
  })
  if (error) throw error
  return (data ?? []) as InstitutionConversationSummary[]
}

export async function searchInstitutionMessengerMembers(
  institutionId: string,
  searchText: string,
): Promise<InstitutionMessengerMember[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("list_institution_messenger_members", {
    target_institution_id: institutionId,
    search_text: searchText,
  })
  if (error) throw error
  return (data ?? []) as InstitutionMessengerMember[]
}

export async function getOrCreateDirectInstitutionConversation(
  institutionId: string,
  otherUserId: string,
): Promise<string> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc(
    "get_or_create_direct_institution_conversation",
    {
      target_institution_id: institutionId,
      other_user_id: otherUserId,
    },
  )
  if (error) throw error
  if (typeof data !== "string") throw new Error("The conversation could not be resolved.")
  return data
}

export async function loadInstitutionMessages(
  conversationId: string,
): Promise<InstitutionMessage[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("institution_messages")
    .select("id, conversation_id, sender_user_id, body, client_nonce, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })

  if (error) throw error
  return (data ?? []) as InstitutionMessage[]
}

export async function markInstitutionConversationRead(conversationId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("mark_institution_conversation_read", {
    target_conversation_id: conversationId,
  })
  if (error) throw error
  return String(data)
}

export async function sendInstitutionMessage(
  conversationId: string,
  body: string,
  requestNonce: string,
): Promise<InstitutionMessage> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("send_institution_message", {
    target_conversation_id: conversationId,
    message_body: body,
    request_nonce: requestNonce,
  })
  if (error) throw error

  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error("The message was not confirmed by the server.")
  return row as InstitutionMessage
}
