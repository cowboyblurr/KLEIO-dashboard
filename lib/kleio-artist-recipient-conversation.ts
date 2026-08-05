import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export type ArtistRecipientConversation = {
  id: string
  package_id: string
  status: "active" | "archived" | "blocked" | "reported"
  last_message_at: string | null
  recipient: {
    id: string
    email: string
    display_name: string
    organization_name: string
    identity_state: string
  }
}

export type ArtistRecipientMessage = {
  id: string
  conversation_id: string
  sender_kind: "artist" | "recipient"
  body: string
  created_at: string
}

export async function loadArtistRecipientConversation(packageId: string): Promise<ArtistRecipientConversation | null> {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  const supabase = getSupabaseBrowserClient()
  const { data: conversation, error } = await supabase
    .from("application_recipient_conversations")
    .select("id, package_id, status, last_message_at, recipient_identity_id")
    .eq("package_id", packageId)
    .eq("artist_user_id", account.user.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!conversation) return null

  const { data: identity, error: identityError } = await supabase
    .from("application_recipient_identities")
    .select("id, email, display_name, organization_name, identity_state")
    .eq("id", conversation.recipient_identity_id)
    .single()
  if (identityError) throw identityError

  return {
    id: conversation.id,
    package_id: conversation.package_id,
    status: conversation.status,
    last_message_at: conversation.last_message_at,
    recipient: identity,
  } as ArtistRecipientConversation
}

export async function loadArtistRecipientMessages(conversationId: string): Promise<ArtistRecipientMessage[]> {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("application_recipient_messages")
    .select("id, conversation_id, sender_kind, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
  if (error) throw error
  return (data ?? []) as ArtistRecipientMessage[]
}

export async function sendArtistRecipientReply(conversationId: string, body: string) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  const message = body.trim()
  if (!message || message.length > 4000) throw new Error("Write a reply between 1 and 4,000 characters.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("application_recipient_messages")
    .insert({
      conversation_id: conversationId,
      sender_kind: "artist",
      sender_user_id: account.user.id,
      sender_recipient_identity_id: null,
      body: message,
      client_nonce: crypto.randomUUID(),
    })
    .select("id, conversation_id, sender_kind, body, created_at")
    .single()
  if (error) throw error
  return data as ArtistRecipientMessage
}

export async function decideExtendedProfileRequest(requestId: string, approved: boolean, note = "") {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("application_extended_profile_requests")
    .update({
      status: approved ? "approved" : "denied",
      artist_decision_note: note.trim(),
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("artist_user_id", account.user.id)
    .eq("status", "requested")
    .select("id, status, requested_sections, artist_decision_note, decided_at")
    .single()
  if (error) throw error
  return data
}
