import type {
  AnalyticsResponse,
  Business,
  BusinessCreateInput,
  BusinessUpdateInput,
  QueueResponse,
  Token,
  TokenStatusResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(
  path: string,
  init?: RequestInit & { accessToken?: string },
): Promise<T> {
  const { accessToken, ...rest } = init ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...rest.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createBusiness: (payload: BusinessCreateInput, accessToken: string) =>
    request<Business>("/api/business", {
      method: "POST",
      body: JSON.stringify(payload),
      accessToken,
    }),

  getMyBusiness: (accessToken: string) =>
    request<Business>("/api/business/mine", { accessToken }),

  getBusiness: (businessId: string) =>
    request<Business>(`/api/business/${businessId}`),

  updateBusiness: (businessId: string, payload: BusinessUpdateInput, accessToken: string) =>
    request<Business>(`/api/business/${businessId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      accessToken,
    }),

  pauseBusiness: (businessId: string, accessToken: string) =>
    request<Business>(`/api/business/${businessId}/pause`, {
      method: "POST",
      accessToken,
    }),

  resumeBusiness: (businessId: string, accessToken: string) =>
    request<Business>(`/api/business/${businessId}/resume`, {
      method: "POST",
      accessToken,
    }),

  getBusinessQr: (businessId: string) =>
    request<{ business_id: string; join_url: string }>(
      `/api/business/${businessId}/qr`,
    ),

  getAnalytics: (businessId: string, accessToken: string) =>
    request<AnalyticsResponse>(`/api/business/${businessId}/analytics`, { accessToken }),

  issueToken: (businessId: string) =>
    request<Token>(`/api/business/${businessId}/token`, { method: "POST" }),

  getTokenStatus: (tokenId: string) =>
    request<TokenStatusResponse>(`/api/token/${tokenId}/status`),

  getQueue: (businessId: string, accessToken: string) =>
    request<QueueResponse>(`/api/business/${businessId}/queue`, { accessToken }),

  callToken: (tokenId: string, accessToken: string) =>
    request<Token>(`/api/token/${tokenId}/call`, { method: "POST", accessToken }),

  serveToken: (tokenId: string, accessToken: string) =>
    request<Token>(`/api/token/${tokenId}/serve`, { method: "POST", accessToken }),

  skipToken: (tokenId: string, accessToken: string) =>
    request<Token>(`/api/token/${tokenId}/skip`, { method: "POST", accessToken }),

  restoreToken: (tokenId: string, accessToken: string) =>
    request<Token>(`/api/token/${tokenId}/restore`, { method: "POST", accessToken }),

  cancelToken: (tokenId: string) =>
    request<Token>(`/api/token/${tokenId}/cancel`, { method: "POST" }),

  getPushPublicKey: () => request<{ public_key: string }>("/api/push/public-key"),

  subscribeToPush: (
    tokenId: string,
    payload: { endpoint: string; p256dh: string; auth: string },
  ) =>
    request<{ subscribed: boolean }>(`/api/token/${tokenId}/push-subscribe`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
