type CreateConversationInput = {
  user_id: string;
  region_code?: string;
  region_config_version?: string;
  domain_scope?: string;
  persona?: string;
};

export async function createConversation(
  input: CreateConversationInput,
  supabase: any
) {
  const { data, error } = await supabase
    .from("conversations")
    .insert([
      {
        user_id: input.user_id,
        region_code: input.region_code || null,
        region_config_version: input.region_config_version || null,
        domain_scope: input.domain_scope || null,
        persona: input.persona || null,
        message: null,
      },
    ])
    .select("id, user_id, region_code, region_config_version, domain_scope, persona, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getConversation(
  conversationId: string,
  userId: string,
  supabase: any
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, title, user_id, region_code, region_config_version, domain_scope, persona, created_at"
    )
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listConversations(
  userId: string,
  supabase: any
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, title, region_code, region_config_version, domain_scope, persona, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function deleteConversation(
  conversationId: string,
  userId: string,
  supabase: any
) {
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export default {
  createConversation,
  getConversation,
  listConversations,
  deleteConversation,
};