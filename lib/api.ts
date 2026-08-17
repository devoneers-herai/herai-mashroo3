const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type ChatRequest = {
  message: string;
  region_code?: string;
  persona?: string;
  domain_scope?: string;
  language?: string;
  conversation_id?: string;
};

export type ChatResponse = {
  response: string;
  safety_flag: "safe" | "block";
  conversation_id?: string;
};

export type Conversation = {
  id: string;
  title?: string | null;
  region_code?: string | null;
  region_config_version?: string | null;
  domain_scope?: string | null;
  persona?: string | null;
  created_at: string;
};

export type SavedMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function sendChatMessage(
  input: ChatRequest,
  accessToken: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const errorData = await response.json();

      if (errorData?.error) {
        message = errorData.error;
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function getConversations(
  accessToken: string
): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/api/chat/conversations`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let message = "Failed to load conversations.";

    try {
      const errorData = await response.json();

      if (errorData?.error) {
        message = errorData.error;
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(message);
  }

  const data = await response.json();

  return data.conversations || [];
}

export async function getConversationMessages(
  conversationId: string,
  accessToken: string
): Promise<SavedMessage[]> {
  const response = await fetch(
    `${API_URL}/api/chat/conversations/${conversationId}/messages`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Failed to load conversation.";

    try {
      const errorData = await response.json();

      if (errorData?.error) {
        message = errorData.error;
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(message);
  }

  const data = await response.json();

  return data.messages || [];
}
export async function deleteConversation(
  conversationId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/chat/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Failed to delete conversation.";

    try {
      const errorData = await response.json();

      if (errorData?.error) {
        message = errorData.error;
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(message);
  }
}