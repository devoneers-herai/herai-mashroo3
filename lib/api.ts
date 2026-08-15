const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type ChatRequest = {
  message: string;
  region_code?: string;
  persona?: string;
  domain_scope?: string;
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