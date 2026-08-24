const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type ChatRequest = {
  message: string;
  region_code?: string;
  persona?: string;
  domain_scope?: string;
  language?: string;

  // If provided, the message is added to this existing conversation.
  // If omitted/null, the backend creates a new conversation.
  conversation_id?: string | null;
};

export type ChatResponse = {
  response: string;

  // Returned by the backend so the frontend knows which
  // conversation this message belongs to.
  conversation_id?: string | null;

  safety_flag?: "safe" | "adjust" | "block";

  verdict?: {
    action: "safe" | "adjust" | "block";
    bias_score: number;
    risk_score: number;
    matched_rule_ids: string[];
  };
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

export type ChatHistoryMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
  user_message: string;
  assistant_message: string;
};

export async function getConversations(
  accessToken: string
): Promise<ConversationSummary[]> {
  const response = await fetch(
    `${API_URL}/api/chat/conversations`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return data.conversations || [];
}

export async function deleteConversation(
  id: string,
  accessToken: string
): Promise<boolean> {
  const response = await fetch(
    `${API_URL}/api/chat/conversations/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.ok;
}

export async function getChatHistory(
  accessToken: string
): Promise<ChatHistoryMessage[]> {
  const response = await fetch(
    `${API_URL}/api/chat/history`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return data.messages || [];
}

export async function getConversationMessages(
  conversationId: string,
  accessToken: string
): Promise<ChatHistoryMessage[]> {
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
    return [];
  }

  const data = await response.json();

  return data.messages || [];
}

export type UserProfile = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  age?: number;
  domain?: string;
  country?: string;
  city?: string;
  created_at?: string;
  updated_at?: string;
};

export type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  age?: number;
  domain?: string;
  country?: string;
  city?: string;
};

export async function getUserProfile(
  accessToken: string
): Promise<UserProfile | null> {
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.profile || null;
}

export async function updateUserProfile(
  input: UpdateProfileInput,
  accessToken: string
): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let msg = "Failed to update profile";
    try {
      const err = await response.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  return data.profile;
}

export async function forgotPassword(
  email: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    let msg = "Failed to request password reset";
    try {
      const err = await response.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}

export async function resetPassword(
  password: string,
  accessToken: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    let msg = "Failed to reset password";
    try {
      const err = await response.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}

export type CouncilMember = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  motivation?: string;
  experience?: string;
  contribution?: string;
  availability?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    domain?: string;
    country?: string;
    city?: string;
    phone_number?: string;
  };
};

export type CouncilApplicationPayload = {
  motivation?: string;
  experience?: string;
  contribution?: string;
  availability?: string;
  agreement?: boolean;
};

export async function getCouncilMembers(
  accessToken: string,
  statusFilter?: string
): Promise<CouncilMember[]> {
  let url = `${API_URL}/api/council/members`;

  if (statusFilter) {
    url += `?status=${statusFilter}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      "Failed to fetch council members"
    );
  }

  return response.json();
}

export async function approveCouncilMember(
  userId: string,
  accessToken: string
): Promise<CouncilMember> {
  const response = await fetch(
    `${API_URL}/api/council/members/${userId}/approve`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to approve council member"
    );
  }

  return response.json();
}

export async function rejectCouncilMember(
  userId: string,
  accessToken: string
): Promise<CouncilMember> {
  const response = await fetch(
    `${API_URL}/api/council/members/${userId}/reject`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to reject council member"
    );
  }

  return response.json();
}

export async function applyForCouncil(
  accessToken: string,
  applicationData?: CouncilApplicationPayload
): Promise<CouncilMember> {
  const response = await fetch(
    `${API_URL}/api/council/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(applicationData || {}),
    }
  );

  if (!response.ok) {
    let msg =
      "Failed to submit council application";

    try {
      const err = await response.json();

      if (err.error) {
        msg = err.error;
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(msg);
  }

  return response.json();
}

export async function getCouncilStatus(
  userId: string,
  accessToken: string
): Promise<CouncilMember | null> {
  const response = await fetch(
    `${API_URL}/api/council/members/${userId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return data.status || null;
}