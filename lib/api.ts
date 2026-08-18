const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type ChatRequest = {
  message: string;
  region_code?: string;
  persona?: string;
  domain_scope?: string;
  language?: string;
};

export type ChatResponse = {
  response: string;
  safety_flag: "safe" | "adjust" | "block";
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

export async function getChatHistory(
  accessToken: string
): Promise<ChatHistoryMessage[]> {
  const response = await fetch(`${API_URL}/api/chat/history`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.messages || [];
}

export type CouncilMember = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
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
    throw new Error("Failed to fetch council members");
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
    throw new Error("Failed to approve council member");
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
    throw new Error("Failed to reject council member");
  }

  return response.json();
}

export async function applyForCouncil(
  accessToken: string
): Promise<CouncilMember> {
  const response = await fetch(`${API_URL}/api/council/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let msg = "Failed to submit council application";
    try {
      const err = await response.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}

export async function getCouncilStatus(
  userId: string,
  accessToken: string
): Promise<CouncilMember | null> {
  const response = await fetch(`${API_URL}/api/council/members/${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.status || null;
}